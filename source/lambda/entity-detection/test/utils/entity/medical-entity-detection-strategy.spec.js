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
    expectedSyncComprehendMedicalResponse,
    blockDictMedical,
    offsetToLineIdMapMedical,
    bondingBoxResultMedical
} = require('../../event-test-data');

const SharedLib = require('common-node-lib');
const { MedicalEntityDetectionStrategy } = require('../../../utils/entity/medical-entity-detection-strategy');

describe('Get Comprehend API Result:: When provided with correct inputs', () => {
    let publishMetricsSpy;
    const medicalEntityDetectionStrategy = new MedicalEntityDetectionStrategy();

    beforeEach(() => {
        process.env.AWS_REGION = 'fakeRegion';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.ENTITY_DETECTION_LANGUAGE = 'es';

        AWSMock.mock('ComprehendMedical', 'detectEntitiesV2', (params, callback) => {
            callback(null, expectedSyncComprehendMedicalResponse);
        });

        publishMetricsSpy = jest
            .spyOn(SharedLib.CloudWatchMetrics.prototype, 'publishMetrics')
            .mockImplementation(() => {});
    });

    it('getComprehendResult should pass successfully', async () => {
        const comprehendClient = new AWS.ComprehendMedical(UserAgentConfig.customAwsConfig());
        const actualResponse = await medicalEntityDetectionStrategy.getComprehendResult({
            comprehendClient: comprehendClient,
            pageText: 'test paragraph',
            taskToken: 'fake-token'
        });
        expect(actualResponse).toEqual(expectedSyncComprehendMedicalResponse);
        expect(publishMetricsSpy).toHaveBeenCalledTimes(1);
    });

    it('addEntityLocations should pass successfully', async () => {
        let entityLocations = {};
        medicalEntityDetectionStrategy.addEntityLocations({
            entityLocations: entityLocations,
            comprehendResponse: expectedSyncComprehendMedicalResponse,
            offsetToLineIdMap: offsetToLineIdMapMedical,
            blockDict: blockDictMedical,
            pageIdx: 0
        });
        expect(entityLocations).toEqual(bondingBoxResultMedical);
    });

    afterEach(() => {
        jest.clearAllMocks();
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.ENTITY_DETECTION_LANGUAGE;
    });

    afterAll(() => {
        jest.restoreAllMocks();
        AWSMock.restore('ComprehendMedical');
    });
});

describe('Get ComprehendMedical API Result:: fails', () => {
    let publishMetricsSpy;
    const medicalEntityDetectionStrategy = new MedicalEntityDetectionStrategy();

    beforeEach(() => {
        process.env.AWS_REGION = 'fakeRegion';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.ENTITY_DETECTION_LANGUAGE = 'es';

        AWSMock.mock('ComprehendMedical', 'detectEntitiesV2', (params, callback) => {
            callback(new Error('detectEntitiesV2 error'), null);
        });

        publishMetricsSpy = jest
            .spyOn(SharedLib.CloudWatchMetrics.prototype, 'publishMetrics')
            .mockImplementation(() => {});
    });

    it('getComprehendResult fails', async () => {
        const comprehendClient = new AWS.ComprehendMedical(UserAgentConfig.customAwsConfig());
        await expect(
            medicalEntityDetectionStrategy.getComprehendResult({
                comprehendClient: comprehendClient,
                pageText: 'test paragraph',
                taskToken: 'fake-token'
            })
        ).rejects.toThrow('detectEntitiesV2 error');
        expect(publishMetricsSpy).toHaveBeenCalledTimes(1);
    });

    afterAll(() => {
        jest.restoreAllMocks();
        AWSMock.restore('ComprehendMedical');
    });
});
