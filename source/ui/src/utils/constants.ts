// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export const API_NAME = 'api';

export const COMPREHEND_SERVICE = 'COMPREHEND';
export const COMPREHEND_MEDICAL_SERVICE = 'COMPREHEND_MEDICAL';
export const TEXTRACT_RAW_TEXT = 'TEXTRACT_RAW_TEXT';
export const TEXTRACT_KEY_VALUE_PAIRS = 'TEXTRACT_KEY_VALUE_PAIRS';
export const TEXTRACT_TABLES = 'TEXTRACT_TABLES';
export const MIN_SEARCH_QUERY_LENGTH = 1;
export const CASE_PLACEHOLDER_DOCUMENT_ID = '0000';
export const MIN_CASE_NAME_LENGTH = 3;
export const MAX_CASE_NAME_LENGTH = 50;
export const PREVIEW_REDACTION_ON = 'PREVIEW_REDACTION_ON';
export const ENTITIES = 'entities';
export const MAX_UPLOAD_FILE_SIZE = 5000000;

export const EntityTypes = {
    ENTITY_STANDARD: 'entity-standard',
    PII: 'entity-pii',
    MEDICAL_ENTITY: 'entity-medical'
};

export enum InferenceName  {
    TEXTRACT_DETECT_TEXT= 'textract-detectText',
    TEXTRACT_ANALYZE_TEXT= 'textract-analyzeDoc',
    COMPREHEND_GENERIC= 'entity-standard-locations',
    COMPREHEND_PII= 'entity-pii-locations',
    COMPREHEND_MEDICAL= 'entity-medical-locations'
};

export const FacetDocumentAttributeKey = {
    'file_type': 'File type',
    'doc_type': 'Document type'
};

/**
 * Maps case status from backend to a friendly string for display
 */
export const CaseStatusDisplayTextMapping: Record<string, string> = {
    'initiate': 'Created',
    'in-process': 'Processing',
    'failure': 'Failed',
    'success': 'Complete'
};

export const DISPLAY_DATE_FORMAT = 'DD-MMM-YYYY, hh:mm:ss A';
