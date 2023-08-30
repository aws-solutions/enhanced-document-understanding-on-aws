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

const AWSMock = require('aws-sdk-mock');
const lambda = require('../index');
const SharedLib = require('common-node-lib');

describe('When invoking lambda', () => {
    beforeEach(() => {
        process.env.KENDRA_INDEX_ID = 'mock-query-id';
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
    });

    it('should throw an error when no index id is set', async () => {
        delete process.env.KENDRA_INDEX_ID;

        const event = {
            httpMethod: 'GET',
            resource: '/search/kendra/{query}',
            pathParameters: { 'query': 'fake-query-text' },
            headers: { Authorization: 'fake-token' }
        };

        const response = await lambda.handler(event);
        expect(response).toEqual(
            SharedLib.formatError(
                'KENDRA_INDEX_ID Lambda Environment variable not set. Ensure you have set the DeployKendraIndex parameter to "Yes" when deploying the CloudFormation template'
            )
        );
    });

    it('should pass successfully', async () => {
        const mockedKendraResponse = {
            QueryId: 'mock-query-id',
            ResultItems: [
                {
                    Id: '1',
                    MockResponse: 'test-response'
                }
            ]
        };
        AWSMock.mock('Kendra', 'query', async (params) => {
            expect(params.QueryText).toEqual('fake query text');
            expect(params.IndexId).toEqual('mock-query-id');
            expect(params.Facets).toEqual([
                {
                    'DocumentAttributeKey': SharedLib.WorkflowOrchestratorDefaults.KENDRA_ATTRIBUTES.DOC_TYPE
                },
                {
                    'DocumentAttributeKey': SharedLib.WorkflowOrchestratorDefaults.KENDRA_ATTRIBUTES.FILE_TYPE
                }
            ]);
            expect(params.UserContext.Token).toEqual('fake-token');

            return mockedKendraResponse;
        });

        const event = {
            httpMethod: 'GET',
            resource: '/search/kendra/{query}',
            pathParameters: { 'query': 'fake%20query%20text' },
            headers: { Authorization: 'fake-token' }
        };

        const response = await lambda.handler(event);
        expect(response).toEqual(SharedLib.formatResponse(mockedKendraResponse));
    });

    // test the handler if the mock event has attribute filters in the event.multiValueQueryStringParameters
    it('should pass successfully with attribute filters', async () => {
        const mockedKendraResponse = {
            QueryId: 'mock-query-id',
            ResultItems: [
                {
                    Id: '1',
                    MockResponse: 'test-response'
                }
            ]
        };
        AWSMock.mock('Kendra', 'query', async (params) => {
            expect(params.QueryText).toEqual('fake query text');
            expect(params.IndexId).toEqual('mock-query-id');
            expect(params.Facets).toEqual([
                {
                    'DocumentAttributeKey': SharedLib.WorkflowOrchestratorDefaults.KENDRA_ATTRIBUTES.DOC_TYPE
                },
                {
                    'DocumentAttributeKey': SharedLib.WorkflowOrchestratorDefaults.KENDRA_ATTRIBUTES.FILE_TYPE
                }
            ]);
            expect(params.UserContext.Token).toEqual('fake-token');
            expect(params.AttributeFilter).toEqual({
                'AndAllFilters': [
                    {
                        'OrAllFilters': [
                            {
                                'EqualsTo': { 'Key': 'mock-doc-attribute-1', 'Value': { 'StringValue': 'mock-value1' } }
                            },
                            {
                                'EqualsTo': { 'Key': 'mock-doc-attribute-1', 'Value': { 'StringValue': 'mock-value2' } }
                            }
                        ]
                    },
                    {
                        'OrAllFilters': [
                            {
                                'EqualsTo': { 'Key': 'mock-doc-attribute-2', 'Value': { 'StringValue': 'mock-value3' } }
                            }
                        ]
                    }
                ]
            });
            return mockedKendraResponse;
        });

        const event = {
            httpMethod: 'GET',
            resource: '/search/kendra/{query}',
            pathParameters: { 'query': 'fake%20query%20text' },
            multiValueQueryStringParameters: {
                'mock-doc-attribute-1': ['mock-value1', 'mock-value2'],
                'mock-doc-attribute-2': ['mock-value3']
            },
            headers: { Authorization: 'fake-token' }
        };

        const response = await lambda.handler(event);
        expect(response).toEqual(SharedLib.formatResponse(mockedKendraResponse));
    });

    it('should throw an error when kendra throws an error', async () => {
        AWSMock.mock('Kendra', 'query', async (params) => {
            throw new Error('Kendra error');
        });

        const event = {
            httpMethod: 'GET',
            resource: '/search/kendra/{query}',
            pathParameters: { 'query': 'fake-query-text' },
            headers: { Authorization: 'fake-token' }
        };

        try {
            await lambda.handler(event);
        } catch (e) {
            expect(e.message).toEqual('Kendra error');
        }
    });

    it('should throw an error if the event is a POST request', async () => {
        const event = {
            httpMethod: 'POST',
            resource: '/search/kendra/{query}',
            pathParameters: { 'query': 'fake-query-text' },
            headers: { Authorization: 'fake-token' }
        };

        const response = await lambda.handler(event);
        expect(response).toEqual(SharedLib.formatError('Invalid request: Only HTTP GET requests are supported'));
    });

    // should throw an error if Authorization token is missing from the event header
    it('should throw an error if Authorization token is missing from the event header', async () => {
        const event = {
            httpMethod: 'GET',
            resource: '/search/kendra/{query}',
            pathParameters: { 'query': 'fake-query-text' }
        };

        const response = await lambda.handler(event);
        expect(response).toEqual(
            SharedLib.formatError("Cannot read properties of undefined (reading 'Authorization')")
        );
    });

    it('should throw an error if no query param is passed', async () => {
        const event = {
            httpMethod: 'GET',
            resource: '/search/kendra/{query}',
            headers: { Authorization: 'fake-token' }
        };

        const response = await lambda.handler(event);
        expect(response).toEqual(SharedLib.formatError('"query" is required to be passed as a path parameter'));
    });

    it('should throw an error if we got here from the wrong resource somehow', async () => {
        const event = {
            httpMethod: 'GET',
            resource: '/search/kendra/{bad-query}',
            headers: { Authorization: 'fake-token' }
        };

        const response = await lambda.handler(event);
        expect(response).toEqual(
            SharedLib.formatError('Invalid resource requested: Only /search/kendra/{query} is supported')
        );
    });

    afterEach(() => {
        AWSMock.restore('Kendra');
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.KENDRA_INDEX_ID;
    });
});
