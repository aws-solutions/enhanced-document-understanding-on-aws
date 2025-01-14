// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const lambda = require('../index');
const InferenceGetter = require('../utils/get-inferences');
const SharedLib = require('common-node-lib');

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
        process.env.S3_INFERENCE_BUCKET_NAME = 'fake-bucket';
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
    });

    it('Should throw an error', async () => {
        jest.spyOn(SharedLib, 'formatError').mockImplementation(async (params) => {
            return 'fake-error-response';
        });

        const event = {
            httpMethod: 'POST',
            resource: '/inferences/caseId/documentId',
            body: '{"userId":"fake-user-id","caseId":"fake-case-id"}'
        };

        const context = {
            invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:my-function'
        };

        const response = await lambda.handler(event, context);
        expect(response).toEqual('fake-error-response');
    });

    afterAll(() => {
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.S3_INFERENCE_BUCKET_NAME;
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;

        jest.restoreAllMocks();
    });
});

describe('When invoking lambda endpoints', () => {
    const fakeInferenceTypes = ['fake-inference1', 'fake-inference2'];
    const fakeInference = { 'test': { 'test2': 1, 'test3': 2 } };

    beforeAll(() => {
        jest.spyOn(InferenceGetter, 'listInferences').mockImplementation(async (params) => {
            return fakeInferenceTypes;
        });
        jest.spyOn(InferenceGetter, 'getInference').mockImplementation(async (params) => {
            return fakeInference;
        });
    });

    beforeEach(() => {
        process.env.CASE_DDB_TABLE_NAME = 'testTable';
        process.env.S3_INFERENCE_BUCKET_NAME = 'fake-bucket';
    });

    it('should list all available inferences for a doc when `/inferences/{caseId}/{documentId}` is hit', async () => {
        jest.spyOn(InferenceGetter, 'listInferences').mockImplementation(async (params) => {
            return fakeInferenceTypes;
        });
        const event = {
            httpMethod: 'GET',
            resource: '/inferences/{caseId}/{documentId}',
            pathParameters: { 'caseId': 'fake-user:fake-case-id', 'documentId': 'fake-doc-id' },
            requestContext: { authorizer: { claims: { 'cognito:username': 'fake-user' } } }
        };

        const context = {
            invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:my-function'
        };
        const response = await lambda.handler(event, context);
        expect(response.body).toEqual(JSON.stringify(fakeInferenceTypes));
    });

    it('should get the specific inference when `/inferences/{caseId}/{documentId}/{inferenceType}` is hit', async () => {
        const event = {
            httpMethod: 'GET',
            resource: '/inferences/{caseId}/{documentId}/{inferenceType}',
            pathParameters: {
                'caseId': 'fake-user:fake-case-id',
                'documentId': 'fake-doc-id',
                'inferenceType': 'fake-inference-type'
            },
            requestContext: { authorizer: { claims: { 'cognito:username': 'fake-user' } } }
        };

        const context = {
            invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:my-function'
        };
        const response = await lambda.handler(event, context);

        expect(response.body).toEqual(JSON.stringify(fakeInference));
    });

    it('should catch, format, and return error response if list inferences api call errors out', async () => {
        const errorMessage = 'fake-error-message';
        jest.spyOn(InferenceGetter, 'listInferences').mockImplementation(async (params) => {
            throw new Error(errorMessage);
        });

        const event = {
            httpMethod: 'GET',
            resource: '/inferences/{caseId}/{documentId}',
            pathParameters: { 'caseId': 'fake-user:fake-case-id', 'documentId': 'fake-doc-id' },
            requestContext: { authorizer: { claims: { 'cognito:username': 'fake-user' } } }
        };
        const context = {
            invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:my-function'
        };
        const response = await lambda.handler(event, context);
        expect(response.body).toEqual(`CustomExecutionError: ${errorMessage}`);
    });

    it('should catch, format, and return error response if get inference api call errors out', async () => {
        const errorMessage = 'fake-error-message';
        jest.spyOn(InferenceGetter, 'getInference').mockImplementation(async (params) => {
            throw new Error(errorMessage);
        });

        const event = {
            httpMethod: 'GET',
            resource: '/inferences/{caseId}/{documentId}/{inferenceType}',
            pathParameters: {
                'caseId': 'fake-user:fake-case-id',
                'documentId': 'fake-doc-id',
                'inferenceType': 'fake-inference-type'
            },
            requestContext: { authorizer: { claims: { 'cognito:username': 'fake-user' } } }
        };
        const context = {
            invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:my-function'
        };
        const response = await lambda.handler(event, context);
        expect(response.body).toEqual(`CustomExecutionError: ${errorMessage}`);
    });

    it('should return an error if user is not associated with the case', async () => {
        const event = {
            httpMethod: 'GET',
            pathParameters: { caseId: 'user123:case456' },
            requestContext: { authorizer: { claims: { 'cognito:username': 'user456' } } }
        };
        const context = {
            invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:my-function'
        };
        const response = await lambda.handler(event, context);
        expect(response.body).toEqual('CustomExecutionError: User is not associated with the case');
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });
});
