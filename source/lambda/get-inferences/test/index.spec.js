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
            pathParameters: { 'caseId': 'fake-case-id', 'documentId': 'fake-doc-id' }
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
                'caseId': 'fake-case-id',
                'documentId': 'fake-doc-id',
                'inferenceType': 'fake-inference-type'
            }
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
            pathParameters: { 'caseId': 'fake-case-id', 'documentId': 'fake-doc-id' }
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
                'caseId': 'fake-case-id',
                'documentId': 'fake-doc-id',
                'inferenceType': 'fake-inference-type'
            }
        };
        const context = {
            invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:my-function'
        };
        const response = await lambda.handler(event, context);
        expect(response.body).toEqual(`CustomExecutionError: ${errorMessage}`);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });
});
