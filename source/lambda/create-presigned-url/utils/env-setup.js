// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

let UPLOAD_DOCS_BUCKET_NAME;
let S3_UPLOAD_PREFIX;

function checkS3BucketNameEnvSetup() {
    if (process.env.UPLOAD_DOCS_BUCKET_NAME) {
        UPLOAD_DOCS_BUCKET_NAME = process.env.UPLOAD_DOCS_BUCKET_NAME;
        console.debug(`UPLOAD_DOCS_BUCKET_NAME is: ${UPLOAD_DOCS_BUCKET_NAME}`);
    } else {
        throw new Error('UPLOAD_DOCS_BUCKET_NAME Lambda Environment variable not set.');
    }
}

function checkS3KeyPrefixEnvSetup() {
    if (process.env.S3_UPLOAD_PREFIX) {
        S3_UPLOAD_PREFIX = process.env.S3_UPLOAD_PREFIX;
        console.debug(`S3_UPLOAD_PREFIX is: ${S3_UPLOAD_PREFIX}`);
    } else {
        throw new Error('S3_UPLOAD_PREFIX Lambda Environment variable not set.');
    }
}

function checkAllEnvSetup() {
    checkS3BucketNameEnvSetup();
    checkS3KeyPrefixEnvSetup();
}

module.exports = { checkAllEnvSetup, checkS3BucketNameEnvSetup, checkS3KeyPrefixEnvSetup };
