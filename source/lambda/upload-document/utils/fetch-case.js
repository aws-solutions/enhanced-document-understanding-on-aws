// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
'use strict';
const AWS = require('aws-sdk');
const CustomConfig = require('aws-node-user-agent-config');

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

module.exports = { getCase };
