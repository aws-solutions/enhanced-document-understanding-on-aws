// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { readFileSync } from 'fs';
import { resolve } from 'path';

interface validMockConfig {
    StateMachines: Object;
    MockedResponses: Object;
}

export class SFNMockConfigValidator {
    mockConfig: validMockConfig;
    mockFilePath: string;
    constructor(mockConfigFile: string) {
        try {
            this.mockFilePath = resolve(mockConfigFile);
            this.mockConfig = JSON.parse(readFileSync(this.mockFilePath, 'utf-8'));
        } catch (error) {
            console.error(`Unable to read file: '${resolve(mockConfigFile)}'`);
            throw error;
        }
    }
    validate(): boolean {
        return this.requiredKeysExist() && this.validStateMachineNames();
    }

    private validStateMachineNames(): boolean {
        const stateMachineNames = Object.keys(this.mockConfig.StateMachines).sort();
        const isValid = stateMachineNames.every((name, idx) => name === `StateMachine${idx + 1}`);
        if (!isValid) {
            console.warn('StateMachine name(s) is invalid');
        }
        return isValid;
    }

    private requiredKeysExist(): boolean {
        const requriedKeys = ['StateMachines', 'MockedResponses'];
        const mockConfigKeys = Object.keys(this.mockConfig);
        const isValid = requriedKeys.every((reqKey) => mockConfigKeys.includes(reqKey));
        if (!isValid) {
            console.warn('MockConfig file is missing required keys');
        }
        return isValid;
    }
}
