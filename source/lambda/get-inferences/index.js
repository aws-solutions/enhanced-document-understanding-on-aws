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

const SharedLib = require('common-node-lib');
const InferenceGetter = require('./utils/get-inferences');

exports.handler = async (event, context) => {
    try {
        InferenceGetter.checkAllEnvSetup();
    } catch (error) {
        return SharedLib.formatError(error);
    }

    if (event.httpMethod !== 'GET') {
        return SharedLib.formatError(new Error('Invalid request: Only HTTP GET requests are supported'));
    }

    try {

        const requestAccountId = SharedLib.getAccountIdFromLambdaContext(context);

        if (event.resource === '/inferences/{caseId}/{documentId}') {
            const response = await InferenceGetter.listInferences(
                event.pathParameters.caseId,
                event.pathParameters.documentId
            );
            return SharedLib.formatResponse(response);
        } else if (event.resource === '/inferences/{caseId}/{documentId}/{inferenceType}') {
            // prettier-ignore
            const response = await InferenceGetter.getInference( // NOSONAR - await does nothing in deployment, needed for unit tests
                event.pathParameters.caseId,
                event.pathParameters.documentId,
                event.pathParameters.inferenceType,
                requestAccountId
            );
            return SharedLib.formatResponse(response);
        }
    } catch (error) {
        console.error(`Error processing request for ${event.resource}. Error is: ${error.message}`);
        return SharedLib.formatError(error);
    }
};
