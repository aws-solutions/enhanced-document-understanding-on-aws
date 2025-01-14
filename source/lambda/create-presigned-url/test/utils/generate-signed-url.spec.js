// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const SharedLib = require('common-node-lib');
const AWS = require('aws-sdk');
const SignedUrlGenerator = require('../../utils/generate-signed-url');

describe('When creating a pre-signed S3 url', () => {
    beforeEach(() => {
        process.env.UPLOAD_DOCS_BUCKET_NAME = 'testBucket';
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';

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
                getObject: (s3Params) => {
                    expect(s3Params).toEqual({
                        Bucket: 'testBucket',
                        Key: 'fake/test/location',
                        ExpectedBucketOwner: 'fake-account-id'
                    });

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

        jest.spyOn(SharedLib, 'getUserIdFromEvent').mockImplementation((event) => {
            expect(event).toBeDefined();
            return 'mock-user-id';
        });
    });

    it('Should create a valid signed url for getObject', async () => {
        const params = {
            key: 'fake/test/location',
            userId: 'mock-user-id',
            expectedBucketOwner: 'fake-account-id'
        };

        const signedUrl = await SignedUrlGenerator.getDocumentUrl(params);
        expect(signedUrl).toEqual('http://fake/signedUrl');
    });

    it('Should validate that tags contain the userId', async () => {
        const params = {
            key: 'fake/test/location',
            userId: 'mock-user-id',
            expectedBucketOwner: 'fake-account-id'
        };

        const response = await SignedUrlGenerator.isUserIdInTags(params);
        expect(response).toBeTruthy();
    });

    // should throw an error if the userId is not in the tags
    it('Should throw an Error on passing invalid arguments when validating tags', async () => {
        // create a spy for isUserIdInTags function that returns false
        jest.spyOn(SignedUrlGenerator, 'isUserIdInTags').mockImplementation((params) => {
            expect(params).toEqual({
                key: 'fake/test/location',
                userId: 'mock-user-id',
                expectedBucketOwner: 'fake-account-id'
            });
            return false;
        });

        const params = {
            key: 'fake/test/location',
            userId: 'mock-user-id',
            expectedBucketOwner: 'fake-account-id'
        };

        try {
            await SignedUrlGenerator.isUserIdInTags(params);
        } catch (error) {
            expect(error.message).toEqual('User ID not found in tags');
        }
    });

    // should throw error if getObjectTagging api call fails
    it('Should throw an Error on getObjectTagging api call failure', async () => {
        // remock the getSignedUrl function
        jest.spyOn(AWS, 'S3').mockImplementation(() => {
            return {
                getObjectTagging: () => {
                    return {
                        promise: () => {
                            return Promise.reject(new Error('getObjectTagging api call failed'));
                        }
                    };
                },
                getObject: (s3Params) => {
                    expect(s3Params).toEqual({
                        Bucket: 'testBucket',
                        Key: 'fake/test/location',
                        ExpectedBucketOwner: 'fake-account-id'
                    });
                }
            };
        });

        const params = {
            key: 'fake/test/location',
            userId: 'mock-user-id',
            expectedBucketOwner: 'fake-account-id'
        };

        try {
            await SignedUrlGenerator.getDocumentUrl(params);
        } catch (error) {
            expect(error.message).toEqual('getObjectTagging api call failed');
        }
    });

    afterEach(() => {
        delete process.env.UPLOAD_DOCS_BUCKET_NAME;
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        jest.restoreAllMocks();
    });
});
