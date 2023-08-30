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

import { SFNClientWrapper, SFNClientWrapperProps } from './sfn-client-wrapper';
import { SFNTestContainer, SFNTestContainerProps } from './sfn-local-container';

import { Stack } from 'aws-cdk-lib';
import { extractStateMachineAsls } from './cdk-to-asl';

export interface SFNTestBuilderProps extends SFNTestContainerProps, SFNClientWrapperProps {}

export class SFNTestBuilder {
    sfnClient: SFNClientWrapper;
    sfnContainer: SFNTestContainer;
    public readonly endpointRoot: string;

    constructor(props: SFNTestBuilderProps) {
        this.sfnContainer = new SFNTestContainer(props);
        this.sfnClient = new SFNClientWrapper(props);
    }

    async runContainer() {
        await this.sfnContainer.buildContainer();
        const runningContainer = await this.sfnContainer.startContainer();

        console.debug(
            `Current port mapping: ${this.sfnContainer.exposedPort}:${runningContainer.getMappedPort(
                this.sfnContainer.exposedPort
            )}`
        );
        return `http://${this.sfnContainer.hostAddress}:${this.sfnContainer.mappedPort}`;
    }

    async createSFNClient() {
        const endpoint = await this.runContainer();
        console.debug(endpoint);
        this.sfnClient.updateEndpoint(endpoint);
        this.sfnClient.createSfnClient();
    }

    async build(stack: Stack): Promise<[SFNClientWrapper, (string | undefined)[]]> {
        await this.createSFNClient();
        const stateMachineArns: (string | undefined)[] = [];

        const extractedAsls = extractStateMachineAsls(stack);

        for (let index = 0; index < extractedAsls.length; index++) {
            stateMachineArns.push(
                (await this.sfnClient.createStateMachine(`StateMachine${index + 1}`, extractedAsls[index]))
                    .stateMachineArn
            );
        }

        return [this.sfnClient, stateMachineArns];
    }

    async teardown() {
        await this.sfnContainer.stopContainer();
        this.sfnClient.sfnClient.destroy();
    }
}
