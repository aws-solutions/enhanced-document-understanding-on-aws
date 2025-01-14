// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
