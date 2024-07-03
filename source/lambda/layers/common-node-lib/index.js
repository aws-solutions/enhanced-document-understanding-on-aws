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

const { sendTaskSuccess, sendTaskFailure, sendTaskHeartbeat } = require('./stepfunctions/task-notify');
const { pullRecordsFromSQS, checkSQSEnvSetup } = require('./sqs/sqs-poller');
const { uploadDocsToS3, checkS3EnvSetup } = require('./s3/s3-upload');
const { getAccountIdFromEvent, getAccountIdFromLambdaContext } = require('./s3/get-request-account-id');
const {
    uploadCaseInferences,
    uploadDocumentInferences,
    uploadInference,
    getInferenceFromS3
} = require('./s3/s3-inferences');
const { getObjectTaggingFromS3 } = require('./s3/s3-get-tags')
const { getHeadObjectFromS3 } = require('./s3/s3-get-head-object')
const { updateInferences, updateInference, updateCaseStatus, getInferencePrefixes } = require('./ddb/ddb-case-update');
const { getCase } = require('./ddb/ddb-get-case');
const { AossProxy } = require('./aoss/aoss-proxy');
const { processRecordsSync } = require('./batch-job/initiate-job');
const { formatError } = require('./response-formatter/error-response');
const { formatResponse } = require('./response-formatter/success-response');
const { downloadObjectFromS3 } = require('./s3/s3-download');
const { CloudWatchMetrics, CloudWatchContext } = require('./metrics/cloudwatch');
const { publishEvent } = require('./event-bridge/event-dispatcher');
const {
    casePlaceholderDocumentId,
    CaseStatus,
    caseStatusDdbAttributeName,
    CloudwatchNamespace,
    ComprehendAPIs,
    EventSources,
    inferenceAttributePrefix,
    InferenceTypes,
    MetricNames,
    PDF_PAGE_LIMIT,
    RedactionDefaults,
    SupportedFileTypes,
    TextractAPIs,
    TextractBlockTypes,
    TextractDefaults,
    WorkflowEventDetailTypes,
    WorkflowOrchestratorDefaults,
    WorkflowStageNames,
    WorkflowStatus,
    WorkflowType,
    userIdKey,
    documentTypeKey,
    fileNameBase64EncodedKey,
    DEFAULT_DOC_PROCESSING_TYPE
} = require('./constants');
const PdfLib = require('pdf-lib');
const { getUserIdFromEvent, getCognitoEntityFromAuthToken } = require('./cognito/decode-jwt-token');
const { isUploadMissingDocument } = require('./utils/compare-maps');
const { validateUserToCaseAssociation } = require('./utils/validate-case-access');

module.exports = {
    AossProxy,
    casePlaceholderDocumentId,
    CaseStatus,
    caseStatusDdbAttributeName,
    checkS3EnvSetup,
    checkSQSEnvSetup,
    CloudWatchContext,
    CloudWatchMetrics,
    CloudwatchNamespace,
    ComprehendAPIs,
    DEFAULT_DOC_PROCESSING_TYPE,
    documentTypeKey,
    downloadObjectFromS3,
    EventSources,
    fileNameBase64EncodedKey,
    formatError,
    formatResponse,
    getAccountIdFromEvent,
    getAccountIdFromLambdaContext,
    getCase,
    getCognitoEntityFromAuthToken,
    getInferenceFromS3,
    getInferencePrefixes,
    getObjectTaggingFromS3,
    getUserIdFromEvent,
    inferenceAttributePrefix,
    InferenceTypes,
    isUploadMissingDocument,
    MetricNames,
    PDF_PAGE_LIMIT,
    PdfLib,
    processRecordsSync,
    publishEvent,
    pullRecordsFromSQS,
    RedactionDefaults,
    sendTaskFailure,
    sendTaskHeartbeat,
    sendTaskSuccess,
    SupportedFileTypes,
    TextractAPIs,
    TextractBlockTypes,
    TextractDefaults,
    updateCaseStatus,
    updateInference,
    updateInferences,
    uploadCaseInferences,
    uploadDocsToS3,
    uploadDocumentInferences,
    uploadInference,
    userIdKey,
    validateUserToCaseAssociation,
    WorkflowEventDetailTypes,
    WorkflowOrchestratorDefaults,
    WorkflowStageNames,
    WorkflowStatus,
    WorkflowType,
    getHeadObjectFromS3
};
