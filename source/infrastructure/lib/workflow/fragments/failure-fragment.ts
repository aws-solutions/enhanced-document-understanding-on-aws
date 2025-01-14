#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as task from 'aws-cdk-lib/aws-stepfunctions-tasks';

import {
    Fail,
    FailProps,
    INextable,
    JsonPath,
    Pass,
    Result,
    State,
    StateMachineFragment,
    TaskInput
} from 'aws-cdk-lib/aws-stepfunctions';
import { EventSources, WorkflowEventDetailTypes, WorkflowStatus } from '../../utils/constants';

import { IEventBus } from 'aws-cdk-lib/aws-events';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { EventBridgePutEvents } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';

export interface FailureFragmentProps {
    readonly orchestratorBus: IEventBus;
    readonly appNamespace: string;
    readonly existingDeadLetterQueue: Queue;
    readonly failProps?: FailProps;
}

export class FailureFragment extends StateMachineFragment {
    public readonly startState: State;
    public readonly endStates: INextable[];
    public readonly failState: Fail;
    public readonly deadLetterQueue: Queue;

    constructor(scope: Construct, id: string, props: FailureFragmentProps) {
        id = id === 'Failure' ? id : `${id}Failure`;
        super(scope, id);

        this.deadLetterQueue = props.existingDeadLetterQueue;
        this.failState = new Fail(this, id, props.failProps);

        const addFailureStatus = new Pass(this, `${id}MarkCaseStatusFailure`, {
            result: Result.fromString(WorkflowStatus.FAILURE),
            resultPath: '$.detail.case.status'
        });

        const publishFailureTask = new EventBridgePutEvents(this, `${id}EventBridgePublishFailureEvents`, {
            entries: [
                {
                    detail: TaskInput.fromJsonPathAt('$'),
                    detailType: WorkflowEventDetailTypes.PROCESSING_FAILURE,
                    source: `${EventSources.WORKFLOW_STEPFUNCTION}.${props.appNamespace}`,
                    eventBus: props.orchestratorBus
                }
            ],
            resultPath: JsonPath.DISCARD // passes input directly to output after executing task
        });

        const notificationState = new task.SqsSendMessage(this, `${id}SendMessagetoDLQ`, {
            messageBody: TaskInput.fromJsonPathAt('$'),
            queue: this.deadLetterQueue
        });

        // builds the chain of tasks for a failure
        let chain = addFailureStatus.next(publishFailureTask).next(notificationState).next(this.failState);

        this.startState = chain.startState;
        this.endStates = this.failState.endStates;
    }
}
