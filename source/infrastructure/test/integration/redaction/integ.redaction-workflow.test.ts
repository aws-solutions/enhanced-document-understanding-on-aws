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

import * as EXPECTED_OUTPUTS from './integ-test-data/expected-test-outputs.json';
import * as cdk from 'aws-cdk-lib';

import { SFNClientWrapper, TestCase } from '../../framework/sfn-client-wrapper';

import { RedactionWorkflow } from '../../../lib/workflow/redaction/redaction-workflow';
import { SFNTestBuilder } from '../../framework/sfn-test-builder';
import { join } from 'path';
import { testcases } from './integ-test-data/input-data.json';
import { WorkflowStageNames, WorkflowType } from '../../../lib/utils/constants';

const DEFAULT_TIMEOUT = 120_000;
const EXTENDED_TIMEOUT = 180_000;

const MOCK_CONFIG_FILE = join(__dirname, './integ-test-data/redaction-workflow.integ.mockconfig.json');

describe('Redaction step-function integration test', () => {
    let client: SFNClientWrapper;
    let stateMachineArns: (string | undefined)[] = [];
    let sfnLocalTestBuilder: SFNTestBuilder;

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
        const workflow = new RedactionWorkflow(stack, 'TestRedactionNestedStack', {});

        sfnLocalTestBuilder = new SFNTestBuilder({
            bindMockConfigFileSource: MOCK_CONFIG_FILE
        });
        [client, stateMachineArns] = await sfnLocalTestBuilder.build(workflow);
    }, DEFAULT_TIMEOUT);

    it(
        'Should execute a first pass',
        async () => {
            const testcase: TestCase = testcases[0];
            const stateMachineArn = stateMachineArns[0];

            const expectedTestOutput = EXPECTED_OUTPUTS.SingleDocFirstInferenceTest.ExpectedOutput;

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

            const eventBridgeTaskInput = JSON.parse(eventBridgePublishEvent?.stateEnteredEventDetails?.input as string);
            expect(eventBridgeTaskInput).toEqual(expectedTestOutput);
        },
        EXTENDED_TIMEOUT
    );

    it(
        'Should append inferences to result of previous workflow',
        async () => {
            const testcase: TestCase = testcases[1];
            const stateMachineArn = stateMachineArns[0];

            const executionResult = await client.startExecutionFromTestCase(stateMachineArn, testcase);
            const executionHistory = await client.getExecutionHistory(executionResult.executionArn);

            const expectedTaskSucceededOutput = {
                document: {
                    id: 'fake-doc-id-1',
                    selfCertifiedDocType: 'passport',
                    s3Prefix: 's3-prefix',
                    processingType: WorkflowType.SYNC_ONLY
                },
                inferences: {
                    'textract-analyzeDoc': 'mocked-textract-analyzeDoc-response',
                    redaction: {
                        Redacts: [
                            {
                                Name: 'fake-class',
                                Score: 0.99
                            }
                        ]
                    }
                },
                stage: WorkflowStageNames.REDACTION
            };

            const taskSucceededEventDetails = executionHistory.events?.find((event) => event.type === 'TaskSucceeded');
            expect(JSON.parse(taskSucceededEventDetails?.taskSucceededEventDetails?.output as string)).toEqual(
                expectedTaskSucceededOutput
            );
        },
        EXTENDED_TIMEOUT
    );

    it(
        'should send message to DLQ on error',
        async () => {
            const testcase: TestCase = testcases[3];
            const stateMachineArn = stateMachineArns[0];

            const executionResult = await client.startExecutionFromTestCase(stateMachineArn, testcase);
            const executionHistory = await client.getExecutionHistory(executionResult.executionArn);

            const expectedOutput = {
                MD50ofMessageBody: 'fake-md50-sqs',
                MessageId: 'fake-msg-id'
            };

            const taskSucceededEvent = executionHistory.events?.find(
                (event) => event.type === 'TaskSucceeded' && event.taskSucceededEventDetails?.resource === 'sendMessage'
            );
            expect(JSON.parse(taskSucceededEvent?.taskSucceededEventDetails?.output as string)).toEqual(expectedOutput);

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
