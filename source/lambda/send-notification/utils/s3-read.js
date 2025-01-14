// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const AWS = require('aws-sdk');
const UserAgentConfig = require('aws-node-user-agent-config');

let TEMPLATES_BUCKET_NAME, TEMPLATE_PREFIX, AWS_REGION;

/**
 * Check the Lambda environment variables for S3. It sets:
 *
 * `TEMPLATES_BUCKET_NAME`: This value sets the name of the S3 bucket that contains the email templates
 * If not set, it will throw an error.
 *
 */
exports.checkS3EnvSetup = async () => {
    if (process.env.TEMPLATES_BUCKET_NAME) {
        TEMPLATES_BUCKET_NAME = process.env.TEMPLATES_BUCKET_NAME;
        console.debug(`TEMPLATES_BUCKET_NAME is: ${TEMPLATES_BUCKET_NAME}`);
    } else {
        throw new Error('TEMPLATES_BUCKET_NAME Lambda Environment variable not set.');
    }

    if (process.env.TEMPLATE_PREFIX) {
        TEMPLATE_PREFIX = process.env.TEMPLATE_PREFIX;
        console.debug(`TEMPLATE_PREFIX is: ${TEMPLATE_PREFIX}`);
    } else {
        throw new Error('TEMPLATE_PREFIX Lambda Environment variable not set.');
    }

    if (process.env.AWS_REGION) {
        AWS_REGION = process.env.AWS_REGION;
        console.debug(`AWS_REGION is: ${AWS_REGION}`);
    } else {
        throw new Error('AWS_REGION Lambda Environment variable not set.');
    }
};

/**
 * Method to fetch template from S3 per the key and bucket provided.
 * This method should be called after the @checkS3EnvSetup method has been called.
 *
 * @param {*} bucket
 * @param {*} key
 *
 * @returns
 */
exports.getTemplateFromS3 = async (key, bucket = TEMPLATES_BUCKET_NAME) => {
    if (!TEMPLATES_BUCKET_NAME) {
        await this.checkS3EnvSetup();
    }
    const s3 = new AWS.S3(UserAgentConfig.customAwsConfig());

    console.debug(`Getting object at bucket: ${bucket} with key: ${key}`);

    let s3Response = await s3
        .getObject({
            Bucket: bucket,
            Key: key
        })
        .promise();
    return s3Response;
};
