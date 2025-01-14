#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';

import { EventBus, EventPattern, IEventBus, RuleProps } from 'aws-cdk-lib/aws-events';
import { EventSources, WorkflowType } from '../../utils/constants';
import { IChainable, Pass, Result } from 'aws-cdk-lib/aws-stepfunctions';
import { Queue, QueueEncryption, QueueProps } from 'aws-cdk-lib/aws-sqs';
import { StepFunctionCallback, StepFunctionCallbackProps } from '../fragments/stepfunction-callbacks';

import { Construct } from 'constructs';
import { EventBridgePutEvents } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { SqsEventSourceProps } from 'aws-cdk-lib/aws-lambda-event-sources';

export interface EventPatternGenerator {
    (): EventPattern;
}

export enum DocumentTypes {
    Passport,
    DriversLicense,
    PayStub,
    Application,
    Invoice,
    Receipt,
    VaccineProof
}

export interface AbstractWorkflowProps {
    workflowName: string;
    workflowType: string;
    appNamespace: string;
    orchestratorBusArn: string;
}

export abstract class AbstractWorkflow extends Construct {
    public syncRequestTask?: StepFunctionCallback;
    public publishInferenceTask: sfn.IChainable;
    public map: sfn.Map;
    public workflowName: string;
    public workflowType: string;
    public appNamespace: string;
    public orchestratorBus: IEventBus;
    public orchestratorBusArn: string;

    constructor(scope: Construct, id: string, props: AbstractWorkflowProps) {
        super(scope, id);
        this.workflowName = props.workflowName;
        this.workflowType = props.workflowType;
        this.appNamespace = props.appNamespace;
        this.orchestratorBusArn = props.orchestratorBusArn;
        this.orchestratorBus = EventBus.fromEventBusArn(this, 'CustomEventBus', props.orchestratorBusArn);
    }

    getDefaultQueueProps(timeoutMinutues?: number): QueueProps {
        const timeout = timeoutMinutues ? timeoutMinutues : 60;
        return {
            queueProps: {
                visibilityTimeout: cdk.Duration.minutes(timeout),
                encryption: QueueEncryption.KMS_MANAGED
            }
        } as QueueProps;
    }

    getDefaultDLQProps() {
        return {
            deadLetterQueueProps: {
                retentionPeriod: cdk.Duration.days(7),
                encryption: QueueEncryption.KMS_MANAGED
            } as QueueProps
        };
    }

    getDefaultSqsEventSourceProps() {
        // the default implementation does not set the maxBatchingWindow size,
        // since we want some of the inferences to be delivered in near real-time,
        // which implies that the lambda be invoked as soon as the message is in the queue.
        return {
            sqsEventSourceProps: {
                enabled: true,
                batchSize: 1 // to ensure that the AI services do not get throttled with multiple requests.
            } as SqsEventSourceProps
        };
    }

    /**
     * Publishes events to the custom event bus defined with the `orchestratorBusArn` parameter
     * used to instantiate this class.
     * @param taskInputFieldJsonPath The JSONPath representation of the event to publish
     * @returns EventBridgePutEvents sfn task constuct.
     */
    createEventBridgePutEventsTask(taskInputFieldJsonPath?: string) {
        const taskInputField = taskInputFieldJsonPath ? taskInputFieldJsonPath : '$';
        return new EventBridgePutEvents(this, 'EventBridgePublishEvents', {
            entries: [
                {
                    detail: sfn.TaskInput.fromJsonPathAt(taskInputField),
                    detailType: `PutEvent-${this.workflowName}`,
                    source: `${EventSources.WORKFLOW_STEPFUNCTION}.${this.appNamespace}`,
                    eventBus: this.orchestratorBus
                }
            ]
        });
    }

    /**
     * Creates a choice state with a condition to check if document in the document list:
     * If the current workflow stage is present in the 'documentWorkflow' list specifying the
     *      workflows required to process the document type
     * @param nextState
     * @param defaultState
     */
    createSkipDocChoice(nextState: sfn.IChainable) {
        const choice = new sfn.Choice(this, 'SkipDocChoice', {
            comment: 'Check if document in documentList is required to be processed',
            inputPath: '$'
        });
        choice.when(sfn.Condition.booleanEquals('$.stageExistsInDocumentWorkflow', true), nextState);
        choice.otherwise(new sfn.Succeed(this, 'DocProcessingSkipped'));
        return choice;
    }

