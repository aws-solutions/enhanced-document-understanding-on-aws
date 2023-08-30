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

const lambda = require('../index');
const SharedLib = require('common-node-lib');
const AWSMock = require('aws-sdk-mock');

describe('When invoking lambda without required env variables', () => {
    // eslint-disable-next-line no-unused-vars
    const formatErrorSpy = jest.spyOn(SharedLib, 'formatError').mockImplementation(async (params) => {
        return 'fake-error-response';
    });
    it('Should send error response', async () => {
        const response = await lambda.handler({});
        expect(response).toEqual('fake-error-response');
    });
    afterAll(() => {
        formatErrorSpy.mockRestore();
    });
});

describe('When sending unsupported http requests to lambda', () => {
    beforeAll(() => {
        process.env.CASE_DDB_TABLE_NAME = 'testTable';
        process.env.S3_UPLOAD_PREFIX = 'initial';
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.DDB_GSI_USER_ID = 'fake-gsi-index';
    });

    it('Should throw an error', async () => {
        jest.spyOn(SharedLib, 'getUserIdFromEvent').mockImplementation((event) => {
            expect(event.headers.Authorization).toEqual('fake-token');
            return 'mock-user-id';
        });

        const event = {
            httpMethod: 'POST',
            resource: '/cases',
            body: '{"userId":"fake-user-id","caseId":"fake-case-id"}'
        };

        const response = await lambda.handler(event);
        expect(response).toEqual(SharedLib.formatError('Invalid request: Only HTTP GET requests are supported'));
    });

    afterAll(() => {
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.S3_UPLOAD_PREFIX;
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.DDB_GSI_USER_ID;

        jest.resetAllMocks();
    });
});

