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
const KendraSearch = require('../../utils/search-kendra');
const SharedLib = require('common-node-lib');

// create a jest test suite for searchKendraIndex from KendraSearch
describe('When searching the kendra index', () => {
    beforeEach(() => {
        process.env.KENDRA_INDEX_ID = 'test-index';
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
    });

    it('should successfully return a query response', async () => {
        const mockKendraQueryResponse = {
            QueryId: 'mock-query-id',
            ResultItems: [
                {
                    Id: '1',
                    MockResponse: 'test-response'
                }
            ]
        };

        AWSMock.mock('Kendra', 'query', async (params) => {
            expect(params.QueryText).toEqual('mock-query-text');
            expect(params.IndexId).toEqual('test-index');
            expect(params.UserContext.Token).toEqual('mock-auth-token');
            expect(params.Facets).toEqual([
                {
                    'DocumentAttributeKey': SharedLib.WorkflowOrchestratorDefaults.KENDRA_ATTRIBUTES.DOC_TYPE
                },
                {
                    'DocumentAttributeKey': SharedLib.WorkflowOrchestratorDefaults.KENDRA_ATTRIBUTES.FILE_TYPE
                }
            ]);
            expect(params.AttributeFilter).toBeUndefined();

            return mockKendraQueryResponse;
        });

        const result = await KendraSearch.searchKendraIndex('mock-query-text', undefined, 'mock-auth-token');
        expect(result).toEqual(mockKendraQueryResponse);
    });

    it('should successfully return a query response with attribute filters', async () => {
        const mockKendraQueryResponse = {
            QueryId: 'mock-query-id',
            ResultItems: [
                {
                    Id: '1',
                    MockResponse: 'test-response'
                }
            ]
        };

        AWSMock.mock('Kendra', 'query', async (params) => {
            expect(params.QueryText).toEqual('mock-query-text');
            expect(params.IndexId).toEqual('test-index');
            expect(params.Facets).toEqual([
                {
                    'DocumentAttributeKey': SharedLib.WorkflowOrchestratorDefaults.KENDRA_ATTRIBUTES.DOC_TYPE
                },
                {
                    'DocumentAttributeKey': SharedLib.WorkflowOrchestratorDefaults.KENDRA_ATTRIBUTES.FILE_TYPE
                }
            ]);
            expect(params.UserContext.Token).toEqual('mock-auth-token');
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

            return mockKendraQueryResponse;
        });

        const result = await KendraSearch.searchKendraIndex(
            'mock-query-text',
            {
                'mock-doc-attribute-1': ['mock-value1', 'mock-value2'],
                'mock-doc-attribute-2': ['mock-value3']
            },
            'mock-auth-token'
        );
        expect(result).toEqual(mockKendraQueryResponse);
    });

    it('should throw an error if searchKendraIndex function fails', async () => {
        const mockQueryText = 'mock-query-text';
        AWSMock.restore('Kendra');
        // eslint-disable-next-line no-unused-vars
        AWSMock.mock('Kendra', 'query', async (params) => {
            throw new Error('mock error');
        });

        try {
            await KendraSearch.searchKendraIndex(mockQueryText);
        } catch (err) {
            expect(err.message).toEqual('mock error');
        }
    });

    it('should throw an error if the searchKendraIndex params is missing the authToken', async () => {
        AWSMock.restore('Kendra');
        AWSMock.mock('Kendra', 'query', async (params) => {
            if (!params.UserContext.Token) {
                throw new Error('Auth Token is not defined');
            }
        });

        const mockQueryParams = {
            query: 'mock-query-text'
        };
        try {
            await KendraSearch.searchKendraIndex('mock-query-text', undefined, undefined);
        } catch (err) {
            expect(err.message).toEqual('Auth Token is not defined');
        }
    });

    it('should throw an error if kendra index id env variable is undefined', async () => {
        delete process.env.KENDRA_INDEX_ID;

        try {
            await KendraSearch.searchKendraIndex('mock-query-text');
        } catch (err) {
            expect(err.message).toEqual('Kendra Index Id is not defined');
        }
    });

    // crete unit test for the createFacetList function
    it('should successfully create an attribute filter', async () => {
        const mockDocAttributes = {
            'mock-doc-attribute-1': ['mock-value1', 'mock-value2'],
            'mock-doc-attribute-2': ['mock-value3']
        };
        const result = KendraSearch.createAttributeFilters(mockDocAttributes);
        expect(result).toEqual({
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
    });

    it('should successfully create a null attribute filter from empty object', async () => {
        const mockDocAttributes = {};
        const result = KendraSearch.createAttributeFilters(mockDocAttributes);
        expect(result).toEqual(null);
    });

    it('should successfully create a null attribute filter from undefined', async () => {
        const result = KendraSearch.createAttributeFilters(undefined);
        expect(result).toEqual(null);
    });

    // create afterAll to delete kendra index id env variable
    afterEach(() => {
        AWSMock.restore('Kendra');
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.KENDRA_INDEX_ID;
    });
});
