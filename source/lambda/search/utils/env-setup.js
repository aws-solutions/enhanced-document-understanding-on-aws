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

let KENDRA_INDEX_ID;
let REGION;
let ENDPOINT;

function checkKendraIndexIdEnvSetup() {
    if (process.env.KENDRA_INDEX_ID) {
        KENDRA_INDEX_ID = process.env.KENDRA_INDEX_ID;
    } else {
        throw new Error(
            'KENDRA_INDEX_ID Lambda Environment variable not set. Ensure you have set the DeployKendraIndex parameter to "Yes" when deploying the CloudFormation template'
        );
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
function checkOpenSearchEnvSetup() {
    if (process.env.AWS_REGION) {
        REGION = process.env.AWS_REGION;
    } else {
        throw new Error('AWS_REGION Lambda Environment variable not set.');
    }

    if (process.env.OS_COLLECTION_ENDPOINT) {
        ENDPOINT = process.env.OS_COLLECTION_ENDPOINT;
    } else {
        throw new Error('OS_COLLECTION_ENDPOINT Lambda Environment variable not set. Ensure you have set the DeployOpenSearch parameter to "Yes" when deploying the CloudFormation template');
    }
}

function checkAllEnvSetup() {
    checkKendraIndexIdEnvSetup();
    checkOpenSearchEnvSetup();
}

module.exports = {
    checkKendraIndexIdEnvSetup,
    checkOpenSearchEnvSetup,
    checkAllEnvSetup
};
