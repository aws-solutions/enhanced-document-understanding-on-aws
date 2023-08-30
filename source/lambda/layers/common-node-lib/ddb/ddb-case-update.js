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
 *********************************************************************************************************************/

'use strict';

const AWS = require('aws-sdk');
const UserAgentConfig = require('aws-node-user-agent-config');
const { InferenceInfo } = require('../s3/s3-inferences');
const { inferenceAttributePrefix, casePlaceholderDocumentId, caseStatusDdbAttributeName } = require('../constants');

let CASE_DDB_TABLE_NAME;

/**
 * Check the Lambda environment variables for DynamoDB. It sets:
 *
 * `CASE_DDB_TABLE_NAME`: The table where DynamoDB will store details of the cases being processed.
 * here, we need this to write the locations of the case inferences
 * - If not set, it will throw an error.
 *
 */
function checkDDBCaseUpdateEnvSetup() {
    if (process.env.CASE_DDB_TABLE_NAME) {
        CASE_DDB_TABLE_NAME = process.env.CASE_DDB_TABLE_NAME;
        console.debug(`CASE_DDB_TABLE_NAME is: ${CASE_DDB_TABLE_NAME}`);
    } else {
        throw new Error('CASE_DDB_TABLE_NAME Lambda Environment variable not set.');
    }
}

/**
 * Updates the cases table by adding a field for each inference provided for each document
 *
 * @param {Array[InferenceInfo]} inferencesToUpdate Array of objects containing info on how to update DDB entries
 * @returns {Array[Object]} an array of the responses from ddb, containing the new values of the updated records
 */
async function updateInferences(inferencesToUpdate) {
    const dynamoDB = new AWS.DynamoDB(UserAgentConfig.customAwsConfig());
    let writeResponses = [];

    for (let inferenceToUpdate of inferencesToUpdate) {
        try {
            let writeResponse = await updateInference(inferenceToUpdate, dynamoDB); // NOSONAR - await does nothing in deployment, needed for unit tests
            writeResponses.push(writeResponse);
        } catch (error) {
            console.error(error.message);
        }
    }
    return writeResponses;
}

/**
 * Updates the case table by adding a field for a single inference provided for a document
 *
 * @param {InferenceInfo} inference object containing info on how to update DDB entries
 * @param {Optional[AWS.DynamoDB]} dynamoDB dynamoDB client to be used. Will create a new one if not provided.
 * @returns {Object} the response from DDB, containing the new value for the updated record
 */
async function updateInference(inference, dynamoDB = undefined) {
    const _dynamoDB = dynamoDB ?? new AWS.DynamoDB(UserAgentConfig.customAwsConfig());

    if (!CASE_DDB_TABLE_NAME) {
        checkDDBCaseUpdateEnvSetup();
    }

    try {
        let updateInput = {
            TableName: CASE_DDB_TABLE_NAME,
            Key: AWS.DynamoDB.Converter.marshall({
                CASE_ID: inference.caseId,
                DOCUMENT_ID: inference.documentId
            }),
            UpdateExpression: 'set #InferenceAttributeName = :x',
            ExpressionAttributeNames: {
                '#InferenceAttributeName': `${inferenceAttributePrefix}-${inference.inferenceType}`
            },
            ExpressionAttributeValues: {
                ':x': { 'S': inference.s3Key }
            },
            ReturnValues: 'ALL_NEW'
        };

        return await _dynamoDB.updateItem(updateInput).promise();
    } catch (error) {
        console.error(
            `Error writing to dynamodb for inference '${inference.inferenceType}' and document '${inference.documentId}'.\nGot error: ${error.message}`
        );
        throw error;
    }
}

/**
 * Gets all the inferences by name and the corresponding s3 keys as key:value pairs
 *
 * @param {string} caseId
 * @param {string} documentId
 * @returns {Object} where keys are the inferenceType and value is the s3 key of the json file containing the inference
 */
async function getInferencePrefixes(caseId, documentId) {
    const awsCustomConfig = UserAgentConfig.customAwsConfig();
    const dynamoDB = new AWS.DynamoDB(awsCustomConfig);

    if (!CASE_DDB_TABLE_NAME) {
        checkDDBCaseUpdateEnvSetup();
    }

    let ddbResponse;
    try {
        let getItemInput = {
            TableName: CASE_DDB_TABLE_NAME,
            Key: AWS.DynamoDB.Converter.marshall({
                CASE_ID: caseId,
                DOCUMENT_ID: documentId
            }),
            ConsistentRead: true
        };
        ddbResponse = AWS.DynamoDB.Converter.unmarshall((await dynamoDB.getItem(getItemInput).promise()).Item);
    } catch (error) {
        let errMessage = `Error retrieving item from ddb with CASE_ID: ${caseId} and DOCUMENT_ID: ${documentId}. Error is: ${error.message}`;
        console.error(errMessage);
        throw new Error(errMessage);
    }

    let inferenceTypeLocationPairs = {};
    // all attributes in the table which specify an inference location have the same prefix in the name, so we look
    // through the response from DDB and return those key:value pairs
    const expectedInferencePrefix = `${inferenceAttributePrefix}-`;
    for (const [key, value] of Object.entries(ddbResponse)) {
        if (key.startsWith(expectedInferencePrefix)) {
            inferenceTypeLocationPairs[key.slice(expectedInferencePrefix.length)] = value;
        }
    }

    return inferenceTypeLocationPairs;
}

/**
 * Updates the 'status' field in the case table for a case as provided.
 * @param {string} caseId ID of the case to update
 * @param {string} status Status string to update with
 * @param {Optional[AWS.DynamoDB]} dynamoDB dynamoDB client to be used. Will create a new one if not provided.
 * @returns {Object} the response from DDB, containing the new value for the updated record
 * @throws  {Error} if the CASE_DDB_TABLE_NAME environment variable is not set or there is an error in the ddb updateItem call
 */
async function updateCaseStatus(caseId, status, dynamoDB = undefined) {
    const _dynamoDB = dynamoDB ?? new AWS.DynamoDB(UserAgentConfig.customAwsConfig());

    if (!CASE_DDB_TABLE_NAME) {
        checkDDBCaseUpdateEnvSetup();
    }

    try {
        let updateInput = {
            TableName: CASE_DDB_TABLE_NAME,
            Key: AWS.DynamoDB.Converter.marshall({
                CASE_ID: caseId,
                DOCUMENT_ID: casePlaceholderDocumentId
            }),
            UpdateExpression: 'set #StatusAttributeName = :x',
            ExpressionAttributeNames: {
                '#StatusAttributeName': caseStatusDdbAttributeName
            },
            ExpressionAttributeValues: {
                ':x': { 'S': status }
            },
            ReturnValues: 'ALL_NEW'
        };

        const ddbResponse = await _dynamoDB.updateItem(updateInput).promise();
        console.debug(
            `Update for case '${caseId}' to status '${status}'in DDB gave response: ${JSON.stringify(ddbResponse)}`
        );
        return ddbResponse;
    } catch (error) {
        console.error(
            `Error updating case status in dynamodb for case '${caseId} and status '${status}'.\nGot error: ${error.message}`
        );
        throw error;
    }
}

module.exports = {
    updateInferences,
    updateInference,
    updateCaseStatus,
    getInferencePrefixes,
    checkDDBCaseUpdateEnvSetup,
    CASE_DDB_TABLE_NAME
};
