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
const utils = require('../../../utils/generic');
const { EntityContext } = require('../../../utils/entity/entity-context');
const { PiiEntityDetectionStrategy } = require('../../../utils/entity/pii-entity-detection-strategy');
const {
    expectedSyncComprehendPiiResponse,
    bondingBoxResultPii,
    offsetToLineIdMapPii,
    blockDictPii,
    textractFullPageText
} = require('../../event-test-data');

describe('When provided with a correct input', () => {
    let getComprehendResult, addEntityLocations;

    beforeEach(() => {
        process.env.AWS_REGION = 'fakeRegion';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.ENTITY_DETECTION_LANGUAGE = 'es';
    });

    it('should create an instance successfully', () => {
        const context = new EntityContext();
        expect(context.jobType).toBeNull();

        context.setComprehendType(utils.jobTypes.STANDARD);
        expect(context.jobType).toBe(utils.jobTypes.STANDARD);
    });

    it('getComprehendResult should return result successfully', async () => {
        const comprehend = new AWS.Comprehend(UserAgentConfig.customAwsConfig());
        getComprehendResult = jest.spyOn(PiiEntityDetectionStrategy.prototype, 'getComprehendResult');
        getComprehendResult.mockImplementation(async (...params) => {
            return expectedSyncComprehendPiiResponse;
        });

        const context = new EntityContext();
        context.setComprehendType(new PiiEntityDetectionStrategy());
        const result = await context.getComprehendResult(comprehend, 'Some Text', 'fake-token', 'en', 'custom-arn');
        expect(result).toEqual(expectedSyncComprehendPiiResponse);
    });

    it('addEntityLocations should return result successfully', async () => {
        addEntityLocations = jest.spyOn(PiiEntityDetectionStrategy.prototype, 'addEntityLocations');
        addEntityLocations.mockImplementation(async (...params) => {
            return;
        });

        const context = new EntityContext();
        context.setComprehendType(new PiiEntityDetectionStrategy());
        let entityLocations = {};
        const result = await context.addEntityLocations(
            entityLocations,
            expectedSyncComprehendPiiResponse,
            offsetToLineIdMapPii,
            blockDictPii,
            1,
            textractFullPageText
        );
        expect(result);
    });
});
