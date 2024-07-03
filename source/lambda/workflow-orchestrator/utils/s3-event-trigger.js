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

const _ = require('lodash');
const ConfigLoader = require('../config/ddb-loader');
const UserAgentConfig = require('aws-node-user-agent-config');
const SharedLib = require('common-node-lib');
const AWS = require('aws-sdk');

const DEFAULT_DOC_PROCESSING_TYPE = 'sync';

const FIVE_MEGABYTES = 5;

let WORKFLOW_CONFIG;

/**
 *
 * @returns
 */
exports.loadConfig = async () => {
    const configName = process.env.WORKFLOW_CONFIG_NAME ?? 'default';
    if (WORKFLOW_CONFIG === undefined) {
        console.log(`Loading workflow config: ${configName}`);
        WORKFLOW_CONFIG = await ConfigLoader.loadWorkflowConfig(configName);
    }
    return WORKFLOW_CONFIG;
};

/**
 * Generates an event to trigger a workflow step function once all docs for
 * a case have been uploaded
 * @param {Object} event S3:PutObject event
 * @returns {false | Object} Returns false if upload is not complete or if s3 upload
 *      event doesn't correspond to initial upload. Otherwise it returns the new event
 *      object for sfn event.
 */
exports.generateSfnEventDetail = async (event) => {
    await this.loadConfig();

    const fileKey = event.detail.object.key;
    const bucket = event.detail.bucket.name;

    const { caseId, documentName } = this.parseFileKey(fileKey);
    const params = {
        caseId: caseId,
        ddbTableName: process.env.CASE_DDB_TABLE_NAME
    };

    const { baseCase, filteredDocRecords } = await this.getCaseFilteredDocumentRecords(caseId);

    const documentNameSplit = documentName.split('.');
    const docId = documentNameSplit[0];
    const docExtension = `.${documentNameSplit[1]}`;
    const getObjectParams = {
        Bucket: bucket,
        Key: fileKey
    };
    const headObject = await SharedLib.getHeadObjectFromS3(getObjectParams);

    // 1MB is equal to 1024 kilobytes which is equal to 1,048,576 (1024 x 1024) bytes
    const totalSizeInMB = headObject.ContentLength / Math.pow(1024, 2);

    if (totalSizeInMB <= FIVE_MEGABYTES) {
        const s3ObjectTags = await SharedLib.getObjectTaggingFromS3(getObjectParams);
        const tagMap = new Map(s3ObjectTags.TagSet.map((tag) => [tag.Key, tag.Value]));
        const fileName = atob(tagMap.get(SharedLib.fileNameBase64EncodedKey).replace(/\s/g, ''));
        console.debug(tagMap);
        const documentInDb = filteredDocRecords.find((record) => record.DOCUMENT_ID === docId) !== undefined;

        if (!documentInDb) {
            const userId = tagMap.get(SharedLib.userIdKey);
            const userDocId = userId.concat(':', docId);
            await this.addDocumentToDb(baseCase, {
                caseId: caseId,
                docId: docId,
                userDocId: userDocId,
                bucketName: bucket,
                filekey: fileKey,
                fileName: fileName,
                documentType: tagMap.get(SharedLib.documentTypeKey),
                fileExtension: docExtension,
                userId: tagMap.get(SharedLib.userIdKey)
            });
        }
        await this.isCaseUploadComplete(params);
    } else {
        throw new Error(`This file: ${fileKey} exceeds the 5MB file size limit and needs to be reduced`);
    }
};

exports.getCaseFilteredDocumentRecords = async (caseId) => {
    const uploadedDocumentRecords = await SharedLib.getCase({
        caseId: caseId,
        ddbTableName: process.env.CASE_DDB_TABLE_NAME
    });

    const baseCase = uploadedDocumentRecords.Items.find(
        (record) => record.DOCUMENT_ID.S === SharedLib.casePlaceholderDocumentId
    );

    // initial record has to be filtered out
    const filteredDocRecords = _.filter(uploadedDocumentRecords.Items, (record) => {
        return record.DOCUMENT_ID.S != SharedLib.casePlaceholderDocumentId;
    });

    return {
        baseCase: baseCase,
        filteredDocRecords: filteredDocRecords
    };
};

