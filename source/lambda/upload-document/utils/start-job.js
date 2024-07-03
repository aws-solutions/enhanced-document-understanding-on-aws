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

const SharedLib = require('common-node-lib');
const { loadWorkflowConfig } = require('../config/ddb-loader');
const _ = require('lodash');

/**
 * Retrieves the records for a caseId for which all required documents have been
 * uploaded and builds the payload required to trigger a step function workflow.
 * @param {Object} params
 * @param {string} params.caseId
 *
 * @returns {Object}
 */
const createEventForStepFunction = async (params) => {
    const caseRecords = await SharedLib.getCase({
        caseId: params.caseId,
        ddbTableName: process.env.CASE_DDB_TABLE_NAME
    });
    console.debug(`createEventForSfn::caseRecords: ${JSON.stringify(caseRecords)}`);

    const workflowConfig = await loadWorkflowConfig(process.env.WORKFLOW_CONFIG_NAME);
    const workflowsRequiredForCase = workflowConfig.WorkflowSequence;
    const initialWorkflow = workflowsRequiredForCase[0].toLowerCase().replace('workflow', '');

    const documentListPayload = [];
    caseRecords.Items.forEach(async (record) => {
        if (record.DOCUMENT_ID.S != SharedLib.casePlaceholderDocumentId) {
            const docPayload = createDocumentPayload(record, workflowConfig);
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
const createDocumentPayload = (ddbDocRecord, workflowConfig) => {
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
            processingType: docConfig.ProcessingType ?? SharedLib.DEFAULT_DOC_PROCESSING_TYPE,
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

module.exports = {
    createEventForStepFunction,
    createDocumentPayload
}