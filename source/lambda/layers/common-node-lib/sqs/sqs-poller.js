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
const DEFAULT_SQS_BATCH_SIZE = 10;
const DEFAULT_SQS_ITERATION_COUNT = 5;
let SQS_BATCH_SIZE;
let SQS_URL;
let SQS_ITERATION_COUNT;

/**
 * Check the Lambda environment variables for SQS. It sets:
 *
 * `SQS_BATCH_SIZE`: This value sets the MaxNumberOfMessages field while pulling records from SQS.
 * If not set, it will be set to the `DEFAULT_SQS_BATCH_SIZE` value.
 *
 * `SQS_ITERATION_COUNT`: Number of times we will try to pull SQS_BATCH_SIZE records from SQS with
 *  a single call of pullRecordsFromSQS
 *
 * `SQS_URL`: The URL of the SQS queue. If not set, will throw an error
 *
 */
function checkSQSEnvSetup() {
    if (process.env.SQS_BATCH_SIZE) {
        SQS_BATCH_SIZE = process.env.SQS_BATCH_SIZE;
        console.debug(`SQS_BATCH_SIZE is: ${SQS_BATCH_SIZE}`);
    } else {
        SQS_BATCH_SIZE = DEFAULT_SQS_BATCH_SIZE;
        console.debug(
            `SQS_BATCH_SIZE Lambda Environment variable not set. Setting it to the default value of: ${DEFAULT_SQS_BATCH_SIZE}.`
        );
    }

    if (process.env.SQS_ITERATION_COUNT) {
        SQS_ITERATION_COUNT = process.env.SQS_ITERATION_COUNT;
        console.debug(`SQS_ITERATION_COUNT is: ${SQS_ITERATION_COUNT}`);
    } else {
        SQS_ITERATION_COUNT = DEFAULT_SQS_ITERATION_COUNT;
        console.debug(
            `SQS_ITERATION_COUNT Lambda Environment variable not set. Setting it to the default value of: ${DEFAULT_SQS_ITERATION_COUNT}.`
        );
    }

    if (process.env.SQS_URL) {
        SQS_URL = process.env.SQS_URL;
        console.debug(`SQS_URL is: ${SQS_URL}`);
    } else {
        throw new Error('SQS_URL Lambda Environment variable not set.');
    }
}

/**
 * Method to pull messages from SQS in batches based on the set batch size. This method should be called
 * after the @checkSQSEnvSetup method has been called.
 *
 * @returns
 */
async function pullRecordsFromSQS() {
    const awsCustomConfig = UserAgentConfig.customAwsConfig();
    const sqsClient = new AWS.SQS(awsCustomConfig);

    if (!SQS_BATCH_SIZE || !SQS_URL) {
        checkSQSEnvSetup();
    }

    let sqsRecords;
    try {
        for (let i = 0; i < SQS_ITERATION_COUNT; i++) {
            let tmpSqsRecords = await sqsClient
                .receiveMessage({
                    AttributeNames: ['All'],
                    MaxNumberOfMessages: SQS_BATCH_SIZE,
                    QueueUrl: SQS_URL
                })
                .promise();

            if (sqsRecords) {
                sqsRecords.Messages.push(tmpSqsRecords.Messages);
            } else {
                sqsRecords = tmpSqsRecords;
            }

            // Stop pulling messages if last batch_size was smaller than 10
            if (tmpSqsRecords.Messages.length < 10) {
                console.debug('No more SQS_MESSAGE in the queue!');
                break;
            }
        }
    } catch (error) {
        console.error(`Failed to retrieve SQS messages. Error is: ${JSON.stringify(error.message)}`);
        throw error;
    }

    if (!sqsRecords.Messages || sqsRecords.Messages.length == 0) {
        console.warn('No records retrieved from SQS to process.');
        return;
    }
    return sqsRecords;
}

module.exports = { checkSQSEnvSetup, pullRecordsFromSQS };
