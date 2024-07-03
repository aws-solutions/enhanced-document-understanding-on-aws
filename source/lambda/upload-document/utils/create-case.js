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
const crypto = require('crypto');
const SharedLib = require('common-node-lib');

/**
 * Generate an unique caseId with the user Id prepended to it.
 * This caseId is used as the partition key for the dynamoDb table.
 * @param {String} userId
 * @returns composite caseId string
 */
exports.generateCaseId = (userId) => {
    return `${userId}:${crypto.randomUUID()}`;
};

/**
 * Generates a file folder path prefix to be stored inside of s3
 * @param {*} caseId
 * @returns file folder prefix path string
 */
exports.s3FolderPath = (caseId) => {
    const s3UploadPrefix = process.env.S3_UPLOAD_PREFIX;
    return `${s3UploadPrefix}/${caseId}`;
};

exports.createCase = async (params) => {
    const awsCustomConfig = CustomConfig.customAwsConfig();
    const dynamoDB = new AWS.DynamoDB(awsCustomConfig);

    const userId = params.userId;
    const userDocId = userId.concat(':', SharedLib.casePlaceholderDocumentId);
    const caseName = params.caseName;
    const enableBackendUpload = params.enableBackendUpload !== undefined ? params.enableBackendUpload : false;
    const caseId = this.generateCaseId(userId);

    // need a default non-empty value for 'DOCUMENT_ID' as its set as the Sort Key
    const ddbItem = {
        CASE_ID: caseId,
        DOCUMENT_ID: SharedLib.casePlaceholderDocumentId,
        USER_ID: userId,
        USER_DOC_ID: userDocId,
        DOC_COUNT: 0,
        CASE_NAME: caseName,
        CREATION_TIMESTAMP: new Date().toISOString(),
        STATUS: SharedLib.CaseStatus.INITIATE,
        ENABLE_BACKEND_UPLOAD: enableBackendUpload,
        S3_FOLDER_PATH: this.s3FolderPath(caseId)
    };
    const ddbParams = {
        TableName: process.env.CASE_DDB_TABLE_NAME,
        Item: AWS.DynamoDB.Converter.marshall(ddbItem)
    };

    try {
        await dynamoDB.putItem(ddbParams).promise();
        // Case created, send metrics for case initiation
        const cloudWatch = new SharedLib.CloudWatchMetrics(SharedLib.CloudwatchNamespace.CASE);
        await cloudWatch.publishMetrics(SharedLib.CaseStatus.INITIATE);
        return {
            ddbResponse: ddbItem,
            caseId: caseId
        };
    } catch (error) {
        console.error(`Error adding case to DynamoDB with ddbParams: ${JSON.stringify(ddbParams)}. ${error.message}`);
        throw error;
    }
};

/**
 * Validate if the caseName is legal by using the userId and caseName to check if the case name has been taken by this user
 *
 * @param {String} userId UserId of the authorized user
 * @param {String} caseName name of the case
 *
 * @returns boolean indicates if case name already exists
 */
exports.validateCaseName = async (userId, caseName) => {
    const awsCustomConfig = CustomConfig.customAwsConfig();
    const dynamoDB = new AWS.DynamoDB(awsCustomConfig);
    const userDocId = userId.concat(':', SharedLib.casePlaceholderDocumentId);

    const ddbParams = {
        TableName: process.env.CASE_DDB_TABLE_NAME,
        IndexName: process.env.DDB_GSI_USER_DOC_ID,
        KeyConditionExpression: 'USER_DOC_ID = :v_user_doc_id and CASE_NAME = :v_name',
        ExpressionAttributeValues: {
            ':v_user_doc_id': {
                S: userDocId
            },
            ':v_name': {
                S: caseName
            }
        }
    };

    try {
        const response = await dynamoDB.query(ddbParams).promise();

        return !response.Count || response.Count === 0;
    } catch (error) {
        console.error(`Error validating caseName: ${JSON.stringify(ddbParams)}. ${error.message}`);
        throw error;
    }
};
