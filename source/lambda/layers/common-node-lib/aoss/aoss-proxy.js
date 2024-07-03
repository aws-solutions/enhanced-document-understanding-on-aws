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

const { Client } = require('@opensearch-project/opensearch');
const { AwsSigv4Signer } = require('@opensearch-project/opensearch/aws');
const { defaultProvider } = require('@aws-sdk/credential-provider-node');

/**
 * This class provides the OpenSearch proxy that performs managing indicies and reading and writing documents.
 */
class AossProxy {

    constructor(client){
        this.checkOpenSearchEnvSetup();

        if (client === undefined) {
            this.client = new Client({
                ...AwsSigv4Signer({
                    region: this.region,
                    service: 'aoss',
                    getCredentials: () => {
                        const credentialsProvider = defaultProvider();
                        return credentialsProvider();
                    },
                }),
                node: this.endpoint // serverless collection endpoint
            });
        } else {
            this.client = client;
        }
    }

    /**
     * Check the Lambda environment variables for OpenSearch - search documents. It sets:
     *
     * `AWS_REGION`: This value sets the region of the where OpenSearch client will be calling to.
     * If not set, it will throw an error.
     *
     * `OS_COLLECTION_ENDPOINT`: This value sets the endpoint of the OpenSearch serverless cluster.
     * If not set, it will throw an error.
     */
    checkOpenSearchEnvSetup() {
        if (process.env.AWS_REGION) {
            this.region = process.env.AWS_REGION;
            console.debug(`AWS_REGION is: ${this.region}`);
        } else {
            throw new Error('AWS_REGION Lambda Environment variable not set.');
        }

        if (process.env.OS_COLLECTION_ENDPOINT) {
            this.endpoint = process.env.OS_COLLECTION_ENDPOINT;
            console.debug(`OS_COLLECTION_ENDPOINT is: ${this.endpoint}`);
        } else {
            throw new Error('OS_COLLECTION_ENDPOINT Lambda Environment variable not set.');
        }
    }

    /**
     * Create an index in OpenSearch serverless collection.
     *
     * @param {string} indexName name of the index to be created
     *
     * @returns {Object} OpenSearch create index response
     */
    async createIndex(indexName) {

        try {
            const indexExist = (await this.client.indices.exists({ index: indexName })).body;
            if (!indexExist) {
                console.debug(`${indexName} does not exist, creating one`);
            } else {
                return;
            }
        } catch (error) {
            console.error(`Error checking if index exists: ${indexName} \n`, error);
            throw error;
        }

        try {
            return (await this.client.indices.create({ index: indexName })).body;
        } catch (error) {
            console.error(`Error creating index: ${indexName} \n`, error);
            throw error;
        }
    }

    /**
     * Search a keyword within an index.
     *
     * @param {string} indexName name of the index to be created
     * @param {string} keyword body of the search keyword
     * @param {Object} filters filters on case id, file type and doc type
     *
     * @returns {Object} OpenSearch search result
     */
    async searchDocuments(indexName, keyword, filters) {
        const searchBody = {
            'query': {
                'bool': {
                    'must': [
                        {
                            'query_string': {
                                'query': keyword
                            }
                        }
                    ]
                }
            },
            'highlight' : {
                'fields' : {
                    'content' : { 'pre_tags' : [''], 'post_tags' : [''] },
                },
                'require_field_match': false
            }
        };

        if (filters !== undefined) {
            for (const filterName in filters) {
                const filterValues = filters[filterName];
                const filtersClause = this.buildFiltersClause(filterName, filterValues);
                searchBody.query.bool.must.push(filtersClause);
            }
        }

        console.debug(`OpenSearch search query request: ${JSON.stringify(searchBody)}`);
        try {
            const response = await this.client.search({
                index: indexName,
                body: searchBody,
                _source: true,
                filter_path: ['hits.hits._id', 'hits.hits._source','hits.hits.highlight']
            });
            return this.transformSearchResponse(response);
        } catch (error) {
            console.error(`Error searching keyword: ${keyword} in index: ${indexName} \n`, error);
            throw error;
        }
    }

