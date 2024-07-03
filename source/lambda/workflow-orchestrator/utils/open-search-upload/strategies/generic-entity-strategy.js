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
const UserAgentConfig = require('aws-node-user-agent-config');
const SharedLib = require('common-node-lib');

/**
 * This class provides the functionality to fetch generic comprehend inference from S3 and transforms it to be persisted
 * to the OpenSearch serverless collection.
 */
class GenericEntityStrategy {
    /**
     * @param {string} accountId S3 Bucket expected owner account id
     * @param {string} userId the id of the user who created the case.
     * @param {string} caseId the id of the case.
     * @param {Array.<Object>} documents a list of document metadata.
     */
    constructor(accountId, userId, caseId, documents) {
        this.accountId = accountId;
        this.userId = userId;
        this.caseId = caseId;
        this.documents = documents;
        this.inferences = new Map();
    }

    /**
     * Fetch generic comprehend inference from S3 and transforms it.
     */
    async prepareDocuments() {
        const s3Client = new AWS.S3(UserAgentConfig.customAwsConfig());

        for (const document of this.documents) {
            const documentId = document.document.id;
            let transformedInference;
            try {
                const inference = await SharedLib.getInferenceFromS3(
                    this.caseId,
                    documentId,
                    SharedLib.InferenceTypes.ENTITY,
                    this.accountId,
                    s3Client
                );
                transformedInference = this.transformInference(inference);
            } catch (error) {
                console.error(
                    `Failed to get textract inference for case ${this.caseId}, document ${documentId}, with error ${error}`
                );
            }

            this.inferences.set(documentId, transformedInference);
        }
    }

    /**
     * Transforms the inference so that it could be persisted to the OpenSearch serverless collection.
     *
     * @param {Object} inference raw inference fetched from S3 Bucket.
     *
     * @returns {Object} the transformed inference to be consumed by the OpenSearch serverless collection.
     */
    transformInference(inference) {
        const transformedInference = {};
        for (const page of inference) {
            for (const entity of page.Entities) {
                if(!transformedInference.hasOwnProperty(entity.Type)) {
                    transformedInference[entity.Type] = [];
                }
                transformedInference[entity.Type].push(entity.Text);
            }
        }
        return transformedInference;
    }
}

module.exports = { GenericEntityStrategy };
