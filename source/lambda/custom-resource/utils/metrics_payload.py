#!/usr/bin/env python
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import datetime
import os
from datetime import datetime, timedelta

from helper import get_service_client
from utils.constants import (
    KENDRA_INDEX_ID_ENV_VAR,
    PUBLISH_METRICS_HOURS,
    REST_API_NAME_ENV_VAR,
    STACK_UUID_ENV_VAR,
    USER_POOL_ID_ENV_VAR,
    CaseStatus,
    CloudWatchNamespace,
    ComprehendAPIs,
    MetricNames,
    RedactionAPIs,
    SupportedFileTypes,
    TextractAPIs,
)


def get_metrics_queries():
    STACK_UUID = os.getenv(STACK_UUID_ENV_VAR)
    if STACK_UUID:
        METRICS_SERVICE_NAME = f"eDUS-{STACK_UUID}"
    else:
        METRICS_SERVICE_NAME = None
    KENDRA_INDEX_ID = os.getenv(KENDRA_INDEX_ID_ENV_VAR)
    USER_POOL_ID = os.getenv(USER_POOL_ID_ENV_VAR)
    REST_API_NAME = os.getenv(REST_API_NAME_ENV_VAR)

    api_queries = [
        [
            {
                "Id": "documentUploads",
                "Expression": f"SELECT COUNT({MetricNames.DOCUMENTS.value}) FROM SCHEMA({CloudWatchNamespace.DOCUMENTS.value}, Documents,serviceName) WHERE Documents = 'Upload' AND serviceName = '{METRICS_SERVICE_NAME}'",
                "Period": PUBLISH_METRICS_HOURS,
            }
        ]
    ]

    for api_key in TextractAPIs:
        api_queries.append(
            [
                {
                    "Id": f"textract{TextractAPIs[api_key].capitalize()}".replace("-", ""),
                    "Expression": f"""SELECT COUNT({MetricNames.TEXTRACT.value}) FROM SCHEMA({CloudWatchNamespace.WORKFLOW_TYPES.value},TextractAPI,serviceName) WHERE TextractAPI = '{TextractAPIs[api_key]}' AND serviceName = '{METRICS_SERVICE_NAME}'""",
                    "Period": PUBLISH_METRICS_HOURS,
                }
            ]
        )

    for api_key in ComprehendAPIs:
        api_queries.append(
            [
                {
                    "Id": f"comprehend{ComprehendAPIs[api_key].capitalize()}".replace("-", ""),
                    "Expression": f"""SELECT COUNT({MetricNames.COMPREHEND.value}) FROM SCHEMA({CloudWatchNamespace.WORKFLOW_TYPES.value},ComprehendAPI,serviceName) WHERE ComprehendAPI = '{ComprehendAPIs[api_key]}' AND serviceName = '{METRICS_SERVICE_NAME}'""",
                    "Period": PUBLISH_METRICS_HOURS,
                }
            ]
        )

    for api_key in RedactionAPIs:
        api_queries.append(
            [
                {
                    "Id": f"redaction{RedactionAPIs[api_key].capitalize()}".replace("-", ""),
                    "Expression": f"""SELECT COUNT({MetricNames.REDACTION.value}) FROM SCHEMA({CloudWatchNamespace.WORKFLOW_TYPES.value},RedactionAPI,serviceName) WHERE RedactionAPI = '{RedactionAPIs[api_key]}' AND serviceName = '{METRICS_SERVICE_NAME}'""",
                    "Period": PUBLISH_METRICS_HOURS,
                }
            ]
        )

    for file_type in SupportedFileTypes:
        api_queries.append(
            [
                {
                    "Id": f"supportedFileTypes{SupportedFileTypes[file_type].capitalize()}".replace("/", ""),
                    "Expression": f"""SELECT COUNT({MetricNames.FILE_TYPES.value}) FROM SCHEMA({CloudWatchNamespace.FILE_TYPES.value}, FileTypesUploaded, serviceName) WHERE FileTypesUploaded = '{SupportedFileTypes[file_type]}' AND serviceName = '{METRICS_SERVICE_NAME}'""",
                    "Period": PUBLISH_METRICS_HOURS,
                }
            ]
        )

    for case in CaseStatus:
        api_queries.append(
            [
                {
                    "Id": f"caseStatus{CaseStatus[case].capitalize()}".replace("-", ""),
                    "Expression": f"""SELECT COUNT({MetricNames.CASE_PROCESSED_STATUS.value}) FROM SCHEMA("{CloudWatchNamespace.CASE.value}", CaseStatus, serviceName) WHERE CaseStatus = '{CaseStatus[case]}' AND serviceName = '{METRICS_SERVICE_NAME}'""",
                    "Period": PUBLISH_METRICS_HOURS,
                },
            ]
        )

    required_queries = [
        [
            {
                "Id": "maxEndpointLatency",
                "Expression": f"""SELECT MAX("{MetricNames.REST_ENDPOINT_LATENCY.value}") FROM SCHEMA("{CloudWatchNamespace.API_GATEWAY.value}", ApiName) WHERE ApiName = '{REST_API_NAME}'""",
                "Period": PUBLISH_METRICS_HOURS,
            }
        ],
        [
            {
                "Id": "avgEndpointLatency",
                "Expression": f"""SELECT AVG("{MetricNames.REST_ENDPOINT_LATENCY.value}") FROM SCHEMA("{CloudWatchNamespace.API_GATEWAY.value}", ApiName) WHERE ApiName = '{REST_API_NAME}'""",
                "Period": PUBLISH_METRICS_HOURS,
            }
        ],
        [
            {
                "Id": "cognitoSignInSuccesses",
                "Expression": f"""SELECT COUNT({MetricNames.COGNITO_SIGN_IN_SUCCESSES.value}) FROM "{CloudWatchNamespace.COGNITO}" WHERE UserPool = '{USER_POOL_ID}'""",
                "Period": PUBLISH_METRICS_HOURS,
            }
        ],
        [
            {
                "Id": "avgCognitoSignIns",
                "Expression": f"""SELECT AVG({MetricNames.COGNITO_SIGN_IN_SUCCESSES.value}) FROM "{CloudWatchNamespace.COGNITO}" WHERE UserPool = '{USER_POOL_ID}'""",
                "Period": PUBLISH_METRICS_HOURS,
            }
        ],
    ]

    optional_kendra_queries = [
        [
            {
                "Id": f"kendra{MetricNames.KENDRA_QUERIES.value}",
                "Expression": f"""SELECT COUNT({MetricNames.KENDRA_QUERIES.value}) FROM SCHEMA("{CloudWatchNamespace.KENDRA.value}", IndexId) WHERE IndexId = '{KENDRA_INDEX_ID}'""",
                "Period": PUBLISH_METRICS_HOURS,
            }
        ],
        [
            {
                "Id": f"kendra{MetricNames.KENDRA_DOCUMENTS.value}",
                "Expression": f"""SELECT COUNT({MetricNames.KENDRA_DOCUMENTS.value}) FROM SCHEMA("{CloudWatchNamespace.KENDRA.value}", IndexId) WHERE IndexId = '{KENDRA_INDEX_ID}'""",
                "Period": PUBLISH_METRICS_HOURS,
            }
        ],
    ]

    queries = []
    queries += required_queries
    queries += api_queries if METRICS_SERVICE_NAME else []
    queries += optional_kendra_queries if KENDRA_INDEX_ID else []

    return queries


def get_metrics_payload(hours=PUBLISH_METRICS_HOURS):
    today = datetime.today().replace(minute=0, second=0, microsecond=0)
    # fetch metrics from (hours-1) to (T-1) hours as CW metrics can be slow to trickle in
    start_time = datetime.timestamp(today - timedelta(hours + 1))
    today_timestamp = datetime.timestamp(today - timedelta(1))
    metric_data_queries = get_metrics_queries()

    cloudwatch_client = get_service_client("cloudwatch")
    metric_data = {}

    # fmt: off
    for query in metric_data_queries:
        cloudwatch_response = cloudwatch_client.get_metric_data(
            MetricDataQueries=query,
            StartTime=start_time,
            EndTime=today_timestamp,
        )["MetricDataResults"][0]
        metric_data[cloudwatch_response["Id"]] = cloudwatch_response["Values"][0] if cloudwatch_response["Values"] else 0
    # fmt: on

    return metric_data
