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
    let checkEnv = false;
    if (process.env.KENDRA_INDEX_ID) {
        KENDRA_INDEX_ID = process.env.KENDRA_INDEX_ID;
        checkEnv = true;
    }

    return checkEnv;
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
    let checkEnv = false;
    if (process.env.AWS_REGION && process.env.OS_COLLECTION_ENDPOINT) {
        REGION = process.env.AWS_REGION;
        ENDPOINT = process.env.OS_COLLECTION_ENDPOINT;
        checkEnv = true;
    }

    return checkEnv;
}

function checkAllEnvSetup() {
    const checkKendra = checkKendraIndexIdEnvSetup();
    const checkOpenSearch = checkOpenSearchEnvSetup();

    if (!(checkKendra || checkOpenSearch)) {
        throw new Error(
            'Either KENDRA_INDEX_ID Lambda Environment variable is not set or AWS_REGION and OS_COLLECTION_ENDPOINT is not set'
        );
    }
}

module.exports = {
    checkKendraIndexIdEnvSetup,
    checkOpenSearchEnvSetup,
    checkAllEnvSetup
};
