#!/usr/bin/env node
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

import {
    CreateStateMachineCommand,
    DescribeExecutionCommand,
    GetExecutionHistoryCommand,
    SFNClient,
    SFNClientConfig,
    StartExecutionCommand
} from '@aws-sdk/client-sfn';
import { build, validate } from '@aws-sdk/util-arn-parser';

export interface TestCase {
    input: any;
    name: string;
}

export interface SFNClientWrapperProps extends SFNClientConfig {
    readonly mockRoleArn?: string;
}

export class SFNClientWrapper {
    sfnClient: SFNClient;
    sfnClientConfig: SFNClientConfig;
    mockRoleArn: string;
    sfnEndpoint: string;

    constructor(props: SFNClientWrapperProps) {
        this.mockRoleArn =
            props.mockRoleArn && validate(props.mockRoleArn) ? props.mockRoleArn : this.generateDummyArn();

        this.sfnClientConfig = props;
    }

    updateEndpoint(endpoint: string) {
        this.sfnEndpoint = endpoint;
    }

    createSfnClient() {
        this.sfnClient = new SFNClient({
            ...this.sfnClientConfig,
            endpoint: this.sfnEndpoint
        });
    }

    /**
     *
     * @param stateMachineName Must match statemachine name defined in MockConfigFile used
     *      to create container
     * @param definition ASL string definition of StateMachine
     */
    async createStateMachine(stateMachineName: string, definition: string) {
        const createStateMachineResult = await this.sfnClient.send(
            new CreateStateMachineCommand({
                name: stateMachineName,
                definition: definition,
                roleArn: this.mockRoleArn
            })
        );

        return createStateMachineResult;
    }

    async startExecutionFromTestCase(stateMachineArn: string | undefined, testCase: TestCase) {
        const startExecutionResult = await this.sfnClient.send(
            new StartExecutionCommand({
                stateMachineArn: `${stateMachineArn}#${testCase.name}`,
                input: JSON.stringify(testCase.input)
            })
        );

        return startExecutionResult;
    }

    // Expenential delay to check for execution completion, upto 90 seconds (9 retrys)
    async checkExecutionCompletion(executionArn: string | undefined, retry = 10) {
        const BACK_OFF_RATE = 2;
        const describeExecution = new DescribeExecutionCommand({
            executionArn: executionArn
        });

        for (let i = 1; i < retry; i++) {
            const describeExecutionResult = await this.sfnClient.send(describeExecution);
            if (describeExecutionResult.status == 'RUNNING') {
                await this.wait(i * BACK_OFF_RATE);
            } else {
                console.debug(`Execution completed with status: ${describeExecutionResult.status}`);
                return;
            }
        }
    }

    async getExecutionHistory(executionArn: string | undefined) {
        await this.checkExecutionCompletion(executionArn);

        return await this.sfnClient.send(
            new GetExecutionHistoryCommand({
                executionArn: executionArn,
                maxResults: 1000
            })
        );
    }

    private async wait(seconds: number) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(null);
            }, seconds * 1000);
        });
    }

    private generateDummyArn(): string {
        return build({
            service: 'iam',
            region: '',
            accountId: '123456789012',
            resource: 'role/DummyRole'
        });
    }
}
