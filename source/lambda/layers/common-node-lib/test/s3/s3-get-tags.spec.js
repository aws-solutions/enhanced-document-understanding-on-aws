// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
