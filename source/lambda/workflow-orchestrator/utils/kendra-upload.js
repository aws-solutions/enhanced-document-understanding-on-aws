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
const { getUserIdFromEvent, combineTextractLines, validateInputParams } = require('./search-storage-utils');

/**
 * Uploads documents to Kendra index.
 *
 * @param {String} indexId ID of the Kendra index to upload documents to.
 * @param {String} kendraRoleArn Role ARN to use for uploading documents to Kendra index.
 * @param {Object} casePayload An object containing the payload for the current case.
 * @param {string} requestAccountId S3 Bucket expected owner account id
 * @throws {Error} If batchPutDocument() fails.
 * @returns
 */
exports.uploadToKendraIndex = async (indexId, kendraRoleArn, casePayload, requestAccountId) => {
    validateInputParams(casePayload);
    const userId = getUserIdFromEvent(casePayload);
    const kendra = new AWS.Kendra(UserAgentConfig.customAwsConfig());
    const documentListNested = await this.prepareDocuments(casePayload, userId, requestAccountId);

    for (const documentList of documentListNested) {
        const params = {
            Documents: documentList,
            IndexId: indexId,
            RoleArn: kendraRoleArn
        };

        console.log(`Uploading ${documentList.length} documents to Kendra index: ${indexId}`);

        try {
            const kendraResponse = await kendra.batchPutDocument(params).promise();
            if (kendraResponse.FailedDocuments === undefined) {
                throw new Error(`Something went wrong when uploading to kendra`);
            } else if (kendraResponse.FailedDocuments.length > 0) {
                throw new Error(`Some documents failed: ${JSON.stringify(kendraResponse.FailedDocuments)}`);
            }
        } catch (error) {
            console.error(
                `Failed to upload docs to kendra index: ${indexId}, CaseId: ${casePayload.case.id}. Error: ${error.message}.`
            );
            throw error;
        }
    }
};

/**
 * This function prepares batches of documents. Each batch is a list of up to 10 documents.
 * A list of list of documents is returned.
 *
 * @param {Object} casePayload An object containing the payload for the current case.
 * @param {String} userId User ID used to create ACL for kendra documents.
 * @param {string} requestAccountId S3 Bucket expected owner account id
 * @returns An array of arrays, where each sub-array contains up to 10 documents.
 */
exports.prepareDocuments = async (casePayload, userId, requestAccountId) => {
    //This documentListNested holds a list of DocumentList where each index could have up to 10 documents.
    let documentListNested = [];
    let tmpDocumentList = [];

    const s3Client = new AWS.S3(UserAgentConfig.customAwsConfig());

    for (const documentPayload of casePayload.case.documentList) {
        let documentString;
        try {
            const textractInference = await SharedLib.getInferenceFromS3(
                casePayload.case.id,
                documentPayload.document.id,
                SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT,
                requestAccountId,
                s3Client
            );
            documentString = combineTextractLines(textractInference);
        } catch (error) {
            console.error(
                `Failed to get textract inference for case ${casePayload.case.id}, document ${documentPayload.document.id}, with error ${error}`
            );
            continue;
        }

        const document = {
            Id: documentPayload.document.id,
            Blob: documentString,
            ContentType: 'PLAIN_TEXT',
            AccessControlList: [
                {
                    Access: 'ALLOW',
                    Name: userId,
                    Type: 'USER'
                }
            ],
            Attributes: [
                {
                    Key: `${SharedLib.WorkflowOrchestratorDefaults.KENDRA_ATTRIBUTES.CASE_ID}`,
                    Value: {
                        StringValue: casePayload.case.id
                    }
                },
                {
                    Key: `${SharedLib.WorkflowOrchestratorDefaults.KENDRA_ATTRIBUTES.DOC_ID}`,
                    Value: {
                        StringValue: documentPayload.document.id
                    }
                },
                {
                    Key: `${SharedLib.WorkflowOrchestratorDefaults.KENDRA_ATTRIBUTES.DOC_TYPE}`,
                    Value: {
                        StringValue: documentPayload.document.selfCertifiedDocType
                    }
                },
                {
                    Key: `${SharedLib.WorkflowOrchestratorDefaults.KENDRA_ATTRIBUTES.FILE_NAME}`,
                    Value: {
                        StringValue: documentPayload.document.uploadedFileName
                    }
                },
                {
                    Key: `${SharedLib.WorkflowOrchestratorDefaults.KENDRA_ATTRIBUTES.FILE_TYPE}`,
                    Value: {
                        StringValue: documentPayload.document.uploadedFileExtension
                    }
                }
            ]
        };
        tmpDocumentList.push(document);

        //This condition checks if the the tmpDocumentList has a size of 10 (by default)
        if (tmpDocumentList.length == SharedLib.WorkflowOrchestratorDefaults.KENDRA_MAX_UPLOAD_COUNT) {
            documentListNested.push(tmpDocumentList);
            tmpDocumentList = [];
        }
    }

    //finally checks if there's any remaining tmpDocumentList that were not pushed into documentListNested
    if (tmpDocumentList.length > 0) {
        documentListNested.push(tmpDocumentList);
    }

    return documentListNested;
};
