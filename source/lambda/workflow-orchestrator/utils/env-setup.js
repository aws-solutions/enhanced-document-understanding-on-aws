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
let WORKFLOW_CONFIG_TABLE_NAME;
let S3_UPLOAD_PREFIX;
let EVENT_BUS_ARN;
let WORKFLOW_CONFIG_NAME;
let APP_NAMESPACE;

function checkDDBReadEnvSetup() {
    if (process.env.CASE_DDB_TABLE_NAME && process.env.WORKFLOW_CONFIG_TABLE_NAME) {
        CASE_DDB_TABLE_NAME = process.env.CASE_DDB_TABLE_NAME;
        WORKFLOW_CONFIG_TABLE_NAME = process.env.WORKFLOW_CONFIG_TABLE_NAME;
    } else {
        throw new Error(
            'Either CASE_DDB_TABLE_NAME or WORKFLOW_CONFIG_TABLE_NAME Lambda Environment variable not set.'
        );
    }
}

function checkS3UploadPrefixEnvSetup() {
    if (process.env.S3_UPLOAD_PREFIX) {
        S3_UPLOAD_PREFIX = process.env.S3_UPLOAD_PREFIX;
    } else {
        throw new Error('S3_UPLOAD_PREFIX Lambda Environment variable not set.');
    }
}

function checkEventBusArnEnvSetup() {
    if (process.env.EVENT_BUS_ARN) {
        EVENT_BUS_ARN = process.env.EVENT_BUS_ARN;
    } else {
        throw new Error('EVENT_BUS_ARN Lambda Environment variable not set.');
    }
}

function checkAppNamespaceEnvSetup() {
    if (process.env.APP_NAMESPACE) {
        APP_NAMESPACE = process.env.APP_NAMESPACE;
    } else {
        throw new Error('APP_NAMESPACE Lambda Environment variable not set.');
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

function checkKendraRoleArnEnvSetup() {
    if (!process.env.KENDRA_ROLE_ARN) {
        throw new Error('KENDRA_ROLE_ARN Lambda Environment variable not set.');
    }
}

function checkAllEnvSetup() {
    checkDDBReadEnvSetup();
    checkDDBReadEnvSetup();
    checkEventBusArnEnvSetup();
    checkWorkflowConfigNameEnvSetup();
    checkAppNamespaceEnvSetup();
}

module.exports = {
    checkWorkflowConfigNameEnvSetup,
    checkDDBReadEnvSetup,
    checkS3UploadPrefixEnvSetup,
    checkEventBusArnEnvSetup,
    checkAppNamespaceEnvSetup,
    checkKendraRoleArnEnvSetup,
    checkAllEnvSetup
};