/**
 * Checks if the `Object Created` event is associated with a document upload
 * from the user. It compares the fikeKey with the S3_UPLOAD_PREFIX env variable.
 *
 * If this function returns false the lambda returns without any further processing.
 *
 * @param {string} filekey S3 filekey associated with Object created event
 * @returns {boolean}
 */
exports.isInitialUploadEvent = (filekey) => {
    const parsedKey = this.parseFileKey(filekey);

    const receivedS3Prefix = parsedKey.uploadPrefix;
    if (!receivedS3Prefix) {
        console.error(`Unable to parse s3 key: ${filekey}`);
        throw Error('Invalid filekey');
    }
    return receivedS3Prefix === process.env.S3_UPLOAD_PREFIX;
};

/**
 *
 * @param {string} s3FileKey
 * @returns {Object.<string, string>} parsed string object with keys
 *      `[caseId, uploadPrefix, fileName]`
 */
exports.parseFileKey = (s3FileKey) => {
    const parts = s3FileKey.split('/');
    const uploadPrefix = parts.shift();
    const caseId = parts.shift();
    const documentName = parts.shift();
    return {
        caseId: caseId,
        uploadPrefix: uploadPrefix,
        documentName: documentName
    };
};

/**
 * Query DynamoDB to see if all docs required to trigger a workflow has been uploaded.
 * Compares documents uploaded with the required documents as defined in the config.
 *
 * @param {Object} params {caseId: [string], configName: [string]}
 * @param {string} params.caseId
 * @param {string} params.configName
 * @returns {Boolean}
 */
exports.isCaseUploadComplete = async (params) => {
    const workflowConfig = await this.loadConfig();

    const requiredDocTypeMap = new Map();
    for (const requiredDocuments of workflowConfig.MinRequiredDocuments) {
        const numDocuments = parseInt(requiredDocuments.NumDocuments);
        requiredDocTypeMap.set(requiredDocuments.DocumentType.toLowerCase(), numDocuments);
    }

    const { filteredDocRecords } = await this.getCaseFilteredDocumentRecords(params.caseId);
    const uploadedDocTypeMap = new Map();

    filteredDocRecords.forEach((docRecord) => {
        const docType = docRecord['DOCUMENT_TYPE'].S.toLowerCase();
        let docCount = 0;
        if (uploadedDocTypeMap.has(docType)) {
            docCount = parseInt(uploadedDocTypeMap.get(docType));
        }
        uploadedDocTypeMap.set(docType, docCount + 1);
    });

    if (SharedLib.isUploadMissingDocument(uploadedDocTypeMap, requiredDocTypeMap)) {
        console.error('Uploaded document types do not match required document types');
        return false;
    }

    return true;
};

/**
 * Generic method to extract a desired property from the document config list.
 * If property is not found in item it returns 'undefined'.
 *
 * @param {Object[]} docConfigList MinRequiredDocuments list
 * @param {string} property property to extract from each element in list
 * @returns {Object[]}
 */
exports.getPropertyFromDocConfigs = (docConfigList, property) => {
    return _.map(docConfigList, (config) => {
        return config[property];
    });
};

/**
 * Create the document level payload for each document according to the
 * schema for the step function payload. This uses the document configuration
 * defined using the workflow config, along with the document record retrieved
 * from the case database.
 * @param {Object} ddbDocRecord Case record for document retrieved from dynamoDB case table
 * @param {Object} workflowConfig Document config as defined in the workflow config
 * @returns
 */
