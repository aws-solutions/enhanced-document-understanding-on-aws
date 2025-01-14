// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const AWSMock = require('aws-sdk-mock');
const lambda = require('../index');
const SharedLib = require('common-node-lib');
const { AossProxy } = require('common-node-lib');
const { mockedOpenSearchResponse } = require('./event-test-data');

describe('When invoking lambda', () => {
    beforeEach(() => {
        process.env.KENDRA_INDEX_ID = 'mock-query-id';
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.OS_COLLECTION_ENDPOINT = 'https://foobar.us-east-1.aoss.amazonaws.com';
    });

    it('should throw an error when no index id and open search both are not set', async () => {
        delete process.env.KENDRA_INDEX_ID;
        delete process.env.AWS_REGION;
        delete process.env.OS_COLLECTION_ENDPOINT;

        const event = {
            httpMethod: 'GET',
            resource: '/search/kendra/{query}',
            pathParameters: { 'query': 'fake-query-text' },
            headers: { Authorization: 'fake-token' }
        };

        const response = await lambda.handler(event);
        expect(response).toEqual(
            SharedLib.formatError(
                'Either KENDRA_INDEX_ID Lambda Environment variable is not set or AWS_REGION and OS_COLLECTION_ENDPOINT is not set'
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
            SharedLib.formatError(
                'Invalid resource requested: Only /search/kendra/{query} or /search/kendra/{query} is supported'
            )
        );
    });

    it('should throw an error when no collection endpoint is set', async () => {
        delete process.env.OS_COLLECTION_ENDPOINT;
        delete process.env.KENDRA_INDEX_ID;

        const event = {
            httpMethod: 'GET',
            resource: '/search/opensearch/{query}',
            pathParameters: { 'query': 'fake-query-text' },
            headers: { Authorization: 'fake-token' }
        };

        const response = await lambda.handler(event);
        expect(response).toEqual(
            SharedLib.formatError(
                'Either KENDRA_INDEX_ID Lambda Environment variable is not set or AWS_REGION and OS_COLLECTION_ENDPOINT is not set'
            )
        );
    });

    it('should pass successfully on opensearch query', async () => {
        const prototype = AossProxy.prototype;
        jest.spyOn(SharedLib, 'getUserIdFromEvent').mockImplementation((event) => {
            expect(event.headers.Authorization).toEqual('fake-token');
            return 'user';
        });
        const searchDocumentsSpy = jest.spyOn(prototype, 'searchDocuments').mockImplementation(async (params) => {
            return mockedOpenSearchResponse;
        });

        const event = {
            httpMethod: 'GET',
            resource: '/search/opensearch/{query}',
            pathParameters: { 'query': 'some-content' },
            headers: { Authorization: 'fake-token' }
        };

        const response = await lambda.handler(event);
        expect(response).toEqual(SharedLib.formatResponse(mockedOpenSearchResponse));
        expect(searchDocumentsSpy).toBeCalledTimes(1);
        expect(searchDocumentsSpy).toBeCalledWith('edu', 'some-content', { 'user_id': ['user'] });
    });

    it('should pass successfully on opensearch query  with attribute filters', async () => {
        const prototype = AossProxy.prototype;
        jest.spyOn(SharedLib, 'getUserIdFromEvent').mockImplementation((event) => {
            expect(event.headers.Authorization).toEqual('fake-token');
            return 'user';
        });
        const searchDocumentsSpy = jest.spyOn(prototype, 'searchDocuments').mockImplementation(async (params) => {
            return mockedOpenSearchResponse;
        });

        const event = {
            httpMethod: 'GET',
            resource: '/search/opensearch/{query}',
            pathParameters: { 'query': 'some-content' },
            multiValueQueryStringParameters: {
                'mock-doc-attribute-1': ['mock-value1', 'mock-value2'],
                'mock-doc-attribute-2': ['mock-value3']
            },
            headers: { Authorization: 'fake-token' }
        };

        const response = await lambda.handler(event);
        expect(response).toEqual(SharedLib.formatResponse(mockedOpenSearchResponse));
        expect(searchDocumentsSpy).toBeCalledTimes(1);
        expect(searchDocumentsSpy).toBeCalledWith('edu', 'some-content', {
            'mock-doc-attribute-1': ['mock-value1', 'mock-value2'],
            'mock-doc-attribute-2': ['mock-value3'],
            'user_id': ['user']
        });
    });

    afterEach(() => {
        AWSMock.restore('Kendra');
        jest.restoreAllMocks();
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.KENDRA_INDEX_ID;
        delete process.env.OS_COLLECTION_ENDPOINT;
    });
});
