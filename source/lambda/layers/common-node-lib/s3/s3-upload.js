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
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

let DOCUMENT_BUCKET_NAME;
let WORKFLOW_S3_PREFIX;

/**
 * Check the Lambda environment variables for S3. It sets:
 *
 * `DOCUMENT_BUCKET_NAME`: This value sets the name of the S3 bucket that stores the documents while Comprehend
 * processes them.
 * If not set, it will throw an error.
 *
 */
function checkS3EnvSetup() {
    if (process.env.DOCUMENT_BUCKET_NAME) {
        DOCUMENT_BUCKET_NAME = process.env.DOCUMENT_BUCKET_NAME;
        console.debug(`DOCUMENT_BUCKET_NAME is: ${DOCUMENT_BUCKET_NAME}`);
    } else {
        throw new Error('DOCUMENT_BUCKET_NAME Lambda Environment variable not set.');
    }

    if (process.env.WORKFLOW_S3_PREFIX) {
        WORKFLOW_S3_PREFIX = process.env.WORKFLOW_S3_PREFIX;
        console.debug(`WORKFLOW_S3_PREFIX is: ${WORKFLOW_S3_PREFIX}`);
    } else {
        throw new Error('WORKFLOW_S3_PREFIX Lambda Environment variable not set.');
    }
}

/**
 * Method to upload documents to a unique location in an s3 bucket for processing as a batch job of documents.
 * This method should be called after the @checkS3EnvSetup method has been called.
 *
 * @param {*} records
 * @returns
 */
async function uploadDocsToS3(records) {
    const s3Client = new AWS.S3(UserAgentConfig.customAwsConfig());

    if (!DOCUMENT_BUCKET_NAME) {
        this.checkS3EnvSetup();
    }

    const uniqueS3Prefix = `${WORKFLOW_S3_PREFIX}/${uuidv4()}`;
    const keyPrefix = `${uniqueS3Prefix}/input/`;
    let file, recordToAdd;
    let dynamoDBArr = [];

    for (let record of records) {
        file = record.body.input.message; //contains file-path. Upload the file to the s3 bucket
        const fileStream = fs.createReadStream(file);
        const fileName = path.basename(file);

        try {
            await s3Client
                .upload({
                    Bucket: DOCUMENT_BUCKET_NAME,
                    Key: `${keyPrefix}/${fileName}`,
                    Body: fileStream
                })
                .promise();
        } catch (error) {
            console.error(`Error uploading object: ${file}. Error is: ${error.message}`);
            throw error;
        }

        fileStream.on('close', () => {
            console.log(`Successfully uploaded object: ${file}`);
        });
        fileStream.on('error', (error) => {
            console.error(`Error uploading object: ${file}. Error is: ${error.message}`);
        });

        // dynamoDBArr is used for storing prefix/fileName, taskToken, jobId and TTL in DynamoDB
        recordToAdd = {
            'taskToken': record.body.taskToken,
            's3Prefix': `${keyPrefix}`,
            's3FileName': `${fileName}`,
            'receiptHandle': record.receiptHandle // used for sqs.deleteMessage call
        };
        dynamoDBArr.push(recordToAdd);
    }

    console.log(`Successfully uploaded objects to S3 with the prefix: ${uniqueS3Prefix}`);
    return [`s3://${DOCUMENT_BUCKET_NAME}/${uniqueS3Prefix}`, dynamoDBArr];
}

module.exports = { checkS3EnvSetup, uploadDocsToS3 };