    /**
     * Write a document to an index.
     *
     * @param {Object} casePayload metadata of the case
     * @param {Object} documentPayload metadata of the document
     * @param {string} indexName name of the index to be created
     * @param {string} textTractInference textTract inferences to be indexed
     * @param {Object} comprehendInference optional - comprehend inferences to be indexed
     *
     * @returns {Object} OpenSearch write document response
     */
    async writeDocuments(casePayload, documentPayload, indexName, textTractInference, comprehendInference) {
        const documentId = documentPayload.id;
        const document = this.transformInferences(casePayload, documentPayload, textTractInference, comprehendInference);

        try {
            return await this.client.index({
                index: indexName,
                id: documentId,
                body: document
            });
        } catch (error) {
            console.error(`Error writing document: ${documentId} to index: ${indexName} \n`, error);
            throw error;
        }
    }

    /**
     * Build should Clause that will be used insides of a must clause which is responsible for filtering documents on
     * case id, file type, doc type, etc.
     *
     * @param {string} filterName field name that filter should look at
     * @param {Array.<string>} filterValues values that filter should compare with
     *
     * @returns {Object} built filter clause
     */
    buildFiltersClause(filterName, filterValues) {
        const filtersClause = {
            'bool': {
                'should': []
            }
        };

        for (const filterValue of filterValues) {
            const term = {
                'term': {
                    [`${filterName}.keyword`]: filterValue
                }
            };

            filtersClause.bool.should.push(term);
        }

        return filtersClause;
    }

    /**
     * Transform inferences to a document to be indexed.
     *
     * @param {Object} casePayload metadata of the case
     * @param {Object} documentPayload metadata of the document
     * @param {string} textTractInference textTract inferences to be indexed
     * @param {Object} comprehendInference optional - comprehend inferences to be indexed
     *
     * @returns {Object} transformed documents to be indexed.
     */
    transformInferences(casePayload, documentPayload, textTractInference, comprehendInference) {
        const caseId = casePayload.id;
        const userId = casePayload.id.split(':')[0]
        const document = {
            'case_id': caseId,
            'user_id': userId,
            'document_id': documentPayload.id,
            'doc_type': documentPayload.selfCertifiedDocType,
            'file_name': documentPayload.uploadedFileName,
            'file_type': documentPayload.uploadedFileExtension,
            'content': textTractInference
        };

        if (comprehendInference !== undefined) {
            Object.keys(comprehendInference).forEach((key) => {
                document[key] = comprehendInference[key];
            });
        }

        return document;
    }

    /**
     * Transform an open search query response.
     *
     * @param {Object} response raw open search query response
     *
     * @returns {Object} transformed open search query response
     */
    transformSearchResponse(response) {
        // sub-nested hits
        console.debug(`Transforming open search response: ${JSON.stringify(response)}`);
        const hits = response.body.hits;
        const results = [];

        if (hits !== undefined) {
            const innerHits = hits.hits;
            for (const hit of innerHits) {
                const source = hit._source;
                let lines;
                if (hit.hasOwnProperty('highlight')) {
                    lines = hit.highlight.content;
                } else {
                    lines = source.content;
                }
                const result = {
                    'case_id': source.case_id,
                    'user_id': source.user_id,
                    'document_id': source.document_id,
                    'doc_type': source.doc_type,
                    'file_name': source.file_name,
                    'file_type': source.file_type,
                    'lines': lines
                };
                results.push(result);
            }
        }

        const analytics = this.prepareAnalytics(results);
        return {
            analytics: analytics,
            results: results
        };
    }

    /**
     * Analyze the transformed result and count document based on types
     *
     * @param {Object} results counts of file type and document type
     *
     * @returns {Object} Analytics results.
     */
    prepareAnalytics(results) {
        let fileTypeFilterMap = {};
        let docTypeFilterMap = {};
        results.forEach((result) => {
            fileTypeFilterMap[result.file_type] = (fileTypeFilterMap[result.file_type] || 0) + 1;
            docTypeFilterMap[result.doc_type] = (docTypeFilterMap[result.doc_type] || 0) + 1;
        });

        const fileTypeFilterArray = Object.keys(fileTypeFilterMap).map((key) => {
            return {
                type: key,
                count: fileTypeFilterMap[key]
            }
        });
        const docTypeFilterArray = Object.keys(docTypeFilterMap).map((key) => {
            return {
                type: key,
                count: docTypeFilterMap[key]
            }
        });


        return [
            {
                type: 'file_type',
                filter: fileTypeFilterArray
            },
            {
                type: 'doc_type',
                filter: docTypeFilterArray
            }
        ];
    }
}

module.exports = { AossProxy };
