// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const { Client, errors } = require ('@elastic/elasticsearch');
const Mock = require ('@elastic/elasticsearch-mock');
const { AossProxy } = require('../../aoss/aoss-proxy')
const { openSearchQueryRequest, openSearchQueryResponse, openSearchLambdaResponse } = require('../event-test-data');

describe('OpenSearch Serverless proxt test', () => {
    let mock = new Mock();
    let client;
    const casePayload = {
        'id': 'foo-bar'
    };
    const documentPayload = {
        'id': 'document-id',
        'selfCertifiedDocType': 'generic',
        'file_name': 'example',
        'file_type': '.jpg'
    };

    beforeEach(() => {
        process.env.AWS_REGION = 'us-west-2';
        process.env.OS_COLLECTION_ENDPOINT = 'https://foobar.us-east-1.aoss.amazonaws.com';
        client = new Client({
            node: process.env.OS_COLLECTION_ENDPOINT,
            Connection: mock.getConnection()
        })
    });

    afterEach(() => {
        mock.clearAll();
    });

    describe('OpenSearch Serverless constructor: environment variables not set', () => {
        it('throws an error due to AWS_REGION env variable not being set', async () => {
            delete process.env.AWS_REGION;
            expect(() => new AossProxy())
                .toThrow(new Error('AWS_REGION Lambda Environment variable not set.'));
        });

        it('throws an error due to OS_COLLECTION_ENDPOINT env variable not being set', async () => {
            delete process.env.OS_COLLECTION_ENDPOINT;
            expect(() => new AossProxy())
                .toThrow(new Error('OS_COLLECTION_ENDPOINT Lambda Environment variable not set.'));
        });
    });

    describe('OpenSearch Serverless create index: when creates index with correct params', () => {
        it('able to create index', async () => {
            mock.add({
                method: 'HEAD',
                path: '/sample-index'
            }, () => {
                return { statusCode: 200, body: false };
            });
            mock.add({
                method: 'PUT',
                path: '/sample-index'
            }, () => {
                return { statusCode: 200, body: 'success' };
            });
            const proxy = new AossProxy(client);
            const response = await proxy.createIndex('sample-index', client);

            expect(response).toBe('success');
        });
    });

    describe('OpenSearch Serverless create index: when creates index with incorrect params', () => {
        it('throws check index has failure', async () => {
            mock.add({
                method: 'HEAD',
                path: '/sample-index'
            }, () => {
                return new errors.ResponseError({
                    body: { errors: {}, status: 500 },
                    statusCode: 500
                })
            });
            const proxy = new AossProxy(client);

            await expect(proxy.createIndex('sample-index')).rejects.toThrow('');
        });

        it('throws create index has failure', async () => {
            mock.add({
                method: 'HEAD',
                path: '/sample-index'
            }, () => {
                return {
                    body: false
                }
            });
            mock.add({
                method: 'PUT',
                path: '/sample-index'
            }, () => {
                return new errors.ResponseError({
                    body: { errors: {}, status: 500 },
                    statusCode: 500
                })
            });
            const proxy = new AossProxy(client);

            await expect(proxy.createIndex('sample-index')).rejects.toThrow('');
        });
    });

    describe('OpenSearch Serverless search document: when search a keyword in a specific index with correct params', () => {
        it('able to search document', async () => {
            const keyWord = 'some-keyword';
            mock.add({
                method: 'POST',
                path: '/sample-index/_search'
            }, () => {
                return openSearchQueryResponse
            });

            const proxy = new AossProxy(client);
            const response = await proxy.searchDocuments('sample-index', keyWord);

            expect(response).toStrictEqual(openSearchLambdaResponse);
        });
    });

    describe('OpenSearch Serverless search document: when search a keyword in a specific index with correct params and filters', () => {
        it('able to search document', async () => {
            const keyWord = 'some-keyword';
            const filters = {
                case_id: ['id-1', 'id-2'],
                file_type: ['.jpg'],
                doc_type: ['generic']
            }
            const mockSearch = jest.fn(() => {
                return openSearchQueryResponse;
            });
            mock.add({
                method: 'POST',
                path: '/sample-index/_search'
            }, mockSearch);

            const proxy = new AossProxy(client);
            await proxy.searchDocuments('sample-index', keyWord, filters);

            expect(mockSearch).toHaveBeenCalledWith(
                openSearchQueryRequest
            );
        });
    });

    describe('OpenSearch Serverless search document: when search a keyword with incorrect params', () => {
        it('throws search document has failure', async () => {
            const keyWord = 'some-keyword';
            mock.add({
                method: 'POST',
                path: '/sample-index/_search'
            }, () => {
                return new errors.ResponseError({
                    body: { errors: {}, status: 500 },
                    statusCode: 500
                })
            });
            const proxy = new AossProxy(client);

            await expect(proxy.searchDocuments('sample-index', keyWord)).rejects.toThrow('');
        });
    });

    describe('OpenSearch Serverless write document: when write a document in a specific index with correct params', () => {
        it('able to write document', async () => {
            const inference = { foo: 'bar' };
            const text = JSON.stringify(inference);
            mock.add({
                method: 'PUT',
                path: '/sample-index/_doc/document-id'
            }, () => {
                return 'some-response'
            })

            const proxy = new AossProxy(client);
            const response = await proxy.writeDocuments(casePayload, documentPayload, 'sample-index', text, inference);

            expect(response).toBe('some-response');
        });
    });

    describe('OpenSearch Serverless write document: when write a document in a specific index with incorrect params', () => {
        it('throws write a document has failure', async () => {
            const inference = { foo: 'bar' };
            const text = JSON.stringify(inference);
            mock.add({
                method: 'PUT',
                path: '/sample-index/_doc/document-id'
            }, () => {
                return new errors.ResponseError({
                    body: { errors: {}, status: 500 },
                    statusCode: 500
                })
            });

            const proxy = new AossProxy(client);

            await expect(
                proxy.writeDocuments(casePayload, documentPayload, 'sample-index', text, inference)
            ).rejects.toThrow('');
        });
    });
});
