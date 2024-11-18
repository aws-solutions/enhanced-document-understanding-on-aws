#!/usr/bin/env node
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

import * as lambda from 'aws-cdk-lib/aws-lambda';

export const ANONYMOUS_METRICS_SCHEDULE = 'rate(1 hour)'; // runs every 1 hour
export const KENDRA_INDEX_ID_ENV_VAR = 'KENDRA_INDEX_ID';
export const STACK_UUID_ENV_VAR = 'UUID';
export const REST_API_NAME_ENV_VAR = 'REST_API_NAME';
export const USER_POOL_ID_ENV_VAR = 'USER_POOL_ID';

export enum WorkflowType {
    SYNC_ONLY = 'sync',
    ASYNC_ONLY = 'async',
    SYNC_ASYNC = 'sync-async'
}

export enum WorkflowStatus {
    INITIATE = 'initiate',
    PENDING = 'pending',
    SUCCESS = 'success',
    FAILURE = 'failure',
    COMPLETE = 'complete'
}

export enum CaseStatus {
    INITIATE = 'initiate',
    IN_PROCESS = 'in-process',
    FAILURE = 'failure',
    SUCCESS = 'success'
}

export enum WorkflowStageNames {
    TEXTRACT = 'textract',
    ENTITY = 'entity-standard',
    PII = 'entity-pii',
    MEDICAL_ENTITY = 'entity-medical',
    REDACTION = 'redaction'
}

export enum WorkflowEventDetailTypes {
    TRIGGER_WORKFLOW = 'trigger_workflow_processing_event',
    PROCESSING_FAILURE = 'processing_failure',
    PROCESSING_COMPLETE = 'processing_complete'
}

export enum EventSources {
    WORKFLOW_ORCHESTRATOR = 'workflow-orchestrator',
    WORKFLOW_STEPFUNCTION = 'workflow-stepfunction'
}

export enum WorkflowAPIs {
    COMPREHEND_DETECT_ENTITIES_SYNC = 'Comprehend-DetectEntitiesSync',
    COMPREHEND_DETECT_PII_SYNC = 'Comprehend-DetectPIISync',
    COMPREHEND_DETECT_MEDICAL_SYNC = 'Comprehend-DetectMedicalEntitiesSync',
    COMPREHEND_DETECT_SNOWMED_SYNC = 'Comprehend-DetectSnowMedSync',
    COMPREHEND_DETECT_ICD10_SYNC = 'Comprehend-DetectICD10Sync',
    COMPREHEND_SYNC_FAILURES = 'Comprehend-FailuresSync',
    TEXTRACT_ANALYZE_DOCUMENT_SYNC = 'Textract-AnalyzeDocumentSync',
    TEXTRACT_ANALYZE_ID_SYNC = 'Textract-AnalyzeIDSync',
    TEXTRACT_ANALYZE_EXPENSE_SYNC = 'Textract-AnalyzeExpenseSync',
    TEXTRACT_DETECT_TEXT_SYNC = 'Textract-DetectTextSync',
    TEXTRACT_SYNC_FAILURES = 'Textract-FailuresSync',
    REDACT_DOCUMENT = 'RedactDocument',
    REDACTION_FAILURES = 'Redaction-Failures'
}

export enum MetricNames {
    CASE_PROCESSED_STATUS = 'CaseProcessedStatus',
    DOCUMENTS = 'DocumentCount',
    FILE_TYPES = 'FileExtensionTypes',
    TEXTRACT = 'TextractWorkflow',
    REDACTION = 'RedactionWorkflow',
    COMPREHEND = 'ComprehendWorkflow',
    REST_ENDPOINT_LATENCY = 'Count',
    COGNITO_SIGN_IN_SUCCESSES = 'SignInSuccesses',
    KENDRA_QUERIES = 'IndexQueryCount',
    KENDRA_DOCUMENTS = 'IndexDocumentCount',
    INGESTION_DOC_ERRORS = 'IngestionDocumentErrors',
    SEARCH_REQ_RATE = 'SearchRequestRate',
    INGESTION_REQ_RATE = 'IngestionRequestRate',
    INGESTION_DATA_RATE = 'IngestionDataRate',
    ACTIVE_COLLECTION = 'ActiveCollection'
}

export enum CloudwatchNamespace {
    API_GATEWAY = 'AWS/ApiGateway',
    COGNITO = 'AWS/Cognito',
    AOSS = 'AWS/AOSS',
    DOCUMENTS = 'Documents',
    WORKFLOW_TYPES = 'Workflows',
    CASE = 'Case',
    FILE_TYPES = 'FileTypes',
    KENDRA = 'AWS/Kendra'
}

export enum SupportedFileTypes {
    PDF = 'pdf',
    JPG_JPEG = 'jpeg/jpg',
    PNG = 'png'
}

export const PLACEHOLDER_EMAIL = 'placeholder@example.com';
export const DEFAULT_WORKFLOW_CONFIG_NAME = 'default';

export const SFN_TASK_TIMEOUT_MINS = 120;
export const LAMBDA_TIMEOUT_MINS = 15;
export const COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME: lambda.Runtime = lambda.Runtime.NODEJS_20_X;
export const GOV_CLOUD_REGION_LAMBDA_NODE_RUNTIME: lambda.Runtime = lambda.Runtime.NODEJS_18_X;
export const COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME: lambda.Runtime = lambda.Runtime.PYTHON_3_12;
export const GOV_CLOUD_REGION_LAMBDA_PYTHON_RUNTIME: lambda.Runtime = lambda.Runtime.PYTHON_3_11;
export const COMMERCIAL_REGION_LAMBDA_JAVA_RUNTIME: lambda.Runtime = lambda.Runtime.JAVA_21;
export const GOV_CLOUD_REGION_LAMBDA_JAVA_RUNTIME: lambda.Runtime = lambda.Runtime.JAVA_17;

export const S3_UPLOAD_PREFIX = 'initial';
export const S3_REDACTED_PREFIX = 'redacted';
export const S3_MULTI_PAGE_PDF_PREFIX = 'multi-page-pdf';
export const JAVA_LAMBDA_MEMORY = 1024;

export enum KendraAttributes {
    CASE_ID = 'case_id',
    DOC_ID = 'doc_id',
    DOC_TYPE = 'doc_type',
    FILE_NAME = 'file_name',
    FILE_TYPE = 'file_type'
}
