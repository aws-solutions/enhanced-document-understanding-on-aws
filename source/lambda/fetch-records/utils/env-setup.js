// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

let CASE_DDB_TABLE_NAME;
let DDB_GSI_USER_ID;
let DDB_GSI_USER_DOC_ID;
let S3_REDACTED_PREFIX;

function checkDdbEnvSetup() {
    if (process.env.CASE_DDB_TABLE_NAME) {
        CASE_DDB_TABLE_NAME = process.env.CASE_DDB_TABLE_NAME;
        console.debug(`CASE_DDB_TABLE_NAME is: ${CASE_DDB_TABLE_NAME}`);
    } else {
        throw new Error('CASE_DDB_TABLE_NAME Lambda Environment variable not set.');
    }
}

function checkRedactionPrefixEnvSetup() {
    if (process.env.S3_REDACTED_PREFIX) {
        S3_REDACTED_PREFIX = process.env.S3_REDACTED_PREFIX;
        console.debug(`S3_REDACTED_PREFIX is: ${S3_REDACTED_PREFIX}`);
    } else {
        throw new Error(
            'S3_REDACTED_PREFIX Lambda Environment variable not set, likely as Redaction workflow was not deployed'
        );
    }
}

function checkDdbGsiNameEnvSetup() {
    if (process.env.DDB_GSI_USER_ID) {
        DDB_GSI_USER_ID = process.env.DDB_GSI_USER_ID;
        console.debug(`DDB_GSI_USER_ID is: ${DDB_GSI_USER_ID}`);
    } else {
        throw new Error('DDB_GSI_USER_ID Lambda Environment variable not set.');
    }

    if (process.env.DDB_GSI_USER_DOC_ID) {
        DDB_GSI_USER_DOC_ID = process.env.DDB_GSI_USER_DOC_ID;
        console.debug(`DDB_GSI_USER_DOC_ID is: ${DDB_GSI_USER_DOC_ID}`);
    } else {
        throw new Error('DDB_GSI_USER_DOC_ID Lambda Environment variable not set.');
    }
}

function checkAllEnvSetup() {
    checkDdbEnvSetup();
    checkDdbGsiNameEnvSetup();
}

module.exports = { checkAllEnvSetup, checkDdbEnvSetup, checkDdbGsiNameEnvSetup, checkRedactionPrefixEnvSetup };
