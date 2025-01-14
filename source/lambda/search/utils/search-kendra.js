// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
'use strict';

const AWS = require('aws-sdk');
const CustomConfig = require('aws-node-user-agent-config');
const SharedLib = require('common-node-lib');

/**
 * Search Kendra Index for the given query string
 * @param {string} query - The query text
 * @param {Object} multiValueQueryStringParameters - object mapping attribute filter keys to accepted values, as passed into the API via the query string
 * @param {string} authToken - cognito auth token to be passed to Kendra
 *
 * @throws {Error} - If Kendra Index Id is not defined
 *
 * @returns {AWS.Kendra.QueryResponse} - The Kendra query response object
 **/
const searchKendraIndex = async (query, multiValueQueryStringParameters, authToken) => {
    try {
        const awsCustomConfig = CustomConfig.customAwsConfig();
        const kendraClient = new AWS.Kendra(awsCustomConfig);

        const kendraIndexId = process.env.KENDRA_INDEX_ID;

        if (!kendraIndexId) {
            throw new Error('Kendra Index Id is not defined');
        }

        console.debug(
            `query: ${query}, \n multiValueQueryStringParameters:${JSON.stringify(multiValueQueryStringParameters)}`
        );

        const kendraQueryParams = {
            QueryText: query,
            IndexId: kendraIndexId,
            UserContext: {
                Token: authToken
            },
            // we always want facet data for doc and file types
            Facets: [
                {
                    'DocumentAttributeKey': SharedLib.WorkflowOrchestratorDefaults.KENDRA_ATTRIBUTES.DOC_TYPE
                },
                {
                    'DocumentAttributeKey': SharedLib.WorkflowOrchestratorDefaults.KENDRA_ATTRIBUTES.FILE_TYPE
                }
            ]
        };
        const attributeFilters = createAttributeFilters(multiValueQueryStringParameters);
        if (attributeFilters) {
            kendraQueryParams.AttributeFilter = attributeFilters;
        }
        console.debug('kendraQueryParams: ', JSON.stringify(kendraQueryParams));

        const searchResults = await kendraClient.query(kendraQueryParams).promise();

        console.debug('searchResults: ', JSON.stringify(searchResults));

        return searchResults;
    } catch (err) {
        console.error('Error: ', err.message);
        throw err;
    }
};

/**
 * Creates an attribute filter to be passed to the kendra query
 *
 * @param {Object} multiValueQueryStringParameters
 * @returns {Object} - formatted attribute filter if multiValueQueryStringParameters is not null or undefined else null
 */
const createAttributeFilters = (multiValueQueryStringParameters) => {
    if (!multiValueQueryStringParameters || Object.keys(multiValueQueryStringParameters).length === 0) {
        return null;
    }

    // each attribute is an AND with eachother (e.g. if we provide a file_type and case_id filter, we only want the
    // docs from the cases selected and of the suitable type)
    const attributeFilter = {
        AndAllFilters: []
    };

    // within an attribute, the provided values are ORed together (e.g. if we provide file_type = ['.jpg', '.pdf'],
    // then we want to display all jpg AND pdf files)
    for (const attributeKey in multiValueQueryStringParameters) {
        let sameAttributeFilter = { OrAllFilters: [] };
        for (const value of multiValueQueryStringParameters[attributeKey]) {
            sameAttributeFilter.OrAllFilters.push({
                'EqualsTo': { 'Key': attributeKey, 'Value': { 'StringValue': value } }
            });
        }
        attributeFilter.AndAllFilters.push(sameAttributeFilter);
    }
    return attributeFilter;
};

module.exports = { searchKendraIndex, createAttributeFilters };
