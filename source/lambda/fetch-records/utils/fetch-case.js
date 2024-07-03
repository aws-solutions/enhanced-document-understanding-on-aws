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

/**
 * Retrieves all items from the table with a given caseId. If a caseId is
 * not found in the table then an Error is thrown. By default all attributes
 * are returned.
 * @param {Object} params JSON object containing the caseId
 * @returns
 */
const getCase = async (params) => {
    const awsCustomConfig = CustomConfig.customAwsConfig();
    const dynamoDB = new AWS.DynamoDB(awsCustomConfig);

    const caseId = params.caseId;
    const ddbParams = {
        TableName: process.env.CASE_DDB_TABLE_NAME,
        KeyConditionExpression: 'CASE_ID = :c',
        ExpressionAttributeValues: {
            ':c': {
                S: caseId
            }
        }
    };
    try {
        const response = await dynamoDB.query(ddbParams).promise();
        console.debug(`RESPONSE from dynamoDB.query: ${JSON.stringify(response)}`);
        if (!response.Count) {
            console.error(`CaseId::${caseId} NOT found in Cases table.`);
            throw new Error('Incorrect CaseId');
        }

        return response;
    } catch (error) {
        console.error(`Error retrieving caseId: ${caseId} \n`, error);
        throw error;
    }
};

/**
 * Use the userId to retrieve all cases for the authorized user.
 * This is accessible only through calls made by the
 * cognito authorized internal users.
 * @param {String} userId UserId of the authorized user
 * @param {Object} params that holds name of the case and the last evaluated key to be used by Dynamo for pagination purpose
 * @returns Response from dynamoDB.scan
 */
const listCases = async (userId, params) => {
    const awsCustomConfig = CustomConfig.customAwsConfig();
    const dynamoDB = new AWS.DynamoDB(awsCustomConfig);

    try {
        let ddbParams;
        if (params) {
            ddbParams = buildPaginatedListCasesQuery(userId, params);
        } else {
            ddbParams = buildListCasesQuery(userId);
        }

        const response = await dynamoDB.query(ddbParams).promise();
        if (!response.Count) {
            console.log('No records found in table');
        }
        return response;
    } catch (err) {
        console.error('List cases scan on table failed. \n', err);
        throw err;
    }
};

/**
 * Build the Dynamo query parameters.
 *
 * @param {String} userId UserId of the authorized user
 * @returns queryInput to be used by Dynamo query
 */
const buildListCasesQuery = (userId) => {
    return {
        TableName: process.env.CASE_DDB_TABLE_NAME,
        IndexName: process.env.DDB_GSI_USER_ID,
        KeyConditionExpression: 'USER_ID = :c',
        ExpressionAttributeValues: {
            ':c': {
                S: userId
            }
        }
    };
};

/**
 * Build the paginated Dynamo query parameters.
 *
 * @param {String} userId UserId of the authorized user
 * @param {Object} params that holds name of the case and the last evaluated key to be used by Dynamo for pagination purpose
 * @returns queryInput to be used by Dynamo query
 */
const buildPaginatedListCasesQuery = (userId, params) => {
    const userDocId = userId.concat(':', SharedLib.casePlaceholderDocumentId);
    const ddbParams = {
        TableName: process.env.CASE_DDB_TABLE_NAME,
        IndexName: process.env.DDB_GSI_USER_DOC_ID,
        Limit: params.size ? Number(params.size) : 20,
        ScanIndexForward: true
    };

    if (params.caseName) {
        ddbParams['KeyConditionExpression'] = 'USER_DOC_ID = :v_user_doc_id and CASE_NAME = :v_name';
        ddbParams['ExpressionAttributeValues'] = {
            ':v_user_doc_id': {
                S: userDocId
            },
            ':v_name': {
                S: params.caseName
            }
        };
    } else {
        ddbParams['KeyConditionExpression'] = 'USER_DOC_ID = :v_user_doc_id';
        ddbParams['ExpressionAttributeValues'] = {
            ':v_user_doc_id': {
                S: userDocId
            }
        };
    }

    if (params.key) {
        ddbParams['ExclusiveStartKey'] = JSON.parse(decodeURI(params.key));
    }

    return ddbParams;
};

module.exports = { listCases, getCase };
