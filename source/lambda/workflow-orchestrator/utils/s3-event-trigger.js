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
const SharedLib = require('common-node-lib');

const DEFAULT_DOC_PROCESSING_TYPE = 'sync';

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
    if (!this.isInitialUploadEvent(fileKey)) {
        return false;
    }

    const caseId = this.parseFileKey(fileKey).caseId;
    const params = {
        caseId: caseId,
        ddbTableName: process.env.CASE_DDB_TABLE_NAME
    };

    const isComplete = await this.isCaseUploadComplete(params);
    if (!isComplete) {
        console.debug(`Required document upload incomplete for case:${caseId}`);
        return false;
    }

    try {
        const stepFunctionEvent = this.createEventForStepFunction(params);
        return stepFunctionEvent;
    } catch (error) {
        console.error(error);
        throw error;
    }
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
    const fileName = parts.shift();
    return {
        caseId: caseId,
        uploadPrefix: uploadPrefix,
        fileName: fileName
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

    const uploadedDocumentRecords = await SharedLib.getCase({
        caseId: params.caseId,
        ddbTableName: process.env.CASE_DDB_TABLE_NAME
    });
    console.debug(`uploadedDocumentRecords: ${JSON.stringify(uploadedDocumentRecords)}`);

    // initial record has to be filtered out
    const filteredDocRecords = _.filter(uploadedDocumentRecords.Items, (record) => {
        return record.DOCUMENT_ID.S != SharedLib.casePlaceholderDocumentId;
    });

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
 * Retrieves the records for a caseId for which all required documents have been
 * uploaded and builds the payload required to trigger a step function workflow.
 * @param {Object} params
 * @param {string} params.caseId
 *
 * @returns {Object}
 */
exports.createEventForStepFunction = async (params) => {
    const caseRecords = await SharedLib.getCase({
        caseId: params.caseId,
        ddbTableName: process.env.CASE_DDB_TABLE_NAME
    });
    console.debug(`createEventForSfn::caseRecords: ${JSON.stringify(caseRecords)}`);

    const workflowConfig = await this.loadConfig();
    const workflowsRequiredForCase = workflowConfig.WorkflowSequence;
    const initialWorkflow = workflowsRequiredForCase[0].toLowerCase().replace('workflow', '');

    const documentListPayload = [];
    caseRecords.Items.forEach(async (record) => {
        if (record.DOCUMENT_ID.S != SharedLib.casePlaceholderDocumentId) {
            const docPayload = this.createDocumentPayload(record, workflowConfig);
            documentListPayload.push(docPayload);
        }
    });

    const caseEventPayload = {
        id: params.caseId,
        status: SharedLib.WorkflowStatus.INITIATE,
        stage: initialWorkflow,
        workflows: workflowsRequiredForCase,
        documentList: documentListPayload
    };
    const stepFunctionEvent = { case: caseEventPayload };
    return stepFunctionEvent;
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
