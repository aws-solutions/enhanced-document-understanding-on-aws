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

const AWS = require('aws-sdk');
const SharedLib = require('common-node-lib');
const CustomConfig = require('aws-node-user-agent-config');

/**
 * This function is meant to be used as a callback function by the `getRedactedDocInfo`
 * function, to check if the document is accessible to the user. This callback also checks
 * if the redated document is processed and available for download.
 *
 * The congnito authentication token is used to verify the user_id with the
 * Cognito identity pool and the document record from the database.
 *
 * @param {Object} ddbDocRecord Unmarshalled document record from the casemanager database
 * @param {String} authToken Cognito authentication token
 * @returns
 */
exports.redactedDocAccessChecker = async (ddbDocRecord, authToken) => {
    const awsCustomConfig = CustomConfig.customAwsConfig();
    const s3 = new AWS.S3(awsCustomConfig);

    if (!authToken) {
        throw new Error('No authentication token provided');
    }

    const congnitoEntity = SharedLib.getCognitoEntityFromAuthToken(authToken);
    
    const userId = congnitoEntity['cognito:username'];
    if (userId !== ddbDocRecord.USER_ID) {
        return false;
    }

    const redactedDocKey =
        `${process.env.S3_REDACTED_PREFIX}/` +
        `${ddbDocRecord.CASE_ID}/` +
        `${ddbDocRecord.DOCUMENT_ID}` +
        `${SharedLib.RedactionDefaults.REDACTED_FILE_SUFFIX}` +
        `${ddbDocRecord.UPLOADED_FILE_EXTENSION}`;
    const s3Params = {
        Bucket: ddbDocRecord.BUCKET_NAME,
        Key: redactedDocKey
    };
    console.debug('s3Params', s3Params);
    try {
        await s3.headObject(s3Params).promise();
    } catch (err) {
        console.error(`Redacted document not found in S3. s3.headObject error response: ${err}`);
        return false;
    }
    return true;
};

/**
 * This function is meant to be used as a callback function by the `getUnredactedDocInfo`
 * function, to check if the document is accessible to the user. The congnito authentication
 * token is used to verify the user_id with the Cognito identity pool and the document record
 * from the database.
 *
 * Right now, this is a dummy checker that always returns true.
 * @param {Object} ddbDocRecord Unmarshalled document record from the casemanager database
 * @param {String} authToken Cognito authentication token
 *
 * @returns
 */
exports.unredactedDocAccessChecker = async (ddbDocRecord, authToken) => {
    if (!authToken) {
        throw new Error('No authentication token provided');
    }
    const congnitoEntity = SharedLib.getCognitoEntityFromAuthToken(authToken);
    const userId = congnitoEntity['cognito:username'];
    let checker = true;

        if (userId !== ddbDocRecord.USER_ID) {
        checker = false;
    }
    return checker;
};
