#!/usr/bin/env python
######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#                                                                                                                    #
#  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    #
#  with the License. A copy of the License is located at                                                             #
#                                                                                                                    #
#      http://www.apache.org/licenses/LICENSE-2.0                                                                    #
#                                                                                                                    #
#  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES #
#  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    #
#  and limitations under the License.                                                                                #
######################################################################################################################
from enum import Enum


class MetricNames(str, Enum):
    CASE_PROCESSED_STATUS = "CaseProcessedStatus"
    DOCUMENTS = "DocumentCount"
    FILE_TYPES = "FileExtensionTypes"
    TEXTRACT = "TextractWorkflow"
    REDACTION = "RedactionWorkflow"
    COMPREHEND = "ComprehendWorkflow"
    REST_ENDPOINT_LATENCY = "Count"
    COGNITO_SIGN_IN_SUCCESSES = "SignInSuccesses"
    KENDRA_QUERIES = "IndexQueryCount"
    KENDRA_DOCUMENTS = "IndexDocumentCount"


class CloudWatchNamespace(str, Enum):
    API_GATEWAY = r"AWS/ApiGateway"
    COGNITO = r"AWS/Cognito"
    DOCUMENTS = "Documents"
    WORKFLOW_TYPES = "Workflows"
    CASE = "Case"
    FILE_TYPES = "FileTypes"
    KENDRA = "AWS/Kendra"


CaseStatus = {"INITIATE": "initiate", "IN_PROCESS": "in-process", "FAILURE": "failure", "SUCCESS": "success"}

TextractAPIs = {
    "TEXTRACT_ANALYZE_DOCUMENT_SYNC": "Textract-AnalyzeDocumentSync",
    "TEXTRACT_ANALYZE_ID_SYNC": "Textract-AnalyzeIDSync",
    "TEXTRACT_ANALYZE_EXPENSE_SYNC": "Textract-AnalyzeExpenseSync",
    "TEXTRACT_DETECT_TEXT_SYNC": "Textract-DetectTextSync",
    "TEXTRACT_SYNC_FAILURES": "Textract-FailuresSync",
}

ComprehendAPIs = {
    "COMPREHEND_DETECT_ENTITIES_SYNC": "Comprehend-DetectEntitiesSync",
    "COMPREHEND_DETECT_PII_SYNC": "Comprehend-DetectPIISync",
    "COMPREHEND_DETECT_MEDICAL_SYNC": "Comprehend-DetectMedicalEntitiesSync",
    "COMPREHEND_DETECT_SNOWMED_SYNC": "Comprehend-DetectSnowMedSync",
    "COMPREHEND_DETECT_ICD10_SYNC": "Comprehend-DetectICD10Sync",
    "COMPREHEND_SYNC_FAILURES": "Comprehend-FailuresSync",
}

RedactionAPIs = {
    "REDACT_DOCUMENT": "RedactDocument",
    "REDACTION_FAILURES": "Redaction-Failures",
}


SupportedFileTypes = {"PDF": "pdf", "JPG_JPEG": "jpeg/jpg", "PNG": "png"}

METRICS_ENDPOINT = "https://metrics.awssolutionsbuilder.com/generic"
PUBLISH_METRICS_TIME_PERIOD = 180
PUBLISH_METRICS_HOURS = 1  # Equivalent to the runtime schedule defined by ANONYMOUS_METRICS_SCHEDULE

STACK_UUID_ENV_VAR = "UUID"
KENDRA_INDEX_ID_ENV_VAR = "KENDRA_INDEX_ID"
REST_API_NAME_ENV_VAR = "REST_API_ID"
USER_POOL_ID_ENV_VAR = "USER_POOL_ID"
