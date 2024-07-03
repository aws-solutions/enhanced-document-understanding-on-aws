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

/**
 * Retrieves all items from the table with a given caseId. If a caseId is
 * not found in the table then an Error is thrown. By default all attributes
 * are returned.
 *
 * @param {Object} params.caseId JSON object containing the caseId
 * @param {Object} params.ddbTableName The name of the table to query
 *
 * @returns ddb response object
 */
const getCase = async (params) => {
    const awsCustomConfig = CustomConfig.customAwsConfig();
    const dynamoDB = new AWS.DynamoDB(awsCustomConfig);

    const caseManagerTable = params.ddbTableName;
    const caseId = params.caseId;

    try {
        if (!caseManagerTable) {
            throw new Error('Table name is required');
        }

        const ddbParams = {
            TableName: caseManagerTable,
            KeyConditionExpression: 'CASE_ID = :c',
            ExpressionAttributeValues: {
                ':c': {
                    S: caseId
                }
            }
        };

        const response = await dynamoDB.query(ddbParams).promise();
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

module.exports = { getCase };
