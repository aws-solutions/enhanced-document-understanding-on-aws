// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const SharedLib = require('common-node-lib');

let CASE_DDB_TABLE_NAME;
let S3_INFERENCE_BUCKET_NAME;

/**
 * Sets CASE_DDB_TABLE_NAME according to environment variable if it exists, otherwise throws
 */
function checkDdbEnvSetup() {
    if (process.env.CASE_DDB_TABLE_NAME) {
        CASE_DDB_TABLE_NAME = process.env.CASE_DDB_TABLE_NAME;
        console.debug(`CASE_DDB_TABLE_NAME is: ${CASE_DDB_TABLE_NAME}`);
    } else {
        throw new Error('CASE_DDB_TABLE_NAME Lambda Environment variable not set.');
    }
}

/**
 * Sets S3_INFERENCE_BUCKET_NAME according to environment variable if it exists, otherwise throws
 */
function checkS3InferenceBucketEnvSetup() {
    if (process.env.S3_INFERENCE_BUCKET_NAME) {
        S3_INFERENCE_BUCKET_NAME = process.env.S3_INFERENCE_BUCKET_NAME;
        console.debug(`S3_INFERENCE_BUCKET_NAME is: ${S3_INFERENCE_BUCKET_NAME}`);
    } else {
        throw new Error('S3_INFERENCE_BUCKET_NAME Lambda Environment variable not set.');
    }
}

/**
 * Ensures the environment is correctly configured for all operations
 */
function checkAllEnvSetup() {
    checkDdbEnvSetup();
    checkS3InferenceBucketEnvSetup();
}

/**
 * Lists all completed inferences for a given case and document by querying the case DDB table for the document.
 * Result is meant to be returned to the API caller and used to get the actual inference content.
 *
 * @param {string} caseId
 * @param {string} documentId
 * @returns {Array[string]} array of the available InferenceTypes (by name) for the specified case/document
 */
async function listInferences(caseId, documentId) {
    let inferencePairs = await SharedLib.getInferencePrefixes(caseId, documentId);
    return Object.keys(inferencePairs);
}

/**
 * Retrieves the inference of a given type for a document within a case. The inferences live in the bucket named
 * S3_INFERENCE_BUCKET_NAME as json files, under the prefix /<caseId>/<documentId>/<inferenceType>.json
 *
 * @param {string} caseId
 * @param {string} documentId
 * @param {string} inferenceType a single name of an inference as returned from `listInferences`
 * @param {string} requestAccountId S3 Bucket expected owner account id, used to validate s3 api requests
 * 
 * @returns {Object} the content of the inference JSON file parsed as an object
 */
async function getInference(caseId, documentId, inferenceType, requestAccountId) {
    return SharedLib.getInferenceFromS3(caseId, documentId, inferenceType, requestAccountId);
}

module.exports = { checkAllEnvSetup, checkDdbEnvSetup, checkS3InferenceBucketEnvSetup, listInferences, getInference };
