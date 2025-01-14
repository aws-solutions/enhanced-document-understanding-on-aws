// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from 'path';

import { SFNMockConfigValidator } from '../sfn-mock-config-validator';
import { tmpdir } from 'os';
import { writeFileSync } from 'fs';

describe('SFN Mock Config validator test', () => {
    let mockConfigFileValid: string;
    let mockConfigFileInvalid1: string;
    let mockConfigFileInvalid2: string;
    let mockConfigFileInvalid3: string;
    let consoleWarnSpy: jest.SpyInstance;

    const tmpDir = tmpdir();

    beforeAll(() => {
        const validMockConfig = {
            StateMachines: {
                StateMachine1: 'mocked-state-machine-object',
                StateMachine2: 'mocked-state-machine-object',
                StateMachine3: 'mocked-state-machine-object'
            },
            MockedResponses: {
                MockedResponse1: 'mocked-response',
                MockedResponse2: 'mocked-response'
            }
        };
        mockConfigFileValid = path.join(tmpDir, 'validMockConfig.json');
        writeFileSync(mockConfigFileValid, JSON.stringify(validMockConfig, null, 2), 'utf-8');

        const invalidMockConfig1 = {
            StateMachines: {
                StateMachine1: 'mocked-state-machine-object',
                StateMachine2: 'mocked-state-machine-object'
            }
        };

        mockConfigFileInvalid1 = path.join(tmpDir, 'invalidMockConfig1.json');
        writeFileSync(mockConfigFileInvalid1, JSON.stringify(invalidMockConfig1, null, 2), 'utf-8');

        const invalidMockConfig2 = {
            MockedResponses: {
                MockedResponse1: 'mocked-response',
                MockedResponse2: 'mocked-response'
            }
        };

        mockConfigFileInvalid2 = path.join(tmpDir, 'invalidMockConfig2.json');
        writeFileSync(mockConfigFileInvalid2, JSON.stringify(invalidMockConfig2, null, 2), 'utf-8');

        const invalidMockConfig3 = {
            StateMachines: {
                InvalidStateMachineA: 'mocked-state-machine-object',
                InvalidStateMachineB: 'mocked-state-machine-object'
            },
            MockedResponses: {
                MockedResponse1: 'mocked-response'
            }
        };

        mockConfigFileInvalid3 = path.join(tmpDir, 'invalidMockConfig3.json');
        writeFileSync(mockConfigFileInvalid3, JSON.stringify(invalidMockConfig3, null, 2), 'utf-8');

        consoleWarnSpy = jest.spyOn(console, 'warn');
    });

    it('Should successfully validate, and return true', () => {
        const validator = new SFNMockConfigValidator(mockConfigFileValid);
        expect(validator.validate()).toBe(true);
    });

    it('Should successfully validate and return false', () => {
        const validator1 = new SFNMockConfigValidator(mockConfigFileInvalid1);
        expect(validator1.validate()).toBe(false);

        const validator2 = new SFNMockConfigValidator(mockConfigFileInvalid2);
        expect(validator2.validate()).toBe(false);

        const validator3 = new SFNMockConfigValidator(mockConfigFileInvalid3);
        expect(validator3.validate()).toBe(false);

        expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
    });

    it('Should throw error when creaing object', () => {
        const nonExistingFile = path.join(tmpDir, 'unknowFile.json');
        try {
            new SFNMockConfigValidator(nonExistingFile);
        } catch (error) {
            expect((error as Error).message).toBe(`ENOENT: no such file or directory, open '${nonExistingFile}'`);
        }
    });

    afterAll(() => {
        consoleWarnSpy.mockRestore();
    });
});