exports.createDocumentPayload = (ddbDocRecord, workflowConfig) => {
    console.debug(`createDocumentPayload::ddbDocRecord::${JSON.stringify(ddbDocRecord)}`);
    console.debug(`createDocumentPayload::workflowConfig::${JSON.stringify(workflowConfig)}`);

    const recordDocType = ddbDocRecord['DOCUMENT_TYPE'].S;
    const docConfig = _.find(workflowConfig.MinRequiredDocuments, (conf) => {
        return conf['DocumentType'].toLowerCase() === recordDocType.toLowerCase();
    });

    let documentPayload = {
        document: {
            id: ddbDocRecord['DOCUMENT_ID'].S,
            caseId: ddbDocRecord['CASE_ID'].S,
            piiFlag: docConfig.PiiFlag ?? false,
            runTextractAnalyzeAction: docConfig.RunTextractAnalyzeAction ?? false,
            selfCertifiedDocType: ddbDocRecord['DOCUMENT_TYPE'].S,
            processingType: docConfig.ProcessingType ?? DEFAULT_DOC_PROCESSING_TYPE,
            s3Bucket: ddbDocRecord['BUCKET_NAME'].S,
            s3Prefix: ddbDocRecord['S3_KEY'].S,
            documentWorkflow: docConfig.WorkflowsToProcess,
            uploadedFileExtension: ddbDocRecord['UPLOADED_FILE_EXTENSION'].S,
            uploadedFileName: ddbDocRecord['UPLOADED_FILE_NAME'].S
        },
        inferences: {}
    };

    if ('AnalyzeDocFeatureType' in docConfig) {
        documentPayload.document.analyzeDocFeatureType = docConfig['AnalyzeDocFeatureType'];
    }

    return documentPayload;
};

/**
 * Create a documentId and use it along with the file extension to create
 * a s3 file key. Generate a presigned post policy that can be used to upload the document.
 * If successful, then add the document entry into the database.
 * This gets triggered when the lambda receives a request that includes the filename
 * and filetype.
 * @param {Object} baseCase
 * @param {Object} params
 * @param {Object} params.caseId
 * @param {string} params.caseName
 * @param {string} params.fileName
 * @param {string} params.fileExtension
 * @param {string} params.documentType
 * @param {string} params.docId
 * @param {string} params.filekey
 * @param {string} params.userId
 * @param {string} params.userDocId
 * @param {number} params.docCount
 * @param {string} params.bucketName
 *
 * @returns DynamoDB.putItem response
 */
exports.addDocumentToDb = async (baseCase, params, dynamoDB = undefined) => {
    const _dynamoDB = dynamoDB ?? new AWS.DynamoDB(UserAgentConfig.customAwsConfig());
    const caseId = params.caseId;
    const fileName = params.fileName;
    const fileExtension = params.fileExtension;
    const documentType = params.documentType;
    const docId = params.docId;
    const filekey = params.filekey;
    const userId = params.userId;
    const userDocId = params.userDocId;
    const bucketName = params.bucketName;

    const ddbCaseParams = {
        TransactItems: [
            {
                Update: {
                    TableName: process.env.CASE_DDB_TABLE_NAME,
                    Key: {
                        'CASE_ID': {
                            'S': caseId
                        },
                        'DOCUMENT_ID': {
                            'S': SharedLib.casePlaceholderDocumentId
                        }
                    },
                    UpdateExpression: 'ADD DOC_COUNT :change',
                    ExpressionAttributeValues: {
                        ':change': {
                            'N': '1'
                        }
                    },
                    ReturnValuesOnConditionCheckFailure: 'ALL_OLD'
                }
            }
        ]
    };

    const ddbDocumentParams = {
        TableName: process.env.CASE_DDB_TABLE_NAME,
        Item: AWS.DynamoDB.Converter.marshall({
            CASE_ID: caseId,
            CASE_NAME: baseCase.CASE_NAME.S,
            DOCUMENT_ID: docId,
            USER_DOC_ID: userDocId,
            BUCKET_NAME: bucketName,
            S3_KEY: filekey,
            UPLOADED_FILE_NAME: fileName,
            UPLOADED_FILE_EXTENSION: fileExtension,
            DOCUMENT_TYPE: documentType,
            USER_ID: userId,
            CREATION_TIMESTAMP: new Date().toISOString()
        }),
        ReturnValues: 'ALL_OLD'
    };
    try {
        await _dynamoDB.transactWriteItems(ddbCaseParams).promise();
        return await _dynamoDB.putItem(ddbDocumentParams).promise();
    } catch (error) {
        console.error('Error writing record to dynamoDb');
        throw error;
    }
};
