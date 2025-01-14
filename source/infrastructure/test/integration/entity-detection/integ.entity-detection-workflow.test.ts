// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as EXPECTED_OUTPUTS from './integ-test-data/expected-test-outputs.json';
import * as cdk from 'aws-cdk-lib';
import * as testcases from './integ-test-data/input-data.json';
import { SFNClientWrapper, TestCase } from '../../framework/sfn-client-wrapper';
import { EntityDetectionWorkflow } from '../../../lib/workflow/entity-detection/entity-detection-workflow';
import { SFNTestBuilder } from '../../framework/sfn-test-builder';
import { join } from 'path';

const MOCK_CONFIG_FILE = join(__dirname, './integ-test-data/entity-detection-workflow.integ.mockconfig.json');

describe('Entity Detection step-function integration tests', () => {
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
        const workflow = new EntityDetectionWorkflow(stack, 'TestEntityDetectionNestedStack', {});

        sfnLocalTestBuilder = new SFNTestBuilder({
            bindMockConfigFileSource: MOCK_CONFIG_FILE
        });
        [client, stateMachineArns] = await sfnLocalTestBuilder.build(workflow);
    }, Number(process.env.DEFAULT_TIMEOUT));

    it(
        'Should detect entities from single new document',
        async () => {
            const testcase: TestCase = testcases.testcase1;
            const stateMachineArn = stateMachineArns[0];

            const executionResult = await client.startExecutionFromTestCase(stateMachineArn, testcase);
            const executionHistory = await client.getExecutionHistory(executionResult.executionArn);

            const expectedLambdaResponse = EXPECTED_OUTPUTS.testcase1;

            const taskSucceededEventDetails = executionHistory.events?.find(
                (event) => event.type === 'TaskSucceeded' && event.taskSucceededEventDetails?.resource === 'putEvents'
            );
            expect(JSON.parse(taskSucceededEventDetails?.taskSucceededEventDetails?.output as string)).toEqual(
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
            expect(JSON.parse(eventBridgePublishEvent?.stateEnteredEventDetails?.input as string)).toEqual(
                expectedLambdaResponse
            );
        },
        Number(process.env.EXTENDED_TIMEOUT)
    );

    afterAll(async () => {
        await sfnLocalTestBuilder.teardown();
        delete process.env.AWS_REGION;
    }, Number(process.env.DEFAULT_TIMEOUT));
});
