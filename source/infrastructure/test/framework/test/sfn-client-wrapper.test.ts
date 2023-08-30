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

import {
    CreateStateMachineCommand,
    DescribeExecutionCommand,
    GetExecutionHistoryCommand,
    SFNClient,
    StartExecutionCommand
} from '@aws-sdk/client-sfn';
import { SFNClientWrapper, TestCase } from '../sfn-client-wrapper';

import { mockClient } from 'aws-sdk-client-mock';

const EXTENTED_TIMEOUT = 50_000;

describe('When testing the behaviour of the SFNClientWrapper', () => {
    let sfnClientWrapper: SFNClientWrapper;
    const sfnClientMock = mockClient(SFNClient);

    beforeAll(() => {
        sfnClientWrapper = new SFNClientWrapper({});

        const customEndpoint = 'http://fake-endpoint:8083';
        sfnClientWrapper.updateEndpoint(customEndpoint);
        sfnClientWrapper.createSfnClient();
    });

    beforeEach(() => {
        sfnClientMock.reset();
    });

    it('Should successfully create a state machine', async () => {
        const mockedResponse = {
            stateMachineArn: 'mock-state-machine-arn',
            creationDate: new Date(2022, 1, 1)
        };
        sfnClientMock.on(CreateStateMachineCommand).resolves(mockedResponse);

        const mockStateMachineName = 'StateMachine1';
        const mockStateMachineDefintion = 'mock-definition';

        const result = await sfnClientWrapper.createStateMachine(mockStateMachineName, mockStateMachineDefintion);
        expect(result).toEqual(mockedResponse);
    });

    it('Should successfully run a mocked testcase', async () => {
        const mockedResponse = {
            startDate: new Date(2022, 1, 1),
            executionArn: 'mocked-execution-arn'
        };
        sfnClientMock.on(StartExecutionCommand).resolves(mockedResponse);

        const mockStateMachineArn = 'mocked-statemachine-arn';
        const mockedTestCase: TestCase = { name: 'fake-test-case', input: 'fake-input' };

        const result = await sfnClientWrapper.startExecutionFromTestCase(mockStateMachineArn, mockedTestCase);
        expect(result).toEqual(mockedResponse);
    });

    it(
        'Should check all cases of execution completion',
        async () => {
            sfnClientMock
                .on(DescribeExecutionCommand)
                .resolvesOnce({
                    status: 'RUNNING'
                })
                .resolvesOnce({ status: 'RUNNING' })
                .resolves({ status: 'SUCCEEDED' });

            const mockedExecutionArn = 'mocked-arn';
            await sfnClientWrapper.checkExecutionCompletion(mockedExecutionArn);
            expect(sfnClientMock.commandCalls(DescribeExecutionCommand).length).toEqual(3);
        },
        EXTENTED_TIMEOUT
    );

    it('Should successfully run a mocked testcase', async () => {
        const mockedResponse = {
            events: undefined,
            nextToken: 'next-token'
        };
        sfnClientMock.on(GetExecutionHistoryCommand).resolves(mockedResponse);

        sfnClientMock.on(DescribeExecutionCommand).resolves({
            status: 'SUCCEEDED'
        });

        const mockExecutionArn = 'mock-arn';

        const result = await sfnClientWrapper.getExecutionHistory(mockExecutionArn);
        expect(result).toEqual(mockedResponse);
    });

    // it('Should update the endpoint', async () => {
    //     const resolvedEndpoint = await sfnClientWrapper.sfnClient.config.endpoint();
    //     const resolvedEndpointString = `${resolvedEndpoint.protocol}//${resolvedEndpoint.hostname}:${resolvedEndpoint.port}`;
    //     expect(resolvedEndpointString).toEqual('http://fake-endpoint:8083');
    // });

    it('Should generate a valid default mock IAM ARN', () => {
        expect(sfnClientWrapper.mockRoleArn).toEqual('arn:aws:iam::123456789012:role/DummyRole');
    });

    afterAll(() => {
        sfnClientWrapper.sfnClient.destroy();
    });
});

describe('When instantiating SFNClientWrapper', () => {
    let sfnClientWrapper: SFNClientWrapper;

    it('Default MockRoleArn should be generated if not specified in props', () => {
        sfnClientWrapper = new SFNClientWrapper({});

        expect(sfnClientWrapper.mockRoleArn).toEqual('arn:aws:iam::123456789012:role/DummyRole');
    });

    it('Default MockRoleArn should be generated if an invalid arn specified in props', () => {
        sfnClientWrapper = new SFNClientWrapper({ mockRoleArn: 'invalid-mock-arn' });

        expect(sfnClientWrapper.mockRoleArn).toEqual('arn:aws:iam::123456789012:role/DummyRole');
    });

    it('Custom MockRoleArn should be generated if a valid arn is specified in props', () => {
        sfnClientWrapper = new SFNClientWrapper({ mockRoleArn: 'arn:aws:iam::123456789012:role/CustomFakeRole' });

        expect(sfnClientWrapper.mockRoleArn).toEqual('arn:aws:iam::123456789012:role/CustomFakeRole');
    });
});
