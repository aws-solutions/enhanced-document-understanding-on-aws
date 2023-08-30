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
