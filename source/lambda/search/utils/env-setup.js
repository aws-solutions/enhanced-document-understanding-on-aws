// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
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
