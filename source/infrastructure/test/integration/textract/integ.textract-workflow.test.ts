// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as EXPECTED_OUTPUTS from './integ-test-data/expected-test-outputs.json';
import * as cdk from 'aws-cdk-lib';

import { SFNClientWrapper, TestCase } from '../../framework/sfn-client-wrapper';

import { SFNTestBuilder } from '../../framework/sfn-test-builder';
import { TextractWorkflow } from '../../../lib/workflow/textract/textract-workflow';
import { join } from 'path';
import { testcases } from './integ-test-data/input-data.json';

const DEFAULT_TIMEOUT = 60_000; //60 seconds
const EXTENDED_TIMEOUT = 90_000;

const MOCK_CONFIG_FILE = join(__dirname, './integ-test-data/textract-workflow.integ.mockconfig.json');

describe('Textract step-function integration test', () => {
    let client: SFNClientWrapper;
    let sfnLocalTestBuilder: SFNTestBuilder;
    let stateMachineArns: (string | undefined)[] = [];

    const expectedTaskSucceededOutput = {
        'FailedEntryCount': 0,
        'Entries': [
            {
                'EventId': 'fake-event-id-1'
            }
        ]
    };
    beforeAll(async () => {
        process.env.AWS_REGION = 'us-east-1';
        const app = new cdk.App();
        const stack = new cdk.Stack(app, 'TestStack');
        console.log('Creating textract workflow instance...');
        const workflow = new TextractWorkflow(stack, 'TestTextractNestedStack', {});

        sfnLocalTestBuilder = new SFNTestBuilder({
            bindMockConfigFileSource: MOCK_CONFIG_FILE
        });
        [client, stateMachineArns] = await sfnLocalTestBuilder.build(workflow);
    }, DEFAULT_TIMEOUT);

    it(
        'Should execute a first pass',
        async () => {
            const testcase: TestCase = testcases[0];
            const expectedTestOutput = EXPECTED_OUTPUTS.AnalyzeDocTestSuccess.ExpectedOutput;
            const stateMachineArn = stateMachineArns[0];

            const executionResult = await client.startExecutionFromTestCase(stateMachineArn, testcase);
            const executionHistory = await client.getExecutionHistory(executionResult.executionArn);

            const taskSucceededEvent = executionHistory.events?.find(
                (event) => event.type === 'TaskSucceeded' && event.taskSucceededEventDetails?.resource === 'putEvents'
            );
            expect(JSON.parse(taskSucceededEvent?.taskSucceededEventDetails?.output as string)).toEqual(
                expectedTaskSucceededOutput
            );

            const mapIterationSucceededEvent = executionHistory.events?.find(
                (event) => event.type == 'MapIterationSucceeded'
            );
            expect(mapIterationSucceededEvent?.mapIterationSucceededEventDetails).toBeDefined();

            const eventBridgePublishEvent = executionHistory.events?.find(
                (event) =>
                    event.type === 'TaskStateEntered' &&
                    event.stateEnteredEventDetails?.name === 'EventBridgePublishEvents'
            );

            let publishEvent = JSON.parse(eventBridgePublishEvent?.stateEnteredEventDetails?.input as string);

            // due to map state, we can have document list be in a different order
            let publishedDocs = new Set(publishEvent.case.documentList);
            let expectedDocs = new Set(expectedTestOutput.case.documentList);
            let areSetsEqual = (a: Set<any>, b: Set<any>) => a.size === b.size && [...a].every((value) => b.has(value));
            expect(areSetsEqual(publishedDocs, expectedDocs));

            // comparing all the other members
            publishEvent.case.documentList = [];
            expectedTestOutput.case.documentList = [];
            expect(publishEvent).toEqual(expectedTestOutput);
        },
        EXTENDED_TIMEOUT
    );

    it(
        'Should skip execution if stage is not present in documentWorkflow list',
        async () => {
            const testcase: TestCase = testcases[1];
            const stateMachineArn = stateMachineArns[0];

            const executionResult = await client.startExecutionFromTestCase(stateMachineArn, testcase);
            const executionHistory = await client.getExecutionHistory(executionResult.executionArn);

            const mapIterationSucceededEvent = executionHistory.events?.find(
                (event) => event.type == 'MapIterationSucceeded'
            );
            expect(mapIterationSucceededEvent?.mapIterationSucceededEventDetails).toBeDefined();
        },
        EXTENDED_TIMEOUT
    );

    it(
        'should send message to eventbridge and DLQ on error',
        async () => {
            const testcase: TestCase = testcases[3];
            const stateMachineArn = stateMachineArns[0];

            const executionResult = await client.startExecutionFromTestCase(stateMachineArn, testcase);
            const executionHistory = await client.getExecutionHistory(executionResult.executionArn);

            // pushing the failure to eventbridge should succeed and pass payload unchanged
            const ebTaskEnteredEvent = executionHistory.events?.find(
                (event) =>
                    event.type === 'TaskStateEntered' &&
                    event.stateEnteredEventDetails?.name === 'FailureEventBridgePublishFailureEvents'
            );
            const ebTaskSucceededEvent = executionHistory.events?.find(
                (event) => event.type === 'TaskSucceeded' && event.taskSucceededEventDetails?.resource === 'putEvents'
            );
            const expectedEbOutput = ebTaskEnteredEvent?.stateEnteredEventDetails?.input;
            expect(ebTaskSucceededEvent?.taskSucceededEventDetails?.output).toEqual(expectedEbOutput);

            // pushing the failure to the DLQ
            const expectedDlqOutput = {
                MD50ofMessageBody: 'fake-md50-sqs',
                MessageId: 'fake-msg-id'
            };

            const dlqTaskSucceededEvent = executionHistory.events?.find(
                (event) => event.type === 'TaskSucceeded' && event.taskSucceededEventDetails?.resource === 'sendMessage'
            );
            expect(JSON.parse(dlqTaskSucceededEvent?.taskSucceededEventDetails?.output as string)).toEqual(
                expectedDlqOutput
            );

            const executionFailedEvent = executionHistory.events?.find((event) => event.type === 'ExecutionFailed');
            const expectedErrorCauseMsg = 'Exception thrown during execution of workflow';
            expect(executionFailedEvent?.executionFailedEventDetails?.cause as string).toEqual(expectedErrorCauseMsg);
        },
        EXTENDED_TIMEOUT
    );

    afterAll(async () => {
        delete process.env.AWS_REGION;
        await sfnLocalTestBuilder.teardown();
    }, DEFAULT_TIMEOUT);
});
