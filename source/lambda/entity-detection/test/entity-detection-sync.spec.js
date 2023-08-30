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
'use strict';

const lambda = require('../entity-detection-sync');
const SharedLib = require('common-node-lib');
const syncUtils = require('../utils/sync');
const utils = require('../utils/generic');

const { sqsMessage, expectedSyncComprehendResponse } = require('./event-test-data');

jest.mock('../utils/sync');
jest.mock('common-node-lib');

describe('When provided with proper inputs', () => {
    beforeAll(() => {
        process.env.AWS_REGION = 'fake-region';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
    });

    afterEach(() => {
        delete process.env.ENTITY_DETECTION_JOB_TYPE;
        delete process.env.CUSTOM_COMPREHEND_ARN;
        delete process.env.ENTITY_DETECTION_LANGUAGE;
        jest.clearAllMocks();
    });

    afterAll(() => {
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
    });

    it('should invoke the lambda function successfully for medical', async () => {
        process.env.ENTITY_DETECTION_JOB_TYPE = utils.jobTypes.MEDICAL;
        const response = await lambda.handler(sqsMessage);
        expect(SharedLib.processRecordsSync).toHaveBeenCalled();
    });
});
