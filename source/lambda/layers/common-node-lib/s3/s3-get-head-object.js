// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const AWS = require('aws-sdk');
const UserAgentConfig = require('aws-node-user-agent-config');

let DOCUMENT_BUCKET_NAME;

/**
 * Check the Lambda environment variables for S3. It sets:
 *
 * `DOCUMENT_BUCKET_NAME`: This value sets the name of the S3 bucket that stores the documents while Comprehend
 * processes them.
 * If not set, it will throw an error.
 *
 */
function checkS3EnvSetup() {
    if (process.env.DOCUMENT_BUCKET_NAME) {
        DOCUMENT_BUCKET_NAME = process.env.DOCUMENT_BUCKET_NAME;
    } else {
        throw new Error('DOCUMENT_BUCKET_NAME Lambda Environment variable not set.');
    }
}


async function getHeadObjectFromS3(params) {
    const s3Client = new AWS.S3(UserAgentConfig.customAwsConfig());
    checkS3EnvSetup();

    const s3Params = {
        Bucket: params.Bucket ?? DOCUMENT_BUCKET_NAME,
        Key: params.Key,
        ...params.otherParams
    }
    try {
        
        return await s3Client.headObject(s3Params).promise();
    } catch (error) {
        console.error(`Error retrieving object with params: ${JSON.stringify(s3Params)}`);
        throw error;
    } 
}


module.exports = {
    getHeadObjectFromS3
}