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

const AWSMock = require('aws-sdk-mock');
const mainFuncs = require('../index');
const s3Funcs = require('../utils/s3-read');
const snsFuncs = require('../utils/sns-send-notification');
const {
    expectedS3ResponseDocProcessSuccess,
    expectedS3ResponseDocProcessFailed,
    exampleEventProcessingSuccess,
    exampleEventProcessingFailed,
    expectedProcessingFailedMessage
} = require('./event-test-data');

describe('When lambda invoked with correct input', () => {
    let s3Read, snsPublish;

    beforeAll(() => {
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.SNS_TOPIC_ARN = 'fake-topic';
        process.env.TEMPLATES_BUCKET_NAME = 'fakeBucket';
        process.env.TEMPLATE_PREFIX = 'fakePrefix/';

        s3Read = jest.spyOn(s3Funcs, 'getTemplateFromS3').mockImplementation((key) => {
            return expectedS3ResponseDocProcessSuccess;
        });

        const mockedResponseData = {
            Success: 'OK'
        };
        snsPublish = jest.spyOn(snsFuncs, 'sendSNSNotification').mockImplementation((message) => {
            return mockedResponseData;
        });

        AWSMock.mock('SNS', 'publish', (message, callback) => {
            callback(null, mockedResponseData);
        });
    });

    beforeEach(() => {
        process.env.TEMPLATES_BUCKET_NAME = 'fakeBucket';
        jest.clearAllMocks();
    });

    it('should pass successfully', async () => {
        const mockedResponseData = {
            Success: 'OK'
        };
        const actualResponse = await mainFuncs.handler(exampleEventProcessingSuccess);
        const key = process.env.TEMPLATE_PREFIX + 'processing_complete.email.template';
        expect(s3Read).toHaveBeenCalledWith(key);
        const message = 'Hello\n\nYour document "My Passport" has been processed successfully.\n\nThank You.';
        expect(snsPublish).toHaveBeenCalledWith(message);
        expect(JSON.stringify(actualResponse)).toBe(JSON.stringify(mockedResponseData));
    });

    afterAll(() => {
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.SNS_TOPIC_ARN;
        delete process.env.TEMPLATES_BUCKET_NAME;
        delete process.env.TEMPLATE_PREFIX;
        snsPublish.mockRestore();
        s3Read.mockRestore();
    });
});

describe('When lambda is invoked for processing failure', () => {
    let s3Read, snsPublish;

    beforeAll(() => {
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.SNS_TOPIC_ARN = 'fake-topic';
        process.env.TEMPLATES_BUCKET_NAME = 'fakeBucket';
        process.env.TEMPLATE_PREFIX = 'fakePrefix/';

        s3Read = jest.spyOn(s3Funcs, 'getTemplateFromS3').mockImplementation((key) => {
            return expectedS3ResponseDocProcessFailed;
        });

        const mockedResponseData = {
            Success: 'OK'
        };
        snsPublish = jest.spyOn(snsFuncs, 'sendSNSNotification').mockImplementation((message) => {
            return mockedResponseData;
        });

        AWSMock.mock('SNS', 'publish', (message, callback) => {
            callback(null, mockedResponseData);
        });
    });

    beforeEach(() => {
        process.env.TEMPLATES_BUCKET_NAME = 'fakeBucket';
        jest.clearAllMocks();
    });

    it('workflow processing failure template is correctly filled', async () => {
        const mockedResponseData = {
            Success: 'OK'
        };
        const actualResponse = await mainFuncs.handler(exampleEventProcessingFailed);
        const key = process.env.TEMPLATE_PREFIX + 'workflow_processing_failure.email.template';
        expect(s3Read).toHaveBeenCalledWith(key);
        expect(snsPublish).toHaveBeenCalledWith(expectedProcessingFailedMessage);
        expect(JSON.stringify(actualResponse)).toBe(JSON.stringify(mockedResponseData));
    });

    afterAll(() => {
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.SNS_TOPIC_ARN;
        delete process.env.TEMPLATES_BUCKET_NAME;
        delete process.env.TEMPLATE_PREFIX;
        snsPublish.mockRestore();
        s3Read.mockRestore();
    });
});
