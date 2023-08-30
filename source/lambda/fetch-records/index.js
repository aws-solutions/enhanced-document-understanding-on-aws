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

const SharedLib = require('common-node-lib');
const { checkAllEnvSetup } = require('./utils/env-setup');
const CaseFetcher = require('./utils/fetch-case');
const DocFetcher = require('./utils/fetch-document');

/**
 * Serves the following endpoints:
 * - /GET/cases
 * - /GET/case/{caseid}
 * - /GET/document/{caseId}/{documentId}
 * - /GET/document/{caseId}/{documentId}?redacted=false
 * - /GET/document/{caseId}/{documentId}?redacted=true
 *
 * Note: the above endpoint optionally accepts queryStringParameters: redacted=true/false
 * By default the endpoint returns details for a redacted document. To fetch the unredacted
 * document, the queryStringParameters must be passed as redacted=false.
 *
 *
 * It also validates if all required environment variables are declared.
 * @param {Object} event Event received by lambda
 * @returns
 */
exports.handler = async (event) => {
    try {
        checkAllEnvSetup();
    } catch (error) {
        return SharedLib.formatError(error);
    }

    if (event.httpMethod !== 'GET') {
        return SharedLib.formatError(new Error('Invalid request: Only HTTP GET requests are supported'));
    }

    try {
        if (event.resource === '/cases') {
            const userId = SharedLib.getUserIdFromEvent(event);
            const response = await CaseFetcher.listCases(userId);
            return SharedLib.formatResponse(response);
        } else if (event.resource === '/case/{caseId}') {
            const response = await CaseFetcher.getCase({
                caseId: event.pathParameters.caseId
            });
            return SharedLib.formatResponse(response);
        } else if (event.resource === '/document/{caseId}/{documentId}') {
            const getDocPrefixParams = {
                caseId: event.pathParameters.caseId,
                documentId: event.pathParameters.documentId,
                authToken: event.headers.Authorization
            };

            if (!event.queryStringParameters) {
                getDocPrefixParams.redacted = true;
            } else if (event.queryStringParameters.redacted === 'true') {
                getDocPrefixParams.redacted = true;
            } else if (event.queryStringParameters.redacted === 'false') {
                getDocPrefixParams.redacted = false;
            }

            // prettier-ignore
            const response = await DocFetcher.getDocumentPrefix(getDocPrefixParams); // NOSONAR - underlying calls are async
            return SharedLib.formatResponse(response);
        }
    } catch (error) {
        console.error(`Error processing request for ${event.resource}. Error is: ${error.message}`);
        return SharedLib.formatError(error);
    }
};
