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
const s3Downloader = require('../../s3/s3-download');

describe('S3 File Downloader: When provided with correct inputs', () => {
    beforeEach(() => {
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.DOCUMENT_BUCKET_NAME = 'fake-bucket';
    });

    it('Should download object from the default bucket', async () => {
        AWSMock.mock('S3', 'getObject', async (params) => {
            expect(params.Bucket).toEqual(process.env.DOCUMENT_BUCKET_NAME);
            return 'success';
        });

        expect(
            await s3Downloader.downloadObjectFromS3({
                Key: 'fake-key'
            })
        ).toEqual('success');
    });

    it('Should download object from the supplied bucket', async () => {
        AWSMock.mock('S3', 'getObject', async (params) => {
            expect(params).toEqual({
                Bucket: 'custom-test-bucket',
                Key: 'fake-key'
            });
            return 'success';
        });

        expect(
            await s3Downloader.downloadObjectFromS3({
                Bucket: 'custom-test-bucket',
                Key: 'fake-key'
            })
        ).toEqual('success');
    });

    it('Should handle any extra parameters for s3 downlaod call', async () => {
        AWSMock.mock('S3', 'getObject', async (params) => {
            expect(params).toEqual({
                Bucket: process.env.DOCUMENT_BUCKET_NAME,
                Key: 'fake-key',
                ResponseContentDisposition: 'inline',
                ResponseContentType: 'application/pdf'
            });
            return 'success';
        });
        expect(
            await s3Downloader.downloadObjectFromS3({
                Key: 'fake-key',
                otherParams: {
                    ResponseContentDisposition: 'inline',
                    ResponseContentType: 'application/pdf'
                }
            })
        ).toEqual('success');
    });

    afterEach(() => {
        AWSMock.restore('S3');
        delete process.env.DOCUMENT_BUCKET_NAME;
        delete process.env.AWS_SDK_USER_AGENT;
    });
});

describe('S3 File Downloader: When provided with incorrect inputs', () => {
    beforeAll(() => {
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';

        AWSMock.mock('S3', 'getObject', async (params) => {
            throw new Error('fake-error');
        });
    });

    afterEach(() => {
        process.env.DOCUMENT_BUCKET_NAME = 'fake-bucket';
    });

    it('throws an errors due to env variables not being set', async () => {
        expect(() => {
            s3Downloader.checkS3EnvSetup();
        }).toThrow('DOCUMENT_BUCKET_NAME Lambda Environment variable not set.');
    });

    it('should throw an due to s3 error', async () => {
        const params = {
            Bucket: process.env.DOCUMENT_BUCKET_NAME,
            Key: 'fake-key'
        };
        await expect(s3Downloader.downloadObjectFromS3(params)).rejects.toThrow('fake-error');
    });

    afterAll(() => {
        AWSMock.restore('S3');
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.DOCUMENT_BUCKET_NAME;
    });
});
