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
