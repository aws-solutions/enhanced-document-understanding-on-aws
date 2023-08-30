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
 **********************************************************************************************************************/

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
