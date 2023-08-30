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

'use strict';

const AWS = require('aws-sdk');
const UserAgentConfig = require('aws-node-user-agent-config');
const AWSMock = require('aws-sdk-mock');
const {
    expectedSyncComprehendPiiResponse,
    blockDictPii,
    offsetToLineIdMapPii,
    textractFullPageText,
    bondingBoxResultPii
} = require('../../event-test-data');

const SharedLib = require('common-node-lib');
const { PiiEntityDetectionStrategy } = require('../../../utils/entity/pii-entity-detection-strategy');

describe('Get Comprehend API Result:: When provided with correct inputs', () => {
    let publishMetricsSpy;
    const piiEntityDetectionStrategy = new PiiEntityDetectionStrategy();

    beforeEach(() => {
        process.env.AWS_REGION = 'fakeRegion';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.ENTITY_DETECTION_LANGUAGE = 'es';

        AWSMock.mock('Comprehend', 'detectPiiEntities', (params, callback) => {
            callback(null, expectedSyncComprehendPiiResponse);
        });

        publishMetricsSpy = jest
            .spyOn(SharedLib.CloudWatchMetrics.prototype, 'publishMetrics')
            .mockImplementation(() => {});
    });

    it('getComprehendResult should pass successfully', async () => {
        const comprehendClient = new AWS.Comprehend(UserAgentConfig.customAwsConfig());
        const actualResponse = await piiEntityDetectionStrategy.getComprehendResult({
            comprehendClient: comprehendClient,
            pageText: 'test paragraph',
            taskToken: 'fake-token',
            languageCode: 'en'
        });
        expect(actualResponse).toEqual(expectedSyncComprehendPiiResponse);
        expect(publishMetricsSpy).toHaveBeenCalledTimes(1);
    });

    it('addEntityLocations should pass successfully', async () => {
        let entityLocations = {};
        piiEntityDetectionStrategy.addEntityLocations({
            entityLocations: entityLocations,
            comprehendResponse: expectedSyncComprehendPiiResponse,
            offsetToLineIdMap: offsetToLineIdMapPii,
            blockDict: blockDictPii,
            pageIdx: 0,
            pageText: textractFullPageText
        });
        expect(entityLocations).toEqual(bondingBoxResultPii);
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
    const piiEntityDetectionStrategy = new PiiEntityDetectionStrategy();

    beforeEach(() => {
        process.env.AWS_REGION = 'fakeRegion';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.ENTITY_DETECTION_LANGUAGE = 'es';

        AWSMock.mock('Comprehend', 'detectPiiEntities', (params, callback) => {
            callback(new Error('detectPiiEntities error'), null);
        });

        publishMetricsSpy = jest
            .spyOn(SharedLib.CloudWatchMetrics.prototype, 'publishMetrics')
            .mockImplementation(() => {});
    });

    it('getComprehendResult fails', async () => {
        const comprehendClient = new AWS.Comprehend(UserAgentConfig.customAwsConfig());
        await expect(
            piiEntityDetectionStrategy.getComprehendResult({
                comprehendClient: comprehendClient,
                pageText: 'test paragraph',
                taskToken: 'fake-token',
                languageCode: 'en'
            })
        ).rejects.toThrow('detectPiiEntities error');
        expect(publishMetricsSpy).toHaveBeenCalledTimes(1);
    });

    afterAll(() => {
        jest.restoreAllMocks();
        AWSMock.restore('Comprehend');
    });
});
