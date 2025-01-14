#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from 'path';

import { GenericContainer, StartedTestContainer } from 'testcontainers';

import { SFNMockConfigValidator } from './sfn-mock-config-validator';

export interface SFNTestContainerProps {
    /**
     * @default search for a `Dockerfile` in this files directory
     */
    dockerfilePath?: string;

    /**
     * Docker host port. Required.
     */
    exposedPort?: number;
    bindMockConfigFileSource: string;

    /**
     * @default - `/home/<mock-confing-filename>` on container
     */
    bindMockConfigFileTarget?: string;
    environmentVariables?: { [key: string]: string };
}

export class SFNTestContainer {
    public readonly bindMockConfigFileSource: string;
    public readonly bindMockConfigFileTarget: string;
    container: GenericContainer;
    runningContainer: StartedTestContainer;
    public readonly dockerfilePath: string;
    public readonly environmentVariables?: { [key: string]: string };
    public readonly exposedPort: number;
    mappedPort: number;
    hostAddress: string;

    constructor(props: SFNTestContainerProps) {
        const mockConfigValidator = new SFNMockConfigValidator(props.bindMockConfigFileSource);
        if (mockConfigValidator.validate()) {
            this.bindMockConfigFileSource = props.bindMockConfigFileSource;
        } else {
            throw new Error(`Invalid file: ${props.bindMockConfigFileSource}. Ensure proper format`);
        }

        this.bindMockConfigFileTarget =
            props.bindMockConfigFileTarget ?? path.join('/home', path.basename(props.bindMockConfigFileSource));

        this.exposedPort = this.getHostPort(props.exposedPort);

        this.dockerfilePath = props.dockerfilePath ?? path.join(__dirname, 'Dockerfile');
        this.environmentVariables = props.environmentVariables;
    }

    async buildContainer() {
        this.container = await GenericContainer.fromDockerfile(
            path.dirname(this.dockerfilePath),
            path.basename(this.dockerfilePath)
        ).build();

        this.container.start();

        this.container = this.container
            .withExposedPorts(this.exposedPort)
            .withBindMounts([
                { source: this.bindMockConfigFileSource, target: this.bindMockConfigFileTarget, mode: 'ro' }
            ])
            .withEnvironment({ SFN_MOCK_CONFIG: this.bindMockConfigFileTarget });

        if (this.environmentVariables) {
            Object.entries(this.environmentVariables).forEach(([key, value]) => {
                this.container.withEnvironment({ key, value });
            });
        }
    }

    async startContainer() {
        try {
            this.runningContainer = await this.container.start();
            this.hostAddress = this.runningContainer.getHost();
            this.mappedPort = this.runningContainer.getMappedPort(this.exposedPort);
            console.debug(`Started TestContainer on ${this.hostAddress}`);
            console.debug(`Port mapping: ${this.exposedPort}:${this.mappedPort}`);
        } catch (error) {
            console.error(`Error: process timeout when starting container. Check if port is in use. \n ${error}`);
            throw error;
        }
        return this.runningContainer;
    }

    async stopContainer() {
        await this.runningContainer.stop();
        console.debug('Container stopped');
    }

    async restartContainer() {
        await this.runningContainer.restart();
    }

    private getHostPort(receivedPort?: number): number {
        const port = receivedPort ?? process.env.DOCKER_HOST_PORT ?? 8083;
        return Number(port);
    }
}
