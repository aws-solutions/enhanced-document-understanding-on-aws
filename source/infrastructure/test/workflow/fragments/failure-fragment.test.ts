// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';

import { Match, Template } from 'aws-cdk-lib/assertions';
import { State, StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { FailureFragment, FailureFragmentProps } from '../../../lib/workflow/fragments/failure-fragment';

import { EventBus } from 'aws-cdk-lib/aws-events';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { EventSources, WorkflowEventDetailTypes } from '../../../lib/utils/constants';

describe('failure fragment when provided DLQ', () => {
    let fragment: FailureFragment;
    let stateMachine: StateMachine;
    let stack: cdk.Stack;

    beforeAll(async () => {
        const app = new cdk.App();
        stack = new cdk.Stack(app, 'TestStack');

        const failureFragmentProps: FailureFragmentProps = {
            existingDeadLetterQueue: new Queue(stack, 'TestDLQ'),
            orchestratorBus: new EventBus(stack, 'TestEventBus'),
            appNamespace: 'test-namespace',
            failProps: { cause: 'test cause', comment: 'test comment', error: 'test error' }
        };
        fragment = new FailureFragment(stack, 'TestableFailureFragment', failureFragmentProps);
        stateMachine = new StateMachine(stack, 'TestableStateMachine', { definition: fragment });
    });

    it('Should create the statemachine', () => {
        const template = Template.fromStack(stack);
        template.hasResource('AWS::StepFunctions::StateMachine', Match.anyValue);
        template.hasResource('AWS::SQS::Queue', Match.anyValue);
        template.hasResource('AWS::Events::EventBus', Match.anyValue);
    });

    it('failure fragment should set failure status in input', () => {
        // first task of fragment which changes case status
        const passStateJson = fragment.startState.toStateJson() as { [key: string]: any };
        expect(passStateJson.Type).toEqual('Pass');
        expect(passStateJson.Result).toEqual('failure');
        expect(passStateJson.ResultPath).toEqual('$.detail.case.status');
        expect(passStateJson.Next).toEqual('TestableFailureFragmentFailureEventBridgePublishFailureEvents');
    });

    it('failure fragment should publish event', () => {
        const template = Template.fromStack(stack);

        // 2nd task of fragment which publishes a failure event to bus
        // the 'as any' is to be able to access the private _next property for testing
        const publishStateJson = ((fragment.startState as any)._next as State).toStateJson() as { [key: string]: any };
        expect(publishStateJson.Parameters).toEqual({
            'Entries': [
                {
                    'Detail.$': '$',
                    'DetailType': `${WorkflowEventDetailTypes.PROCESSING_FAILURE}`,
                    'EventBusName': expect.any(String),
                    'Source': `${EventSources.WORKFLOW_STEPFUNCTION}.test-namespace`
                }
            ]
        });
        // note null is different from the default undefined in state machine, means we pass the input directly as the result
        // expect(publishStateJson).toBeNull();
        expect(publishStateJson.Next).toEqual('TestableFailureFragmentFailureSendMessagetoDLQ');
    });

    it('failure fragment should push to dlq', () => {
        const template = Template.fromStack(stack);

        // 3rd and final task of fragment which pushes to DLQ
        const pushToDlqJson = ((fragment.startState as any)._next._next as State).toStateJson() as {
            [key: string]: any;
        };
        expect(pushToDlqJson.Parameters).toEqual({
            'MessageBody.$': '$',
            'QueueUrl': expect.any(String)
        });
        expect(pushToDlqJson.ResultPath).toBeUndefined();
        expect(pushToDlqJson.Next).toEqual('TestableFailureFragmentFailure');
    });

    afterAll(async () => {
        console.debug('test over');
    });
});
