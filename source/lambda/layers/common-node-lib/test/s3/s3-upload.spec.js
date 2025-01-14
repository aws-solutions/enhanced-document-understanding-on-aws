// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';
const fs = require('fs');
const AWSMock = require('aws-sdk-mock');
const s3Uploader = require('../../s3/s3-upload');
const { sqsMessages } = require('../event-test-data');

describe('S3 Uploader: When provided with correct inputs', () => {
    let mockfsReadStream, consoleDebugSpy, s3Path, actualResponseArr;

    beforeAll(() => {
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.DOCUMENT_BUCKET_NAME = 'fake-bucket';
        process.env.WORKFLOW_S3_PREFIX = 'test-workflow-prefix';

        AWSMock.mock('S3', 'upload', (params, callback) => {
            callback(null, {
                ETag: 'SomeETag',
                Location: 'PublicWebsiteLink',
                Key: 'fake-key',
                Bucket: 'fake-bucket'
            });
        });
        mockfsReadStream = jest.spyOn(fs, 'createReadStream');
        mockfsReadStream.mockImplementation((filePath) => {
            return {
                on: jest.fn()
            };
        });
        consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.clearAllMocks();
        process.env.DOCUMENT_BUCKET_NAME = 'fake-bucket';
    });

    it('should pass successfully', async () => {
        [s3Path, actualResponseArr] = await s3Uploader.uploadDocsToS3(sqsMessages.Messages);
        console.debug(s3Path);
        const s3Prefix = s3Path.split('/').pop();
        const s3PathResponse = `s3://${process.env.DOCUMENT_BUCKET_NAME}/${process.env.WORKFLOW_S3_PREFIX}/${s3Prefix}`;

        expect(s3Path).toBe(s3PathResponse);
        expect(actualResponseArr[0].taskToken).toBe('fakeToken1');
        expect(actualResponseArr[1].taskToken).toBe('fakeToken2');
        expect(actualResponseArr[0].receiptHandle).toBe('fakeReceiptHandler1');
        expect(actualResponseArr[1].receiptHandle).toBe('fakeReceiptHandler2');
        expect(actualResponseArr[0].s3Prefix).toBe(`${process.env.WORKFLOW_S3_PREFIX}/${s3Prefix}/input/`);
        expect(actualResponseArr[1].s3Prefix).toBe(`${process.env.WORKFLOW_S3_PREFIX}/${s3Prefix}/input/`);
        expect(actualResponseArr[0].s3FileName).toBe('filename1.jpg');
        expect(actualResponseArr[1].s3FileName).toBe('filename2.jpg');
    });

    it('it should log environment variables correctly', async () => {
        s3Uploader.checkS3EnvSetup();
        expect(consoleDebugSpy).toHaveBeenCalledTimes(2);
    });

    afterAll(() => {
        AWSMock.restore('S3');
        mockfsReadStream.mockRestore();
        consoleDebugSpy.mockRestore();
        delete process.env.DOCUMENT_BUCKET_NAME;
        delete process.env.AWS_SDK_USER_AGENT;
    });
});

describe('S3 Uploader: When provided with incorrect inputs', () => {
    let mockfsReadStream;

    beforeAll(() => {
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';

        AWSMock.mock('S3', 'upload', (params, callback) => {
            callback(new Error('Fake error: Connection reset while uploading.'), null);
        });

        mockfsReadStream = jest.spyOn(fs, 'createReadStream');
        mockfsReadStream.mockImplementation((filePath) => {
            return 'Success';
        });
    });

    afterEach(() => {
        process.env.DOCUMENT_BUCKET_NAME = 'fake-bucket';
    });

    it('throws an errors due to env variables not being set', async () => {
        try {
            s3Uploader.checkS3EnvSetup();
        } catch (error) {
            expect(error.message).toBe('DOCUMENT_BUCKET_NAME Lambda Environment variable not set.');
        }
    });

    it('should throw an error in S3 upload', async () => {
        await expect(s3Uploader.uploadDocsToS3(sqsMessages.Messages)).rejects.toThrow(
            'Fake error: Connection reset while uploading.'
        );
    });

    it('should throw an error in createReadStream', async () => {
        AWSMock.remock('S3', 'upload', (params, callback) => {
            callback(null, {
                ETag: 'SomeETag',
                Location: 'PublicWebsiteLink',
                Key: 'fake-key',
                Bucket: 'fake-bucket'
            });
        });
        mockfsReadStream.mockImplementation((filePath) => {
            throw new Error('Fake error: Read stream caused an error.');
        });
        await expect(s3Uploader.uploadDocsToS3(sqsMessages.Messages)).rejects.toThrow(
            'Fake error: Read stream caused an error.'
        );
    });

    afterAll(() => {
        AWSMock.restore('S3');
        mockfsReadStream.mockRestore();
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.WORKFLOW_S3_PREFIX;
        delete process.env.DOCUMENT_BUCKET_NAME;
    });
});
