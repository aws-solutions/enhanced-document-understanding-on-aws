// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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

        if(!SharedLib.validateUserToCaseAssociation(event.pathParameters.caseId, event.requestContext)) {
            throw new Error('User is not associated with the case');
        }

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
