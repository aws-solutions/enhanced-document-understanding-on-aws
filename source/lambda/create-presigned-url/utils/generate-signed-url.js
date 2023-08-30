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

const PRESIGNED_URL_EXPIRATION_SECONDS = 60;

/**
 * Function to check if the userId in the tags matches the userId in the request
 * @param {{key: string, userId: string, expectedBucketOwner: string}} params 
 * @param {string} params.key Key of object to validate tags for
 * @param {string} params.userId User ID to validate tags with
 * @param {string} params.expectedBucketOwner AWS account ID for the request origin account
 * @returns
 */
exports.isUserIdInTags = async (params) => {
    const awsCustomConfig = CustomConfig.customAwsConfig();
    const s3 = new AWS.S3(awsCustomConfig);

    const s3Params = {
        Bucket: process.env.UPLOAD_DOCS_BUCKET_NAME,
        Key: params.key,
        ExpectedBucketOwner: params.expectedBucketOwner
    };

    const response = await s3.getObjectTagging(s3Params).promise();

    const userIdInTags = response.TagSet.some((tag) => {
        return tag.Key === 'userId' && tag.Value === params.userId;
    });

    console.log(
        `userIdInTag : ${userIdInTags} \n Tagset: ${response.TagSet} \n  Key: ${params.key} \n  UserId: ${params.userId}`
    );

    return userIdInTags;
};

/**
 * Sanitize and validate request, then generate a presignedURL
 * @param {{key: string, userId: string, expectedBucketOwner: string}} params JSON request object used for lookup
 * @param {String} params.key S3 key for the document
 * @param {String} params.userId User ID for the document used to set the metadata
 * @returns {Promise<string>} Promise for a s3 signed url
 * @throws {Error} If userId is not found in the tags
 */
exports.getDocumentUrl = async (params) => {
    const awsCustomConfig = CustomConfig.customAwsConfig();
    const s3 = new AWS.S3({ ...awsCustomConfig, signatureVersion: 'v4' });

    try {
        const isUserIdInTags = await this.isUserIdInTags(params);

        if (!isUserIdInTags) {
            throw new Error('User ID not found in tags');
        }

        const s3GetObjParams = {
            Bucket: process.env.UPLOAD_DOCS_BUCKET_NAME,
            Key: params.key,
            ExpectedBucketOwner: params.expectedBucketOwner
        };

        const req = s3.getObject(s3GetObjParams);

        req.on('build', (request) => {
            request.httpRequest.path += `?response-content-disposition=${params.fileName}`;
            request.httpRequest.headers['x-amz-meta-userId'] = params.userId;
        });

        const presignedUrl = req.presign(PRESIGNED_URL_EXPIRATION_SECONDS);
        return presignedUrl;
    } catch (error) {
        console.error(`Error generating presignedUrl: ${error.message}`);
        throw error;
    }
};
