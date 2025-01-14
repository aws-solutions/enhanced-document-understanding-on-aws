// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
'use strict';

const SharedLib = require('common-node-lib');
const { getDocumentUrl } = require('./utils/generate-signed-url');
const { checkAllEnvSetup } = require('./utils/env-setup');

exports.handler = async (event, context) => {
    try {
        checkAllEnvSetup();

        const requestAccountId = SharedLib.getAccountIdFromLambdaContext(context);
        const userId = SharedLib.getUserIdFromEvent(event);

        const s3Key = event.queryStringParameters.key;
        const presignedUrl = await getDocumentUrl({
            key: s3Key,
            userId: userId,
            expectedBucketOwner: requestAccountId
        });

        return SharedLib.formatResponse({ downloadUrl: presignedUrl });
    } catch (error) {
        console.error(`Error generating presigned url. Event is: ${JSON.stringify(event)}`);
        return SharedLib.formatError(error);
    }
};
