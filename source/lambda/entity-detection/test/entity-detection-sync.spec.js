// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
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
