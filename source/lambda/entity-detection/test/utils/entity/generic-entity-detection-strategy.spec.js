// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const AWS = require('aws-sdk');
const UserAgentConfig = require('aws-node-user-agent-config');
const AWSMock = require('aws-sdk-mock');
const {
    expectedSyncComprehendResponse,
    blockDictStandard,
    offsetToLineIdMapStandard,
    errorCaseOffsetToLineIdMapStandard,
    bondingBoxResultStandard
} = require('../../event-test-data');

const SharedLib = require('common-node-lib');
const { GenericEntityDetectionStrategy } = require('../../../utils/entity/generic-entity-detection-strategy');

describe('Get Comprehend API Result:: When provided with correct inputs', () => {
    let publishMetricsSpy;
    const genericEntityDetectionStrategy = new GenericEntityDetectionStrategy();

    beforeEach(() => {
        process.env.AWS_REGION = 'fakeRegion';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.ENTITY_DETECTION_LANGUAGE = 'es';

        AWSMock.mock('Comprehend', 'detectEntities', (params, callback) => {
            callback(null, expectedSyncComprehendResponse);
        });

        publishMetricsSpy = jest
            .spyOn(SharedLib.CloudWatchMetrics.prototype, 'publishMetrics')
            .mockImplementation(() => {});
    });

    it('getComprehendResult should pass successfully', async () => {
        const comprehendClient = new AWS.Comprehend(UserAgentConfig.customAwsConfig());
        const actualResponse = await genericEntityDetectionStrategy.getComprehendResult({
            comprehendClient: comprehendClient,
            pageText: 'test paragraph',
            taskToken: 'fake-token',
            languageCode: 'en'
        });
        expect(actualResponse).toEqual(expectedSyncComprehendResponse);
        expect(publishMetricsSpy).toHaveBeenCalledTimes(1);
    });

    it('getComprehendResult on CUSTOM entity detection', async () => {
        const comprehendClient = new AWS.Comprehend(UserAgentConfig.customAwsConfig());
        const actualResponse = await genericEntityDetectionStrategy.getComprehendResult({
            comprehendClient: comprehendClient,
            pageText: 'test paragraph',
            taskToken: 'fake-token',
            languageCode: 'en',
            endpointArn: 'fakeComprehendArn'
        });
        expect(actualResponse).toEqual(expectedSyncComprehendResponse);
        expect(publishMetricsSpy).toHaveBeenCalledTimes(1);
    });

    it('addEntityLocations should pass successfully', async () => {
        let entityLocations = {};
        genericEntityDetectionStrategy.addEntityLocations({
            entityLocations: entityLocations,
            comprehendResponse: expectedSyncComprehendResponse,
            offsetToLineIdMap: offsetToLineIdMapStandard,
            blockDict: blockDictStandard,
            pageIdx: 0
        });
        expect(entityLocations).toEqual(bondingBoxResultStandard);
    });

    it('addEntityLocations should pass with errors logged', async () => {
        let entityLocations = {};
        const errorSpy = jest.spyOn(console, 'error');
        genericEntityDetectionStrategy.addEntityLocations({
            entityLocations: entityLocations,
            comprehendResponse: expectedSyncComprehendResponse,
            offsetToLineIdMap: errorCaseOffsetToLineIdMapStandard,
            blockDict: blockDictStandard,
            pageIdx: 0
        });
        expect(errorSpy).toHaveBeenCalledWith("Determining location of entity '{\"Score\":0.8900869488716125,\"Type\":\"OTHER\",\"Text\":\"it is repeating\",\"BeginOffset\":56,\"EndOffset\":77}' failed with error: Error: Bounding box computation failed for entity 'it is repeating' at offset 56. Got error: Cannot read properties of undefined (reading 'Text')");
    });

    afterEach(() => {
        jest.clearAllMocks();
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.ENTITY_DETECTION_LANGUAGE;
    });

    afterAll(() => {
        jest.restoreAllMocks();
        AWSMock.restore('Comprehend');
    });
});

describe('Get Comprehend API Result:: fails', () => {
    let publishMetricsSpy;
    const genericEntityDetectionStrategy = new GenericEntityDetectionStrategy();

    beforeEach(() => {
        process.env.AWS_REGION = 'fakeRegion';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.ENTITY_DETECTION_LANGUAGE = 'es';

        AWSMock.mock('Comprehend', 'detectEntities', (params, callback) => {
            callback(new Error('detectEntities error'), null);
        });

        publishMetricsSpy = jest
            .spyOn(SharedLib.CloudWatchMetrics.prototype, 'publishMetrics')
            .mockImplementation(() => {});
    });

    it('getComprehendResult fails', async () => {
        const comprehendClient = new AWS.Comprehend(UserAgentConfig.customAwsConfig());
        await expect(
            genericEntityDetectionStrategy.getComprehendResult({
                comprehendClient: comprehendClient,
                pageText: 'test paragraph',
                taskToken: 'fake-token',
                languageCode: 'en'
            })
        ).rejects.toThrow('detectEntities error');
        expect(publishMetricsSpy).toHaveBeenCalledTimes(1);
    });

    it('getComprehendResult fails on CUSTOM entity detection', async () => {
        const comprehendClient = new AWS.Comprehend(UserAgentConfig.customAwsConfig());
        await expect(
            genericEntityDetectionStrategy.getComprehendResult({
                comprehendClient: comprehendClient,
                pageText: 'test paragraph',
                taskToken: 'fake-token',
                languageCode: 'en',
                endpointArn: 'fakeComprehendArn'
            })
        ).rejects.toThrow('detectEntities error');
        expect(publishMetricsSpy).toHaveBeenCalledTimes(1);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        jest.restoreAllMocks();
        AWSMock.restore('Comprehend');
    });
});
