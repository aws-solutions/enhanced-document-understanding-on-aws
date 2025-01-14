// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

let CASE_DDB_TABLE_NAME;
let S3_UPLOAD_PREFIX;
let UPLOAD_DOCS_BUCKET_NAME;
let WORKFLOW_CONFIG_TABLE_NAME;
let DDB_GSI_USER_DOC_ID;
let WORKFLOW_CONFIG_NAME;

function checkDdbEnvSetup() {
    if (process.env.CASE_DDB_TABLE_NAME && process.env.WORKFLOW_CONFIG_TABLE_NAME && process.env.DDB_GSI_USER_DOC_ID) {
        CASE_DDB_TABLE_NAME = process.env.CASE_DDB_TABLE_NAME;
        WORKFLOW_CONFIG_TABLE_NAME = process.env.WORKFLOW_CONFIG_TABLE_NAME;
        DDB_GSI_USER_DOC_ID = process.env.DDB_GSI_USER_DOC_ID;
    } else {
        throw new Error(
            'Either CASE_DDB_TABLE_NAME or WORKFLOW_CONFIG_TABLE_NAME Lambda Environment variable not set.'
        );
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

function checkS3EnvSetup() {
    if (process.env.UPLOAD_DOCS_BUCKET_NAME) {
        UPLOAD_DOCS_BUCKET_NAME = process.env.UPLOAD_DOCS_BUCKET_NAME;
        console.debug(`UPLOAD_DOCS_BUCKET_NAME is: ${UPLOAD_DOCS_BUCKET_NAME}`);
    } else {
        throw new Error('UPLOAD_DOCS_BUCKET_NAME Lambda Environment variable not set.');
    }
}

function checkWorkflowConfigNameEnvSetup() {
    const DEFAULT_WORKFLOW_CONFIG_NAME = 'default';
    if (process.env.WORKFLOW_CONFIG_NAME) {
        WORKFLOW_CONFIG_NAME = process.env.WORKFLOW_CONFIG_NAME;
    } else {
        console.log('WORKFLOW_CONFIG_NAME Lambda Environment variable not found. Setting to default value');
        process.env.WORKFLOW_CONFIG_NAME = DEFAULT_WORKFLOW_CONFIG_NAME;
    }
}

function checkAllEnvSetup() {
    checkDdbEnvSetup();
    checkS3KeyPrefixEnvSetup();
    checkS3EnvSetup();
    checkWorkflowConfigNameEnvSetup();
}

module.exports = {
    checkAllEnvSetup,
    checkS3EnvSetup,
    checkDdbEnvSetup,
    checkS3KeyPrefixEnvSetup,
    checkWorkflowConfigNameEnvSetup
};
