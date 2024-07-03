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

const lambda = require('../index');
const SharedLib = require('common-node-lib');
const AWSMock = require('aws-sdk-mock');
const { dynamoDBConfigResponse, dynamoDbQueryResponse } = require('./config/config-data');

describe('When invoking lambda without required env variables', () => {
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
        process.env.UPLOAD_DOCS_BUCKET_NAME = 'fake-prefix';
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.DDB_GSI_USER_DOC_ID = 'user-doc-id-index';
    });

    it('Should throw an error', async () => {
        const formatErrorSpy = jest.spyOn(SharedLib, 'formatError').mockImplementation(async (params) => {
            return 'fake-error-response';
        });

        const event = {
            httpMethod: 'GET',
            resource: '/case',
            body: '{"userId":"fake-user-id","caseId":"fake-case-id", "caseName": "case0001"}'
        };

        const response = await lambda.handler(event);
        expect(response).toEqual('fake-error-response');
    });

    afterAll(() => {
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.UPLOAD_DOCS_BUCKET_NAME;

        jest.resetAllMocks();
    });
});

describe('When invoking lambda endpoints', () => {
    let publishMetricsSpy, formatResponseSpy, formatErrorSpy;

    beforeEach(() => {
        process.env.WORKFLOW_CONFIG_TABLE_NAME = 'fake-workflow-config-table';
        process.env.WORKFLOW_CONFIG_NAME = 'fake-workflow-config-name';
        process.env.CASE_DDB_TABLE_NAME = 'testTable';
        process.env.S3_UPLOAD_PREFIX = 'initial';
        process.env.UPLOAD_DOCS_BUCKET_NAME = 'fake-prefix';
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';

        AWSMock.mock('DynamoDB', 'putItem', async (ddbParams) => {
            return {
                Attributes: {
                    'USER_ID': { S: 'fakeUserId' }
                }
            };
        });

        AWSMock.mock('S3', 'createPresignedPost', async (s3Params) => {
            return {};
        });

        AWSMock.mock('DynamoDB', 'getItem', (params, callback) => {
            callback(null, dynamoDBConfigResponse);
        });

        AWSMock.mock('DynamoDB', 'query', (params, callback) => {
            callback(null, dynamoDbQueryResponse);
        });

        jest.spyOn(SharedLib, 'getCase').mockImplementation(async (params) => {
            return {
                Key: {
                    CASE_ID: {
                        S: 'fake-case-id'
                    }
                },
                Count: 2,
                Items: [
                    {
                        DOCUMENT_ID: {
                            S: '0000'
                        }
                    },
                    {
                        DOCUMENT_ID: {
                            S: 'fake-document-id-1'
                        },
                        DOCUMENT_TYPE: {
                            S: 'bankAccount'
                        }
                    }
                ]
            };
        });

        formatResponseSpy = jest.spyOn(SharedLib, 'formatResponse').mockImplementation(async (params) => {
            return {
                statusCode: 200,
                body: 'fake-body-response'
            };
        });

        publishMetricsSpy = jest
            .spyOn(SharedLib.CloudWatchMetrics.prototype, 'publishMetrics')
            .mockImplementation(() => {});
    });

    it('Should create a new case', async () => {
        formatErrorSpy = jest.spyOn(SharedLib, 'getUserIdFromEvent').mockImplementation((event) => {
            expect(event.headers.Authorization).toEqual('fake-auth-token');
            return 'fake-user-id';
        });
        const event = {
            httpMethod: 'POST',
            resource: '/case',
            headers: {
                Authorization: 'fake-auth-token'
            },
            body: '{"userId":"fake-user-id","caseId":"fake-case-id", "caseName": "case0001"}'
        };

        const response = await lambda.handler(event);
        expect(response).toEqual({
            statusCode: 200,
            body: 'fake-body-response'
        });
        // Create case metrics called instead
        expect(publishMetricsSpy).toHaveBeenCalledTimes(1);
    });

    it('Should create a document record', async () => {
        const event = {
            httpMethod: 'POST',
            resource: '/document',
            body: '{"userId":"fake-user-id","caseId":"fake-user-id:fake-case-id","fileName":"fake-file","fileExtension":".jpg","documentType":"paystub"}',
            requestContext: { authorizer: { claims: { 'cognito:username': 'fake-user-id' } } }
        };

        const response = await lambda.handler(event);
        expect(response).toEqual({
            statusCode: 200,
            body: 'fake-body-response'
        });

        // fileExtension and Document upload, both.
        expect(publishMetricsSpy).toHaveBeenCalledTimes(2);
    });

    it('should throw error when creating document record if userId is not associated with caseId', async () => {
        jest.spyOn(SharedLib, 'formatError').mockImplementation(async (params) => {
            return 'User is not associated with the case';
        });

        const event = {
            httpMethod: 'POST',
            resource: '/document',
            body: '{"userId":"fake-user-id","caseId":"fake-user-id:fake-case-id","fileName":"fake-file","fileExtension":".jpg","documentType":"paystub"}',
            requestContext: { authorizer: { claims: { 'cognito:username': 'invalid-fake-user-id' } } }
        };

        const response = await lambda.handler(event);
        expect(response).toEqual('User is not associated with the case');
    });

    it('should throw error when starting job if userId is not associated with caseId', async () => {
        jest.spyOn(SharedLib, 'formatError').mockImplementation(async (params) => {
            return 'User is not associated with the case';
        });

        const event = {
            httpMethod: 'POST',
            resource: '/case/start-job',
            body: '{"userId":"fake-user-id","caseId":"fake-user-id:fake-case-id","jobType":"fake-job-type"}',
            requestContext: { authorizer: { claims: { 'cognito:username': 'invalid-fake-user-id' } } }
        };

        const response = await lambda.handler(event);
        expect(response).toEqual('User is not associated with the case');
    });

    it('Should throw an error and format the response', async () => {
        AWSMock.remock('DynamoDB', 'putItem', async (ddbParams) => {
            throw new Error('fake-error');
        });
        const formatErrorSpy = jest.spyOn(SharedLib, 'formatError').mockImplementation(async (params) => {
            return 'fake-error-response';
        });

        const event = {
            httpMethod: 'POST',
            resource: '/case',
            body: '{"userId":"fake-user-id","caseId":"fake-case-id", "caseName": "case0001"}'
        };

        const response = await lambda.handler(event);
        expect(response).toEqual('fake-error-response');
    });

    afterEach(() => {
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.UPLOAD_DOCS_BUCKET_NAME;
        delete process.env.WORKFLOW_CONFIG_TABLE_NAME;
        delete process.env.WORKFLOW_CONFIG_NAME;

        jest.resetAllMocks();
    });
});
