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

const AWS = require('aws-sdk');
const UserAgentConfig = require('aws-node-user-agent-config');

let S3_INFERENCE_BUCKET_NAME;

class InferenceInfo {
    constructor(caseId, documentId, inferenceType, uploadKey) {
        this.caseId = caseId;
        this.documentId = documentId;
        this.inferenceType = inferenceType;
        this.s3Key = uploadKey;
    }
}

function checkInferenceBucketS3EnvSetup() {
    if (process.env.S3_INFERENCE_BUCKET_NAME) {
        S3_INFERENCE_BUCKET_NAME = process.env.S3_INFERENCE_BUCKET_NAME;
        console.debug(`S3_INFERENCE_BUCKET_NAME is: ${S3_INFERENCE_BUCKET_NAME}`);
    } else {
        throw new Error('S3_INFERENCE_BUCKET_NAME Lambda Environment variable not set.');
    }
}

/**
 * Uploads all specified inferences for a whole case (all documents)
 *
 * @param {*} eventDetail The event payload containing inferences to be uploaded
 * @param {string=} requestAccountId S3 Bucket expected owner account id
 * @param {Array[string]} inferencesToUpload If not provided, will upload all inferences. Otherwise only uploads inferences with key specified
 * @returns {Array[Object]} An array with details about all successful inference uploads
 */
async function uploadCaseInferences(eventDetail, inferencesToUpload = [], requestAccountId = undefined) {
    const s3Client = new AWS.S3(UserAgentConfig.customAwsConfig());

    if (!S3_INFERENCE_BUCKET_NAME) {
        checkInferenceBucketS3EnvSetup();
    }

    let uploadedInferences = [];

    for (const documentDetail of eventDetail.case.documentList) {
        const docInferences = await uploadDocumentInferences(
            documentDetail,
            requestAccountId,
            inferencesToUpload,
            s3Client
        );
        uploadedInferences.push(...docInferences);
    }
    return uploadedInferences;
}

/**
 * Uploads all specified inferences for a given document
 *
 * @param {Object} documentDetail A single object in the base events documentList
 * @param {string=} requestAccountId S3 Bucket expected owner account id
 * @param {Array[string]} inferencesToUpload If not provided, will upload all inferences. Otherwise only uploads inferences with key specified
 * @param {AWS.S3=} s3Client the s3 client to use. If not provided, instantiates a new one.
 * @returns {Array[InferenceInfo]} info about the uploaded inference
 */
async function uploadDocumentInferences(
    documentDetail,
    requestAccountId = undefined,
    inferencesToUpload = [],
    s3Client = undefined
) {
    const _s3Client = s3Client ?? new AWS.S3(UserAgentConfig.customAwsConfig());

    if (!S3_INFERENCE_BUCKET_NAME) {
        checkInferenceBucketS3EnvSetup();
    }

    const uploadAllInferences = inferencesToUpload.length == 0;
    let uploadedInferences = [];

    for (const [inferenceType, inferenceResult] of Object.entries(documentDetail.inferences)) {
        // only upload selected inferences
        const documentId = documentDetail.document.id;
        const caseId = documentDetail.document.caseId;
        if (uploadAllInferences || inferencesToUpload.includes(inferenceType)) {
            // prettier-ignore
            const uploadResult = await uploadInference( // NOSONAR - await does nothing in deployment, needed for unit tests
                caseId,
                documentId,
                inferenceType,
                inferenceResult,
                _s3Client,
                requestAccountId
            );
            uploadedInferences.push(uploadResult);
        }
    }
    return uploadedInferences;
}

/**
 * Uploads a single inference to s3 with key determined by input
 *
 * @param {string} caseId
 * @param {string} documentId
 * @param {string} inferenceType
 * @param {Object} inferenceResult
 * @param {AWS.S3=} s3Client the s3 client to use. If not provided, instantiates a new one.
 * @param {string=} requestAccountId S3 Bucket expected owner account id
 * @returns {InferenceInfo} info about the uploaded inference
 */
async function uploadInference(
    caseId,
    documentId,
    inferenceType,
    inferenceResult,
    s3Client = undefined,
    requestAccountId = undefined
) {
    const _s3Client = s3Client ?? new AWS.S3(UserAgentConfig.customAwsConfig());

    if (!S3_INFERENCE_BUCKET_NAME) {
        checkInferenceBucketS3EnvSetup();
    }

    let uploadKey = `${caseId}/${documentId}/${inferenceType}.json`;
    let uploadBody = JSON.stringify(inferenceResult);
    try {
        const s3Params = {
            Bucket: S3_INFERENCE_BUCKET_NAME,
            Key: uploadKey,
            Body: uploadBody,
            ContentType: 'application/json; charset=utf-8'
        };
        if (requestAccountId) {
            s3Params.ExpectedBucketOwner = requestAccountId;
        }
        await _s3Client.putObject(s3Params).promise();

        return new InferenceInfo(caseId, documentId, inferenceType, uploadKey);
    } catch (error) {
        console.error(`Error uploading object: ${uploadKey}. Error is: ${error.message}`);
        throw error;
    }
}

/**
 * Retrieves a single inference for a case/document as specified, returning the inference as an object.
 *
 * @param {string} caseId
 * @param {string} documentId
 * @param {string} inferenceType will be the same as the filename of the inference *
 * @param {string} requestAccountId S3 Bucket expected owner account id
 * @param {Optional[AWS.S3]} s3Client the s3 client to use. If not provided, instantiates a new one.
 * @returns {Object} the inference as an object as parsed from the JSON
 */
async function getInferenceFromS3(caseId, documentId, inferenceType, requestAccountId, s3Client = undefined) {
    const _s3Client = s3Client ?? new AWS.S3(UserAgentConfig.customAwsConfig());

    if (!S3_INFERENCE_BUCKET_NAME) {
        checkInferenceBucketS3EnvSetup();
    }

    const inferenceFileKey = `${caseId}/${documentId}/${inferenceType}.json`;
    try {
        let response = await _s3Client
            .getObject({
                Bucket: S3_INFERENCE_BUCKET_NAME,
                Key: inferenceFileKey,
                ExpectedBucketOwner: requestAccountId
            })
            .promise();
        return JSON.parse(response.Body.toString('utf-8'));
    } catch (error) {
        console.error(`Error retrieving object: ${inferenceFileKey}. Error is: ${error.message}`);
        throw new Error('Error retrieving references for the specified caseId and documentId.');
    }
}

module.exports = {
    uploadCaseInferences,
    uploadDocumentInferences,
    uploadInference,
    getInferenceFromS3,
    InferenceInfo,
    checkInferenceBucketS3EnvSetup,
    S3_INFERENCE_BUCKET_NAME
};
