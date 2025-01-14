// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as CdkAslConvertor from '../cdk-to-asl';
import * as cdk from 'aws-cdk-lib';
import * as os from 'os';
import * as path from 'path';

import { CreateStateMachineCommand, SFNClient } from '@aws-sdk/client-sfn';

import { SFNTestBuilder } from '../sfn-test-builder';
import { mockClient } from 'aws-sdk-client-mock';
import { writeFileSync } from 'fs';

const EXTENDED_TIMEOUT = 50_000;

describe('When creating a step function test builder', () => {
    let testSfnBuilder: SFNTestBuilder;
    let mockConfigFilePath: string;

    const sfnClientMock = mockClient(SFNClient);

    const extractAslSpy = jest.spyOn(CdkAslConvertor, 'extractStateMachineAsls').mockImplementation(() => {
        return ['MockAslDefinition1', 'MocksAslDefinition2'];
    });

    beforeAll(() => {
        const mockConfig = {
            StateMachines: {
                StateMachine1: 'mocked-state-machine'
            },
            MockedResponses: {
                MockedResponse: 'mocked-response'
            }
        };
        mockConfigFilePath = path.join(os.tmpdir(), 'mockConfigFile.json');
        writeFileSync(mockConfigFilePath, JSON.stringify(mockConfig, null, 2), 'utf-8');

        testSfnBuilder = new SFNTestBuilder({
            bindMockConfigFileSource: mockConfigFilePath
        });
    });

    it('Should instantiate the SFNTestBuilder', () => {
        expect(testSfnBuilder.sfnClient).not.toBe(undefined);
        expect(testSfnBuilder.sfnContainer).not.toBe(undefined);
    });

    it(
        'Should create SFN client instance correctly',
        async () => {
            await testSfnBuilder.createSFNClient();
            expect(testSfnBuilder.sfnClient.sfnClient).not.toBe(undefined);
        },
        EXTENDED_TIMEOUT
    );

    it(
        'Should build the container and create the step function correctly',
        async () => {
            const app = new cdk.App();
            const stack = new cdk.Stack(app, 'TestStack');

            const mockedResponse = {
                stateMachineArn: 'mock-state-machine-arn',
                creationDate: new Date(2022, 1, 1)
            };
            sfnClientMock.on(CreateStateMachineCommand).resolves(mockedResponse);

            let sfnClient;
            let stateMachineArns;

            [sfnClient, stateMachineArns] = await testSfnBuilder.build(stack);

            expect(sfnClient).not.toBe(undefined);
            expect(stateMachineArns).toEqual(['mock-state-machine-arn', 'mock-state-machine-arn']);
        },
        EXTENDED_TIMEOUT
    );

    afterAll(async () => {
        await testSfnBuilder.teardown();
        extractAslSpy.mockRestore();
    });
});
