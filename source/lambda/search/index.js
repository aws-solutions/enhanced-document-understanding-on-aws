// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const EnvSetup = require('./utils/env-setup');
const SharedLib = require('common-node-lib');
const { AossProxy } = require('common-node-lib');
const KendraSearch = require('./utils/search-kendra');

/**
 * This function searches for documents in Kendra index based on the query passed in the request.
 *
 * This function is called by API Gateway when the user hits the /search/kendra/{query}.
 * @param event {Object} API Gateway event object
 *
 * @throws Error if the request is invalid. 500 error response is returned if the function throws an error.
 *
 * @returns {Object} Kendra query response object
 *
 **/
exports.handler = async (event) => {

    if (event.httpMethod !== 'GET') {
        return SharedLib.formatError(new Error('Invalid request: Only HTTP GET requests are supported'));
    }

    if (event.resource === '/search/kendra/{query}') {
        try {
            EnvSetup.checkAllEnvSetup();

            if (
                event.pathParameters === undefined ||
                event.pathParameters.query === undefined ||
                event.pathParameters.query === ''
            ) {
                throw new Error('"query" is required to be passed as a path parameter');
            }

            const attributeFilters = event.multiValueQueryStringParameters;
            const query = decodeURIComponent(event.pathParameters.query);

            const kendraResponse = await KendraSearch.searchKendraIndex(
                query,
                attributeFilters,
                event.headers.Authorization
            );
            return SharedLib.formatResponse(kendraResponse);
        } catch (error) {
            console.error(`Error processing request for ${event.resource}. Error is: ${error.message}`);
            return SharedLib.formatError(error);
        }
    }

    if (event.resource === '/search/opensearch/{query}') {
        try {
            EnvSetup.checkAllEnvSetup();

            if (
                event.pathParameters === undefined ||
                event.pathParameters.query === undefined ||
                event.pathParameters.query === ''
            ) {
                throw new Error('"query" is required to be passed as a path parameter');
            }

            const attributeFilters = event.multiValueQueryStringParameters??{};
            const userId = SharedLib.getUserIdFromEvent(event);
            attributeFilters['user_id'] = [userId];

            const query = decodeURIComponent(event.pathParameters.query);

            const openSearchProxy = new AossProxy();
            const indexName = 'edu';

            const openSearchResponse = await openSearchProxy.searchDocuments(
                indexName,
                query,
                attributeFilters
            );
            return SharedLib.formatResponse(openSearchResponse);
        } catch (error) {
            console.error(`Error processing request for ${event.resource}. Error is: ${error.message}`);
            return SharedLib.formatError(error);
        }
    } else {
        return SharedLib.formatError(new Error('Invalid resource requested: Only /search/kendra/{query} or /search/kendra/{query} is supported'));
    }
};
