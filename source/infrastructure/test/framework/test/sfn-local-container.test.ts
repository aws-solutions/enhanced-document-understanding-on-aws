// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from 'path';

import { SFNTestContainer } from '../sfn-local-container';
import { tmpdir } from 'os';
import { writeFileSync } from 'fs';

describe('When creating and running a docker container for local-stepfunctions', () => {
    let testContainer: SFNTestContainer;
    let mockConfigFileValid: string;
    let mockConfigFileInvalid: string;

    const tmpDir = tmpdir();

    beforeAll(() => {
        const validMockConfig = {
            StateMachines: {
                StateMachine1: 'mocked-state-machine-object'
            },
            MockedResponses: {
                MockedResponse1: 'mocked-response'
            }
        };
        mockConfigFileValid = path.join(tmpDir, 'validMockConfig.json');
        writeFileSync(mockConfigFileValid, JSON.stringify(validMockConfig, null, 2), 'utf-8');

        const invalidMockConfig = {
            StateMachines: {
                StateMachine1: 'mocked-state-machine-object',
                StateMachine2: 'mocked-state-machine-object'
            }
        };

        mockConfigFileInvalid = path.join(tmpDir, 'invalidMockConfig.json');
        writeFileSync(mockConfigFileInvalid, JSON.stringify(invalidMockConfig, null, 2), 'utf-8');
    });

    it('should throw an error when an invalid mock config file is provided', () => {
        try {
            testContainer = new SFNTestContainer({
                bindMockConfigFileSource: mockConfigFileInvalid
            });
        } catch (error) {
            expect((error as Error).message).toEqual(`Invalid file: ${mockConfigFileInvalid}. Ensure proper format`);
        }
    });

    it('should instantiate the test container with the correct default properties', () => {
        testContainer = new SFNTestContainer({
            bindMockConfigFileSource: mockConfigFileValid
        });

        const defaultDockerFilePath = path.resolve(path.join(__dirname, '../Dockerfile'));

        expect(testContainer.bindMockConfigFileSource).toEqual(mockConfigFileValid);
        expect(testContainer.bindMockConfigFileTarget).toEqual('/home/validMockConfig.json');
        expect(testContainer.exposedPort).toEqual(8083);
        expect(testContainer.dockerfilePath).toEqual(defaultDockerFilePath);
    });
});
