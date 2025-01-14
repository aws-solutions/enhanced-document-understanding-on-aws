// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const AWS = require('aws-sdk');
const UserAgentConfig = require('aws-node-user-agent-config');
const { checkDdbEnvSetup } = require('../utils/env-setup');

/**
 * This method returns the workflow configuration from DynamoDB table for the workflowConfigName passed as a parameter.
 * The returned value is an unmarshalled JSON converted from the DynamoDB Item.
 *
 * @param {string} workflowConfigName
 * @returns
 */
async function loadWorkflowConfig(workflowConfigName, dynamoDB = undefined) {
    const _dynamoDB = dynamoDB ?? new AWS.DynamoDB(UserAgentConfig.customAwsConfig());

    if (!process.env.WORKFLOW_CONFIG_TABLE_NAME) {
        checkDdbEnvSetup();
    }
    const workflowConfigTable = process.env.WORKFLOW_CONFIG_TABLE_NAME;

    let response = undefined;

    try {
        response = await _dynamoDB
            .getItem({
                Key: {
                    Name: {
                        S: workflowConfigName
                    }
                },
                TableName: workflowConfigTable
            })
            .promise();
    } catch (error) {
        console.error(`Error reading config file from config table, error is ${error.message}`);
        throw error;
    }

    console.debug(`DynamoDB response is ${JSON.stringify(response)}`);

    if (!response.Item) {
        const errMsg = `No config found in table for config name ${workflowConfigName}`;
        console.error(errMsg);
        throw new Error(errMsg);
    }

    const config = AWS.DynamoDB.Converter.unmarshall(response.Item);
    console.debug(`Configuration retrieved from Dynamodb table is ${JSON.stringify(config)}`);
    return config;
}

module.exports = { loadWorkflowConfig };
