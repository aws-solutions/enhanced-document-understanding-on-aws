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
const CustomConfig = require('aws-node-user-agent-config');
const SharedLib = require('common-node-lib');
const { redactedDocAccessChecker, unredactedDocAccessChecker } = require('./doc-access-checkers');
const { checkRedactionPrefixEnvSetup } = require('./env-setup');

/**
 * This function is used to fetch the unredacted document's s3 storage location from DynamoDB.
 * It uses the callback function `docAccessChecker` to check access to the document.
 *
 * The callback function should return true if the user/group has access to the document,
 * and false if not.
 *
 * @param {String} params.caseId Case ID
 * @param {String} params.documentId Document ID
 * @param {Function} docAccessChecker
 * @throws Error when user does not have access to document
 *
 * @returns {Object} response of the form { DocId, Bucket, key, FileName }
 */
exports.getUnredactedDocInfo = async (params, docAccessChecker) => {
    const ddbDocRecord = await this.getDdbRecord(params);

    if (docAccessChecker && !(await docAccessChecker(ddbDocRecord, params.authToken))) {
        throw Error('User does not have access to this document');
    }
    return {
        DocId: ddbDocRecord.DOCUMENT_ID,
        Bucket: ddbDocRecord.BUCKET_NAME,
        key: ddbDocRecord.S3_KEY,
        FileName: ddbDocRecord.UPLOADED_FILE_NAME
    };
};

/**
 * This function is used to fetch the unredacted document's s3 storage location from DynamoDB.
 * It uses the callback function `docAccessChecker` to check access to the document.
 *
 * The callback function should return true if the user/group has access to the document,
 * and false if not.
 *
 * @param {String} params.caseId Case ID
 * @param {String} params.documentId Document ID
 * @param {Function} docAccessChecker
 * @throws Error when user does not have access to document
 *
 * @returns {Object} response of the form { DocId, Bucket, key, FileName }
 */
exports.getRedactedDocInfo = async (params, docAccessChecker) => {
    // Note: This env check is not in the `checkAllEnvSetup` as redaction workflow is optional
    checkRedactionPrefixEnvSetup();

    const ddbDocRecord = await this.getDdbRecord(params);

    if (docAccessChecker && !(await docAccessChecker(ddbDocRecord, params.authToken))) {
        throw Error('User does not have access to this document');
    }

    const redactedDocKey =
        `${process.env.S3_REDACTED_PREFIX}/` +
        `${ddbDocRecord.CASE_ID}/` +
        `${ddbDocRecord.DOCUMENT_ID}` +
        `${SharedLib.RedactionDefaults.REDACTED_FILE_SUFFIX}` +
        `${ddbDocRecord.UPLOADED_FILE_EXTENSION}`;

    return {
        DocId: ddbDocRecord.DOCUMENT_ID,
        Bucket: ddbDocRecord.BUCKET_NAME,
        key: redactedDocKey,
        FileName: ddbDocRecord.UPLOADED_FILE_NAME
    };
};

/**
 * Used to retrieve the document's metadata from the case manager table in DynamoDB.
 * @param {String} params.caseId Case ID
 * @param {String} params.documentId Document ID
 * @returns
 */
exports.getDdbRecord = async (params) => {
    const awsCustomConfig = CustomConfig.customAwsConfig();
    const dynamoDB = new AWS.DynamoDB(awsCustomConfig);

    const ddbParams = {
        TableName: process.env.CASE_DDB_TABLE_NAME,
        Key: {
            'CASE_ID': { S: params.caseId },
            'DOCUMENT_ID': { S: params.documentId }
        }
    };

    const data = await dynamoDB.getItem(ddbParams).promise();
    return AWS.DynamoDB.Converter.unmarshall(data.Item);
};

/**
 * Look up the documentId in db to retrieve the s3 file prefix return the reponse.
 * @param {String} params.caseId Case ID
 * @param {String} params.documentId Document ID
 * @param {String} params.authToken Authentication token received from event
 * @param {String} params.redacted Whether to fetch the redacted or unredacted document
 * @returns {Object} response of the form { DocId, Bucket, key, FileName }
 */
exports.getDocumentPrefix = async (params) => {
    console.debug(JSON.stringify(params));
    try {
        if (!params.caseId || !params.documentId) {
            throw Error('Missing caseId or documentId');
        }

        if (params.redacted) {
            // prettier-ignore
            return await this.getRedactedDocInfo(params, redactedDocAccessChecker); // NOSONAR - underlying function is async
        } else {
            // prettier-ignore
            return await this.getUnredactedDocInfo(params, unredactedDocAccessChecker); // NOSONAR - underlying function is async
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
};
