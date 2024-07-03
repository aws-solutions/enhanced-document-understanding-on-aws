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
const fs = require('fs');
const AWSMock = require('aws-sdk-mock');
const s3Tagger = require('../../s3/s3-get-tags');

describe('S3 Tagging: When provided with correct inputs', () => {
    beforeAll(() => {
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.DOCUMENT_BUCKET_NAME = 'fake-bucket';
        process.env.WORKFLOW_S3_PREFIX = 'test-workflow-prefix';

        AWSMock.mock('S3', 'getObjectTagging', {
            TagSet: [
                {
                    Key: 'test',
                    Value: 'test'
                }
            ]
        });
    });

    it('should pass successfully', async () => {
        const response = await s3Tagger.getObjectTaggingFromS3({ Bucket: 'test', Key: 'test-key' });

        expect(response.TagSet.length).toBe(1);
        s3Tagger.checkS3EnvSetup();
    });

    afterEach(() => {
        jest.clearAllMocks();
        process.env.DOCUMENT_BUCKET_NAME = 'fake-bucket';
    });

    afterAll(() => {
        AWSMock.restore('S3');

        delete process.env.WORKFLOW_S3_PREFIX;
        delete process.env.DOCUMENT_BUCKET_NAME;
    });
});

describe('S3 Tagging: When provided with incorrect inputs', () => {
    beforeAll(() => {
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.DOCUMENT_BUCKET_NAME = 'fake-bucket';
        process.env.WORKFLOW_S3_PREFIX = 'test-workflow-prefix';

        AWSMock.mock('S3', 'getObjectTagging', (params, callback) => {
            callback(new Error('Fake error: Connection reset while uploading.'), null);
        });
    });

    it('should pass successfully', async () => {
        await expect(s3Tagger.getObjectTaggingFromS3({ Bucket: 'test', Key: 'test-key' })).rejects.toThrow(
            'Fake error: Connection reset while uploading.'
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
        process.env.DOCUMENT_BUCKET_NAME = 'fake-bucket';
    });

    afterAll(() => {
        AWSMock.restore('S3');
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.WORKFLOW_S3_PREFIX;
        delete process.env.DOCUMENT_BUCKET_NAME;
    });
});
