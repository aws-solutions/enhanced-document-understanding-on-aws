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

let CASE_DDB_TABLE_NAME;
let DDB_GSI_USER_ID;
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
}

function checkAllEnvSetup() {
    checkDdbEnvSetup();
    checkDdbGsiNameEnvSetup();
}

module.exports = { checkAllEnvSetup, checkDdbEnvSetup, checkDdbGsiNameEnvSetup, checkRedactionPrefixEnvSetup };
