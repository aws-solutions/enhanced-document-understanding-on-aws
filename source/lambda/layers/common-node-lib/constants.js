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

exports.WorkflowStageNames = {
    TEXTRACT: 'textract',
    ENTITY: 'entity-standard',
    PII: 'entity-pii',
    MEDICAL_ENTITY: 'entity-medical',
    REDACTION: 'redaction'
};

exports.WorkflowStatus = {
    INITIATE: 'initiate',
    PENDING: 'pending',
    SUCCESS: 'success',
    FAILURE: 'failure',
    COMPLETE: 'complete'
};

exports.WorkflowType = {
    SYNC_ONLY: 'sync',
    ASYNC_ONLY: 'async',
    SYNC_ASYNC: 'sync-async'
};

exports.WorkflowEventDetailTypes = {
    PROCESSING_FAILURE: 'processing_failure',
    PROCESSING_COMPLETE: 'processing_complete',
    TRIGGER_WORKFLOW: 'trigger_workflow_processing_event'
};

exports.EventSources = {
    WORKFLOW_ORCHESTRATOR: 'workflow-orchestrator',
    WORKFLOW_STEPFUNCTION: 'workflow-stepfunction'
};

exports.inferenceAttributePrefix = 'inference';

// Entries in the case table for cases (not documents) will have this placeholder id
exports.casePlaceholderDocumentId = '0000';

exports.caseStatusDdbAttributeName = 'STATUS';

exports.fileNameBase64EncodedKey = 'fileNameBase64Encoded'
exports.documentTypeKey ='documentType' 
exports.userIdKey = 'userId'


exports.InferenceTypes = {
    TEXTRACT_ANALYZE_EXPENSE: 'textract-analyzeExpense',
    TEXTRACT_ANALYZE_DOCUMENT: 'textract-analyzeDoc',
    TEXTRACT_ANALYZE_ID: 'textract-analyzeId',
    TEXTRACT_DETECT_TEXT: 'textract-detectText',
    ENTITY: exports.WorkflowStageNames.ENTITY,
    PII: exports.WorkflowStageNames.PII,
    MEDICAL_ENTITY: exports.WorkflowStageNames.MEDICAL_ENTITY
};

// for textract sync
exports.TextractBlockTypes = {
    PAGE: 'PAGE',
    LINE: 'LINE',
    WORD: 'WORD'
};

exports.TextractDefaults = {
    ANALYZE_DOC_FEATURE_TYPES: { TABLES: 'TABLES', FORMS: 'FORMS', SIGNATURES: 'SIGNATURES' },
    PDF_PAGE_LIMIT: 15
};

// for cloudWatch Metrics
exports.CloudwatchNamespace = {
    API_GATEWAY: 'AWS/ApiGateway',
    COGNITO: 'AWS/Cognito',
    DOCUMENTS: 'Documents',
    WORKFLOW_TYPES: 'Workflows',
    CASE: 'Case',
    FILE_TYPES: 'FileTypes',
    KENDRA: 'AWS/Kendra'
};

exports.MetricNames = {
    DOCUMENTS: 'DocumentCount',
    CASE_PROCESSED_STATUS: 'CaseProcessedStatus',
    FILE_TYPES: 'FileExtensionTypes',
    TEXTRACT: 'TextractWorkflow',
    REDACTION: 'RedactionWorkflow',
    COMPREHEND: 'ComprehendWorkflow',
    REST_ENDPOINT_LATENCY: 'Count',
    COGNITO_SIGN_IN_SUCCESSES: 'SignInSuccesses',
    KENDRA_QUERIES: 'IndexQueryCount',
    KENDRA_DOCUMENTS: 'IndexDocumentCount',
};

exports.CaseStatus = {
    INITIATE: 'initiate', // case created, but not yet processed
    IN_PROCESS: 'in-process', // first workflow of the case was triggered
    FAILURE: 'failure', // case failed processing
    SUCCESS: 'success' // case processed successfully
};

exports.SupportedFileTypes = {
    PDF: 'pdf',
    JPEG: 'jpeg',
    JPG: 'jpg',
    PNG: 'png'
};

exports.TextractAPIs = {
    TEXTRACT_ANALYZE_DOCUMENT_SYNC: 'Textract-AnalyzeDocumentSync',
    TEXTRACT_ANALYZE_ID_SYNC: 'Textract-AnalyzeIDSync',
    TEXTRACT_ANALYZE_EXPENSE_SYNC: 'Textract-AnalyzeExpenseSync',
    TEXTRACT_DETECT_TEXT_SYNC: 'Textract-DetectTextSync',
    TEXTRACT_SYNC_FAILURES: 'Textract-FailuresSync'
};

exports.ComprehendAPIs = {
    COMPREHEND_DETECT_ENTITIES_SYNC: 'Comprehend-DetectEntitiesSync',
    COMPREHEND_DETECT_PII_SYNC: 'Comprehend-DetectPIISync',
    COMPREHEND_DETECT_MEDICAL_SYNC: 'Comprehend-DetectMedicalEntitiesSync',
    COMPREHEND_DETECT_SNOWMED_SYNC: 'Comprehend-DetectSnowMedSync',
    COMPREHEND_DETECT_ICD10_SYNC: 'Comprehend-DetectICD10Sync',
    COMPREHEND_SYNC_FAILURES: 'Comprehend-FailuresSync'
};

exports.WorkflowOrchestratorDefaults = {
    KENDRA_MAX_UPLOAD_COUNT: 10,
    KENDRA_ATTRIBUTES: {
        CASE_ID: 'case_id',
        DOC_ID: 'doc_id',
        DOC_TYPE: 'doc_type',
        FILE_NAME: 'file_name',
        FILE_TYPE: 'file_type'
    }
};

exports.DEFAULT_DOC_PROCESSING_TYPE = 'sync';

exports.RedactionDefaults = {
    REDACTED_FILE_SUFFIX: '-redacted'
};