describe('When invoking lambda endpoints', () => {
    const dataRecord = {
        Key: {
            CASE_ID: {
                S: 'fake-case-id'
            }
        },
        Count: 2,
        Items: [
            {
                DOCUMENT_ID: {
                    S: 'fake-document-id-1'
                }
            },
            {
                DOCUMENT_ID: {
                    S: 'fake-document-id-2'
                }
            }
        ]
    };

    beforeEach(() => {
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.DDB_GSI_USER_ID = 'fake-gsi-index';
        process.env.CASE_DDB_TABLE_NAME = 'testTable';
        process.env.S3_UPLOAD_PREFIX = 'initial';
        process.env.S3_REDACTED_PREFIX = 'redacted';

        jest.spyOn(SharedLib, 'getUserIdFromEvent').mockImplementation((event) => {
            expect(event.headers.Authorization).toEqual('fake-token');
            return 'mock-user-id';
        });

        jest.spyOn(SharedLib, 'getCognitoEntityFromAuthToken').mockImplementation((authToken) => {
            return {
                'cognito:username': 'fake-userid'
            };
        });

        AWSMock.mock('S3', 'headObject', async (params) => {
            expect(params).toBeDefined();
            return 'mocked-object-metadata';
        });
    });

    it('should list all docs when `/cases` is hit', async () => {
        const mockedResponse = {
            Count: 2,
            Items: [
                {
                    CASE_ID: {
                        S: 'fake-case-id-1'
                    }
                },
                {
                    CASE_ID: {
                        S: 'fake-case-id-2'
                    }
                }
            ]
        };
        AWSMock.mock('DynamoDB', 'query', async (params) => {
            expect(params.TableName).toEqual('testTable');
            expect(params.IndexName).toEqual('fake-gsi-index');
            return mockedResponse;
        });

        const event = {
            httpMethod: 'GET',
            resource: '/cases',
            headers: {
                Authorization: 'fake-token'
            }
        };
        const response = await lambda.handler(event);
        expect(response).toEqual(SharedLib.formatResponse(mockedResponse));
    });

    it('should get the record docs when `/case/{caseId}` is hit', async () => {
        AWSMock.mock('DynamoDB', 'query', (error, callback) => {
            const mockReturnResponse = {
                Count: dataRecord.Count,
                Items: dataRecord.Items
            };
            callback(null, mockReturnResponse);
        });

        const event = {
            httpMethod: 'GET',
            resource: '/case/{caseId}',
            body: '{"userId":"fake-user-id","caseId":"fake-case-id"}',
            pathParameters: {
                caseId: 'fake-case-id'
            }
        };
        const response = await lambda.handler(event);
        console.debug(response);

        expect(response.body).toEqual(JSON.stringify({ Count: dataRecord.Count, Items: dataRecord.Items }));
    });

    it('should get the record docs when `/document/{caseId}/{documentId}` is hit', async () => {
        AWSMock.mock('DynamoDB', 'getItem', async (params) => {
            console.debug(params);
            return {
                Item: {
                    DOCUMENT_ID: {
                        S: 'fake-document-id'
                    },
                    BUCKET_NAME: {
                        S: 'fake-bucket-name'
                    },
                    S3_KEY: {
                        S: 'fake-key'
                    },
                    UPLOADED_FILE_NAME: {
                        S: 'fake-file-name'
                    },
                    CASE_ID: {
                        'S': 'fake-userid:fake-case-id'
                    },
                    DOCUMENT_TYPE: {
                        'S': 'passport'
                    },
                    USER_ID: {
                        'S': 'fake-userid'
                    },
                    UPLOADED_FILE_EXTENSION: {
                        'S': '.jpg'
                    }
                }
            };
        });

        const eventWithoutQueryString = {
            httpMethod: 'GET',
            resource: '/document/{caseId}/{documentId}',
            pathParameters: {
                caseId: 'fake-case-id',
                documentId: 'fake-document-id'
            },
            headers: {
                Authorization: 'fake-token'
            }
        };

        const response = await lambda.handler(eventWithoutQueryString);
        console.debug(response);

        expect(response).toEqual(
            SharedLib.formatResponse({
                DocId: 'fake-document-id',
                Bucket: 'fake-bucket-name',
                key: 'redacted/fake-userid:fake-case-id/fake-document-id-redacted.jpg',
                FileName: 'fake-file-name'
            })
        );

        const eventRedactedTrue = {
            httpMethod: 'GET',
            resource: '/document/{caseId}/{documentId}',
            pathParameters: {
                caseId: 'fake-case-id',
                documentId: 'fake-document-id'
            },
            queryStringParameters: {
                redacted: 'true'
            },
            headers: {
                Authorization: 'fake-token'
            }
        };

        const responseRedactedDoc = await lambda.handler(eventRedactedTrue);

        expect(responseRedactedDoc).toEqual(
            SharedLib.formatResponse({
                DocId: 'fake-document-id',
                Bucket: 'fake-bucket-name',
                key: 'redacted/fake-userid:fake-case-id/fake-document-id-redacted.jpg',
                FileName: 'fake-file-name'
            })
        );

        const eventRedactedFalse = {
            httpMethod: 'GET',
            resource: '/document/{caseId}/{documentId}',
            pathParameters: {
                caseId: 'fake-case-id',
                documentId: 'fake-document-id'
            },
            queryStringParameters: {
                redacted: 'false'
            },
            headers: {
                Authorization: 'fake-token'
            }
        };

        const responseUnredactedDoc = await lambda.handler(eventRedactedFalse);

        expect(responseUnredactedDoc).toEqual(
            SharedLib.formatResponse({
                DocId: 'fake-document-id',
                Bucket: 'fake-bucket-name',
                key: 'fake-key',
                FileName: 'fake-file-name'
            })
        );
    });

    it('should catch, format, and return error response if api call errors out', async () => {
        AWSMock.mock('DynamoDB', 'query', async (params) => {
            expect(params.TableName).toEqual('testTable');
            throw new Error('mock-error');
        });

        const event = {
            httpMethod: 'GET',
            resource: '/cases',
            body: '{"userId":"fake-user-id","caseId":"fake-case-id"}',
            headers: {
                Authorization: 'fake-token'
            }
        };
        const response = await lambda.handler(event);
        expect(response).toEqual(SharedLib.formatError('mock-error'));
    });

    afterEach(() => {
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.DDB_GSI_USER_ID;
        delete process.env.S3_UPLOAD_PREFIX;
        delete process.env.S3_REDACTED_PREFIX;

        AWSMock.restore('DynamoDB');
        jest.resetAllMocks();
    });
});
