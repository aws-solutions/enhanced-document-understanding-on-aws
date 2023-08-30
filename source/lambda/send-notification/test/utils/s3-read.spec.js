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
const AWSMock = require('aws-sdk-mock');

const s3Utils = require('../../utils/s3-read');
const { expectedS3ResponseDocUploadSuccess } = require('../event-test-data');

describe('When provided with correct inputs', () => {
    let consoleDebugSpy;

    beforeAll(() => {
        process.env.TEMPLATES_BUCKET_NAME = 'fake-bucket';
        process.env.TEMPLATE_PREFIX = 'fake-prefix/';
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';

        consoleDebugSpy = jest.spyOn(console, 'debug');
    });

    afterEach(() => {
        jest.clearAllMocks();
        process.env.TEMPLATES_BUCKET_NAME = 'fake-bucket';
        process.env.TEMPLATE_PREFIX = 'fake-prefix/';
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
    });

    it('it should log environment variables correctly', async () => {
        s3Utils.checkS3EnvSetup();
        expect(consoleDebugSpy.mock.calls[0][0]).toBe(`TEMPLATES_BUCKET_NAME is: ${process.env.TEMPLATES_BUCKET_NAME}`);
        expect(consoleDebugSpy.mock.calls[1][0]).toBe(`TEMPLATE_PREFIX is: ${process.env.TEMPLATE_PREFIX}`);
        expect(consoleDebugSpy.mock.calls[2][0]).toBe(`AWS_REGION is: ${process.env.AWS_REGION}`);
    });

    describe('S3 getObject: Successfully retreives template', () => {
        beforeAll(async () => {
            jest.clearAllMocks();

            // Setting up mocks
            AWSMock.mock('S3', 'getObject', (params, callback) => {
                callback(null, expectedS3ResponseDocUploadSuccess);
            });
        });

        it('should pass successfully', async () => {
            const templateKey = process.env.TEMPLATE_PREFIX + 'document_upload_success.email.template';
            const actualResponse = await s3Utils.getTemplateFromS3(templateKey, process.env.TEMPLATES_BUCKET_NAME);
            expect(actualResponse).toEqual(expectedS3ResponseDocUploadSuccess);
        });
    });

    afterAll(() => {
        AWSMock.restore('S3');
        delete process.env.TEMPLATES_BUCKET_NAME;
        delete process.env.TEMPLATE_PREFIX;
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
    });
});

describe('When provided with incorrect inputs', () => {
    beforeAll(() => {
        process.env.TEMPLATES_BUCKET_NAME = 'fake-bucket';
        process.env.TEMPLATE_PREFIX = 'fake-prefix/';
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';

        AWSMock.mock('S3', 'getObject', (params, callback) => {
            callback(new Error('Fake error: Connection reset while uploading.'), null);
        });
    });

    afterEach(() => {
        process.env.TEMPLATES_BUCKET_NAME = 'fake-bucket';
        process.env.TEMPLATE_PREFIX = 'fake-prefix/';
    });

    describe('when template bucket is removed', () => {
        beforeAll(() => {
            delete process.env.TEMPLATES_BUCKET_NAME;
        });

        it('throws an errors due to env variables not being set', async () => {
            const output = s3Utils.checkS3EnvSetup();
            await expect(output).rejects.toThrow(Error);
            await expect(output).rejects.toThrow('TEMPLATES_BUCKET_NAME Lambda Environment variable not set.');
        });

        afterAll(() => {
            process.env.TEMPLATES_BUCKET_NAME = 'fake-bucket';
        });
    });

    describe('S3 read: When provided with incorrect inputs', () => {
        it('should throw an error in S3 read', async () => {
            const templateKey = process.env.TEMPLATE_PREFIX + 'document_upload_success.email.template';
            await expect(s3Utils.getTemplateFromS3(templateKey, process.env.TEMPLATES_BUCKET_NAME)).rejects.toThrow(
                'Fake error: Connection reset while uploading.'
            );
        });

        afterAll(() => {
            process.env.TEMPLATES_BUCKET_NAME = 'fake-bucket';
        });
    });

    afterAll(() => {
        AWSMock.restore('S3');
        delete process.env.TEMPLATES_BUCKET_NAME;
        delete process.env.TEMPLATE_PREFIX;
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
    });
});
