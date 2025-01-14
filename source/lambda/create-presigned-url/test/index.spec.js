// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const lambda = require('../index');
const SharedLib = require('common-node-lib');
const AWS = require('aws-sdk');
const AWSMock = require('aws-sdk-mock');

describe('When invoking lambda without required env variables', () => {
    beforeEach(() => {
        process.env.UPLOAD_DOCS_BUCKET_NAME = 'testBucket';
        process.env.S3_UPLOAD_PREFIX = 'initial';
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';

        jest.spyOn(SharedLib, 'getUserIdFromEvent').mockImplementation((event) => {
            expect(event.headers.Authorization).toEqual('fake-token');
            return 'mock-user-id';
        });

        AWSMock.mock('S3', 'getObjectTagging', async (s3Params) => {
            expect(s3Params).toEqual({
                Bucket: 'testBucket',
                Key: 'fake/test/location',
                ExpectedBucketOwner: 'fake-account-id'
            });
            return {
                TagSet: [
                    {
                        Key: 'userId',
                        Value: 'mock-user-id'
                    }
                ]
            };
        });
    });

    it('Should send error response', async () => {
        jest.spyOn(SharedLib, 'formatError').mockImplementation(async (params) => {
            expect(params).toBeDefined();
            return 'fake-error-response';
        });
        const response = await lambda.handler({});
        expect(response).toEqual('fake-error-response');
    });

    afterAll(() => {
        jest.resetAllMocks();
    });
});

describe('When invoking lambda with an event object', () => {
    beforeEach(() => {
        process.env.UPLOAD_DOCS_BUCKET_NAME = 'testBucket';
        process.env.S3_UPLOAD_PREFIX = 'initial';
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';

        jest.spyOn(SharedLib, 'getUserIdFromEvent').mockImplementation((event) => {
            expect(event.headers.Authorization).toEqual('fake-token');
            return 'mock-user-id';
        });

        jest.spyOn(AWS, 'S3').mockImplementation(() => {
            return {
                getObjectTagging: () => {
                    return {
                        promise: () => {
                            return Promise.resolve({
                                TagSet: [{ Key: 'userId', Value: 'mock-user-id' }]
                            });
                        }
                    };
                },
                getObject: () => {
                    return {
                        promise: () => {
                            return Promise.resolve({
                                Metadata: {
                                    userId: 'mock-user-id'
                                }
                            });
                        },
                        presign: (number) => {
                            expect(number).toEqual(60);
                            return 'http://fake/signedUrl';
                        },
                        on: jest.fn()
                    };
                }
            };
        });
    });

    it('should pass successfully', async () => {
        const context = {
            invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:my-function'
        };
        const testEvent = {
            queryStringParameters: {
                key: 'fake/test/location'
            },
            headers: {
                Authorization: 'fake-token'
            }
        };
        const response = await lambda.handler(testEvent, context);
        const expectedResponse = SharedLib.formatResponse({ downloadUrl: 'http://fake/signedUrl' });

        expect(response).toEqual(expectedResponse);
    });

    afterEach(() => {
        delete process.env.UPLOAD_DOCS_BUCKET_NAME;
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.S3_UPLOAD_PREFIX;

        jest.resetAllMocks();
    });
});