    /**
     * Creates a choice state based on value of requested processingType to trigger either a
     * sync or an async job
     *
     * @returns sfn.Choice
     */
    createExecutionChoice() {
        const choice = new sfn.Choice(this, 'SyncAsyncChoice', {
            comment: 'Check if document in documentList is required to be processed and if execution sync or async',
            inputPath: '$'
        });
        choice.when(
            sfn.Condition.stringEquals('$.document.processingType', WorkflowType.SYNC_ONLY),
            this.getSyncRequestTask()
        );
        choice.when(
            sfn.Condition.stringEquals('$.document.processingType', WorkflowType.ASYNC_ONLY),
            this.getAsyncJobRequestTask()
        );

        return choice;
    }

    createSyncStepFunctionCallback(stepFunctionCallbackProps: StepFunctionCallbackProps): StepFunctionCallback {
        return new StepFunctionCallback(this, `${this.workflowName}StepFunctionCallback`, stepFunctionCallbackProps);
    }

    /**
     * Creates the path state to processes events used to trigger the state machine.
     * The input from the event bridge event is filtered here before processing.
     * It sets stage for the document to the current stage.
     * It uses an intrinsic function to calculate if current workflow stage is present
     * in the documentWorkflow list
     * @param itemsPath JsonPath of list of iterables
     * @returns
     */
    createMapState(itemsPath?: string): sfn.Map {
        const itemsPathJsonPath = itemsPath ?? '$';
        const inputPath = `$.detail.case`;
        const resultPath = `${inputPath}.${itemsPathJsonPath.replace('$.', '')}`;

        const map = new sfn.Map(this, `${this.workflowName}DocumentMap`, {
            inputPath: inputPath,
            itemsPath: itemsPathJsonPath,
            resultPath: resultPath,
            outputPath: `$.detail`,
            // parameters define the JSON that you want to override your default iteration input.
            parameters: {
                'document.$': '$$.Map.Item.Value.document',
                'inferences.$': '$$.Map.Item.Value.inferences',
                'stage.$': '$.stage',
                'stageExistsInDocumentWorkflow.$':
                    'States.ArrayContains($$.Map.Item.Value.document.documentWorkflow, $.stage)'
            }
        });
        return map;
    }

    setStatusValue(newStatus: string): sfn.Pass {
        const passState = new Pass(this, 'MarkStageSuccess', {
            result: Result.fromString(newStatus),
            resultPath: '$.case.status'
        });

        return passState;
    }

    getSyncRequestTask(): sfn.StateMachineFragment {
        if (!this.syncRequestTask) {
            console.error('Sync step function task undefined');
            throw new Error('Sync step function task undefined');
        }

        return this.syncRequestTask;
    }

    getAsyncJobRequestTask(): sfn.StateMachineFragment {
        const errMsg = 'Async processing is not yet available';
        console.error(errMsg);
        throw new Error(errMsg);
    }

    getSyncQueue(): Queue {
        if (!this.syncRequestTask) {
            console.error('Sync step function task undefined');
            throw new Error('Queue does not exist');
        }
        return this.syncRequestTask.sqsQueue;
    }

    /**
     * Uses workflow specific eventPattern to create a RuleProp that will be used
     * to create a Eventbridge rule to trigger this state machine.
     *
     * If callback is undefined, then a single event rule pattern is created to capture
     * all events. This will likely produce incorrect outputs, hence it is HIGHLY encouraged
     * to provide a callback function that returns the desired EventPattern object.
     *
     * @param callback function must return an EventPattern object
     * @returns
     */
    abstract generateEventRuleProps(callback?: EventPatternGenerator): RuleProps;

    /**
     * Creates instances of the various sfn tasks, the states, and chains
     * them together, which is used to create the state machine.
     */
    abstract createWorkflowChain(): IChainable;
}
