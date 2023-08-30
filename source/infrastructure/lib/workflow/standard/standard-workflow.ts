#!/usr/bin/env node
/**********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';

import { EventPattern, RuleProps } from 'aws-cdk-lib/aws-events';
import { Bucket, IBucket } from 'aws-cdk-lib/aws-s3';
import { Queue, QueueEncryption } from 'aws-cdk-lib/aws-sqs';
import { EventSources, WorkflowStatus, WorkflowType } from '../../utils/constants';
import { AbstractWorkflow, EventPatternGenerator } from './abstract-workflow';

import { EventbridgeToStepfunctions } from '@aws-solutions-constructs/aws-eventbridge-stepfunctions';
import { ITable, Table } from 'aws-cdk-lib/aws-dynamodb';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { NagSuppressions } from 'cdk-nag';
import { Construct } from 'constructs';
import { addCfnSuppressRules } from '../../utils/cfn-nag-suppressions';
import { FailureFragment } from '../fragments/failure-fragment';

export interface StandardWorkflowProps {
    workflowName: string;
    workflowType: string;
    appNamespace: string;
    orchestratorBusArn: string;
    syncLambdaFunctionProps: lambda.FunctionProps;
    eventPatternCallback?: EventPatternGenerator;
    genUUID: string;
    uploadBucketArn?: string;
    inferenceBucketArn?: string;
    caseTableArn?: string;
}

export class StandardWorkflow extends AbstractWorkflow {
    public readonly stateMachine: sfn.StateMachine;
    public readonly snsTopic: Topic;
    public readonly jobResultLambda?: lambda.Function;
    public readonly workflowDeadLetterQueue: Queue;
    public readonly uploadDocBucket?: IBucket;
    public readonly inferenceBucket?: IBucket;
    public readonly batchJobBucket?: IBucket;
    public readonly stateMachineDefinition: sfn.State;
    public readonly caseTable?: ITable;

    constructor(scope: Construct, id: string, props: StandardWorkflowProps) {
        super(scope, id, props);

        if (this.isSyncWorkflowRequired(this.workflowType)) {
            const stepFunctionCallbackProps = {
                lambdaFunctionProps: props.syncLambdaFunctionProps,
                workflowName: this.workflowName,
                ...this.getDefaultQueueProps(),
                ...this.getDefaultSqsEventSourceProps(),
                ...this.getDefaultDLQProps()
            };

            this.syncRequestTask = this.createSyncStepFunctionCallback(stepFunctionCallbackProps);
            this.uploadDocBucket = Bucket.fromBucketArn(this, 'DocUploadBucket', props.uploadBucketArn!);
            this.inferenceBucket = Bucket.fromBucketArn(this, 'InferenceBucket', props.inferenceBucketArn!);
            this.caseTable = Table.fromTableArn(this, 'CaseTable', props.caseTableArn!);

            // granting permissions needed to read/write inferences
            this.inferenceBucket.grantReadWrite(this.syncRequestTask.lambda);
            this.caseTable.grantReadData(this.syncRequestTask.lambda);
            this.caseTable.grant(this.syncRequestTask.lambda, 'dynamodb:UpdateItem');

            // adding necessary env vars
            this.syncRequestTask.lambda.addEnvironment('S3_INFERENCE_BUCKET_NAME', this.inferenceBucket.bucketName);
            this.syncRequestTask.lambda.addEnvironment('CASE_DDB_TABLE_NAME', this.caseTable.tableName);

            NagSuppressions.addResourceSuppressions(
                this.syncRequestTask.lambda.role!.node.tryFindChild('DefaultPolicy') as iam.Policy,
                [
                    {
                        id: 'AwsSolutions-IAM5',
                        reason: 'workflows need to be granted read/write permissions to the inferences bucket',
                        appliesTo: [
                            'Action::s3:Abort*',
                            'Action::s3:GetBucket*',
                            'Action::s3:GetObject*',
                            'Action::s3:DeleteObject*',
                            'Action::s3:List*',
                            'Resource::<SyncInferenceS3BucketArn>/*'
                        ]
                    }
                ],
                true
            );
        }

        if (this.isAsyncJobWorkflowRequired(this.workflowType)) {
            const errMsg = 'Async processing is not yet available';
            console.error(errMsg);
            throw new Error(errMsg);
        }

        this.publishInferenceTask = this.createEventBridgePutEventsTask();
        this.workflowDeadLetterQueue = new Queue(this, 'FailureDLQ', {
            visibilityTimeout: cdk.Duration.minutes(15),
            retentionPeriod: cdk.Duration.days(7),
            encryption: QueueEncryption.KMS_MANAGED
        });

        const workflowChain = this.createWorkflowChain();

        const logGroup = new LogGroup(this, `${id}StateMachineLogGroup`, {
            logGroupName: `/aws/vendedlogs/states/${cdk.Aws.STACK_NAME}-StateMachineLogGroup--${props.genUUID}`
        });

        const stateMachineProps = {
            definitionBody: sfn.DefinitionBody.fromChainable(workflowChain),
            tracingEnabled: true,
            logs: {
                destination: logGroup,
                level: sfn.LogLevel.ERROR
            }
        } as sfn.StateMachineProps;

        // Once workflow orchestrator lambda publishes events on this
        // bus, it will trigger the stepfunction, based on a event rule,
        // that is defined using the callback function received in the props.
        const customEventBusToStepFunction = new EventbridgeToStepfunctions(this, 'CustomEventBusToWorkflow', {
            stateMachineProps: stateMachineProps,
            eventRuleProps: this.generateEventRuleProps(props.eventPatternCallback),
            existingEventBusInterface: this.orchestratorBus
        });

        this.stateMachine = customEventBusToStepFunction.stateMachine;

        // attach policy to role once statemachine is created
        if (this.isAsyncJobWorkflowRequired(this.workflowType)) {
            const errMsg = 'Async processing is not yet available';
            console.error(errMsg);
            throw new Error(errMsg);
        }

        NagSuppressions.addResourceSuppressions(this.workflowDeadLetterQueue, [
            {
                id: 'AwsSolutions-SQS3',
                reason: 'Resource is already a DLQ'
            },
            {
                id: 'AwsSolutions-SQS4',
                reason: 'Resource is already a DLQ.'
            }
        ]);

        NagSuppressions.addResourceSuppressions(this.stateMachine, [
            {
                id: 'AwsSolutions-SF1',
                reason: 'Comprehensive logging to be updated for prod'
            }
        ]);

        NagSuppressions.addResourceSuppressions(
            this.stateMachine.role.node.tryFindChild('DefaultPolicy') as iam.Policy,
            [
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'The ARN of the state machine is not avilable at the moment of assigning this policy',
                    appliesTo: ['Resource::*', 'Resource::arn:<AWS::Partition>:logs:<AWS::Region>:<AWS::AccountId>:*']
                }
            ]
        );

        NagSuppressions.addResourceSuppressions(
            this.stateMachine.role.node.tryFindChild('DefaultPolicy') as iam.Policy,
            [
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'The failure fragment creates an evaluate task which has a lambda under the hook and needs this permission',
                    appliesTo: ['Resource::<Evalda2d1181604e4a4586941a6abd7fe42dF371675D.Arn>:*']
                }
            ]
        );

        addCfnSuppressRules(this.stateMachine.role.node.tryFindChild('DefaultPolicy') as iam.Policy, [
            {
                id: 'W12',
                reason: 'The ARN of the state machine is not avilable at the moment of assigning this policy'
            }
        ]);

        addCfnSuppressRules(logGroup, [
            {
                id: 'W84',
                reason: 'CloudWatch LogGroups are encrypted with AWS Managed Key by default'
            }
        ]);
    }

    generateEventRuleProps(callback?: EventPatternGenerator): RuleProps {
        const eventPattern =
            callback !== undefined
                ? callback()
                : ({ source: [`${EventSources.WORKFLOW_ORCHESTRATOR}.${this.appNamespace}`] } as EventPattern);
        return {
            eventPattern: eventPattern,
            enabled: true
        } as RuleProps;
    }

    createWorkflowChain(): sfn.IChainable {
        this.map = this.createMapState('$.documentList');
        let mapIteratorState: sfn.IChainable;

        switch (this.workflowType) {
            case WorkflowType.SYNC_ONLY:
                mapIteratorState = this.createSkipDocChoice(this.getSyncRequestTask());
                break;

            case WorkflowType.ASYNC_ONLY:
                mapIteratorState = this.createSkipDocChoice(this.getAsyncJobRequestTask());
                break;

            case WorkflowType.SYNC_ASYNC:
                const syncAsyncChoice = this.createExecutionChoice();
                mapIteratorState = this.createSkipDocChoice(syncAsyncChoice);
                break;

            default:
                console.error('Invalid workflowType');
                throw new Error('Invalid workflowType');
        }

        this.map.iterator(mapIteratorState);
        this.map.next(this.setStatusValue(WorkflowStatus.SUCCESS)).next(this.publishInferenceTask);

        return sfn.Chain.start(
            // catches all errors that could happen OUTSIDE of the workflow execution task itself, including
            // a choice failure in the sync-async case, and re-publishing to the orchestratorBus.
            this.map.addCatch(
                new FailureFragment(this, 'Failure', {
                    orchestratorBus: this.orchestratorBus,
                    existingDeadLetterQueue: this.workflowDeadLetterQueue,
                    appNamespace: this.appNamespace,
                    failProps: {
                        cause: 'Exception thrown during execution of workflow'
                    }
                }),
                { resultPath: '$.error' }
            )
        );
    }

    private attachPolicyLambdaToStateMachine() {
        const _lambdaStateMachineTaskPolicy = new iam.Policy(this, 'LambdaStateMachineTask', {
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['states:SendTaskSuccess', 'states:SendTaskFailure', 'states:SendTaskHeartbeat'],
                    resources: [this.stateMachine.stateMachineArn]
                })
            ]
        });
        _lambdaStateMachineTaskPolicy.attachToRole(this.jobResultLambda?.role!);
    }

    private isSyncWorkflowRequired(workflowType: string): boolean {
        return workflowType === WorkflowType.SYNC_ONLY || workflowType === WorkflowType.SYNC_ASYNC;
    }

    private isAsyncJobWorkflowRequired(workflowType: string): boolean {
        return workflowType === WorkflowType.ASYNC_ONLY || workflowType === WorkflowType.SYNC_ASYNC;
    }
}
