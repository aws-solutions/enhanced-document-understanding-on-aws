// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const AWS = require('aws-sdk');
const UserAgentConfig = require('aws-node-user-agent-config');
const SharedLib = require('common-node-lib');
const { combineTextractLines } = require('../../search-storage-utils');

/**
 * This class provides the functionality to fetch textract inference from S3 and transforms it to be persisted
 * to the OpenSearch serverless collection.
 */
class TextractStrategy {
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
     * Fetch textract inference from S3 and transforms it.
     */
    async prepareDocuments() {
        const s3Client = new AWS.S3(UserAgentConfig.customAwsConfig());

        for (const document of this.documents) {
            const documentId = document.document.id;
            let documentString;
            try {
                const inference = await SharedLib.getInferenceFromS3(
                    this.caseId,
                    documentId,
                    SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT,
                    this.accountId,
                    s3Client
                );
                documentString = combineTextractLines(inference);
            } catch (error) {
                console.error(
                    `Failed to get textract inference for case ${this.caseId}, document ${documentId}, with error ${error}`
                );
            }

            this.inferences.set(documentId, documentString);
        }
    }
}

module.exports = { TextractStrategy };
