#!/usr/bin/env python
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import json
import os

import pytest
from operations import operation_types
from operations.webconfig import (
    API_ENDPOINT,
    KENDRA_STACK_DEPLOYED,
    RESOURCE,
    RESOURCE_PROPERTIES,
    SSM_KEY,
    USER_POOL_CLIENT_ID,
    USER_POOL_ID,
    KENDRA_STACK_DEPLOYED,
    OPEN_SEARCH_STACK_DEPLOYED,
    PHYSICAL_RESOURCE_ID,
    WORKFLOW_CONFIG_NAME,
    WORKFLOW_CONFIG_DDB_TABLE_NAME,
)


@pytest.fixture
def lambda_event(aws_credentials, custom_resource_event):
    custom_resource_event[RESOURCE_PROPERTIES] = {RESOURCE: operation_types.WEBCONFIG}
    custom_resource_event[RESOURCE_PROPERTIES][SSM_KEY] = "/fake/keypath"
    custom_resource_event[RESOURCE_PROPERTIES][API_ENDPOINT] = "https://non-existent/url/fakeapi"
    custom_resource_event[RESOURCE_PROPERTIES][USER_POOL_CLIENT_ID] = "fakeclientid"
    custom_resource_event[RESOURCE_PROPERTIES][USER_POOL_ID] = "fakepoolid"
    custom_resource_event[RESOURCE_PROPERTIES][KENDRA_STACK_DEPLOYED] = "Yes"
    custom_resource_event[RESOURCE_PROPERTIES][OPEN_SEARCH_STACK_DEPLOYED] = "Yes"
    custom_resource_event[RESOURCE_PROPERTIES][WORKFLOW_CONFIG_DDB_TABLE_NAME] = "fake-ddb-table"
    custom_resource_event[RESOURCE_PROPERTIES][WORKFLOW_CONFIG_NAME] = "fake-workflow"
    custom_resource_event[PHYSICAL_RESOURCE_ID] = "fake_physical_resource_id"

    yield custom_resource_event


@pytest.fixture
def setup_workflow_config_ddb_table(ddb, lambda_event):
    ddb.create_table(
        TableName=lambda_event[RESOURCE_PROPERTIES][WORKFLOW_CONFIG_DDB_TABLE_NAME],
        KeySchema=[{"AttributeName": "Name", "KeyType": "HASH"}],
        AttributeDefinitions=[{"AttributeName": "Name", "AttributeType": "S"}],
        BillingMode="PAY_PER_REQUEST",
    )

    ddb.put_item(
        TableName=lambda_event[RESOURCE_PROPERTIES][WORKFLOW_CONFIG_DDB_TABLE_NAME],
        Item={
            "Name": {"S": lambda_event[RESOURCE_PROPERTIES][WORKFLOW_CONFIG_NAME]},
            "MinRequiredDocuments": {
                "L": [
                    {
                        "M": {
                            "DocumentType": {"S": "paystub"},
                            "FileTypes": {"L": [{"S": ".pdf"}, {"S": ".png"}, {"S": ".jpeg"}, {"S": ".jpg"}]},
                            "MaxSize": {"S": "5"},
                            "WorkflowsToProcess": {
                                "L": [{"S": "textract"}, {"S": "entity-standard"}, {"S": "entity-pii"}]
                            },
                            "RunTextractAnalyzeAction": {"BOOL": True},
                            "NumDocuments": {"S": "2"},
                        }
                    },
                    {
                        "M": {
                            "DocumentType": {"S": "loan-information"},
                            "FileTypes": {"L": [{"S": ".pdf"}, {"S": ".png"}, {"S": ".jpeg"}, {"S": ".jpg"}]},
                            "MaxSize": {"S": "5"},
                            "WorkflowsToProcess": {
                                "L": [{"S": "textract"}, {"S": "entity-standard"}, {"S": "entity-pii"}]
                            },
                            "RunTextractAnalyzeAction": {"BOOL": True},
                            "NumDocuments": {"S": "1"},
                        }
                    },
                    {
                        "M": {
                            "DocumentType": {"S": "driving-license"},
                            "FileTypes": {"L": [{"S": ".pdf"}, {"S": ".png"}, {"S": ".jpeg"}, {"S": ".jpg"}]},
                            "MaxSize": {"S": "5"},
                            "WorkflowsToProcess": {
                                "L": [{"S": "textract"}, {"S": "entity-standard"}, {"S": "entity-pii"}]
                            },
                            "RunTextractAnalyzeAction": {"BOOL": True},
                            "NumDocuments": {"S": "1"},
                        }
                    },
                ]
            },
        },
    )

    yield ddb


@pytest.fixture
def setup_ssm(ssm, lambda_event, setup_workflow_config_ddb_table):
    ddb = setup_workflow_config_ddb_table
    ssm_key = lambda_event[RESOURCE_PROPERTIES][SSM_KEY]
    ssm.put_parameter(
        Name=ssm_key,
        Value=json.dumps(
            {
                "ApiEndpoint": lambda_event[RESOURCE_PROPERTIES][API_ENDPOINT],
                "UserPoolId": lambda_event[RESOURCE_PROPERTIES][USER_POOL_ID],
                "UserPoolClientId": lambda_event[RESOURCE_PROPERTIES][USER_POOL_CLIENT_ID],
                "KendraStackDeployed": lambda_event[RESOURCE_PROPERTIES][KENDRA_STACK_DEPLOYED],
                "OpenSearchStackDeployed": lambda_event[RESOURCE_PROPERTIES][OPEN_SEARCH_STACK_DEPLOYED],
                "AwsRegion": os.environ["AWS_REGION"],
                "RequiredDocs": [
                    {
                        "DocumentType": "paystub",
                        "FileTypes": [".pdf", ".png", ".jpeg", ".jpg"],
                        "MaxSize": "5",
                        "WorkflowsToProcess": ["textract", "entity-standard" "entity-pii"],
                        "RunTextractAnalyzeAction": True,
                        "NumDocuments": "2",
                    },
                    {
                        "DocumentType": "loan-information",
                        "FileTypes": [".pdf", ".png", ".jpeg", ".jpg"],
                        "MaxSize": "5",
                        "WorkflowsToProcess": ["textract", "entity-standard" "entity-pii"],
                        "RunTextractAnalyzeAction": True,
                        "NumDocuments": "2",
                    },
                    {
                        "DocumentType": "driving-license",
                        "FileTypes": [".pdf", ".png", ".jpeg", ".jpg"],
                        "MaxSize": "5",
                        "WorkflowsToProcess": ["textract", "entity-standard" "entity-pii"],
                        "RunTextractAnalyzeAction": True,
                        "NumDocuments": "2",
                    },
                ],
                "WorkflowConfigName": lambda_event[RESOURCE_PROPERTIES][WORKFLOW_CONFIG_NAME],
            }
        ),
        Type="SecureString",
    )

    # fmt: off
    assert ssm.get_parameter(
        Name=lambda_event[RESOURCE_PROPERTIES][SSM_KEY],
        WithDecryption=True)["Parameter"]["Value"] == json.dumps({
            "ApiEndpoint": "https://non-existent/url/fakeapi",
            "UserPoolId": "fakepoolid",
            "UserPoolClientId": "fakeclientid",
            "KendraStackDeployed": "Yes",
            "OpenSearchStackDeployed": "Yes",
            "AwsRegion": "us-east-1",
            "RequiredDocs": [
                {
                    "DocumentType": "paystub",
                    "FileTypes": [".pdf", ".png", ".jpeg", ".jpg"],
                    "MaxSize": "5",
                    "WorkflowsToProcess": ["textract", "entity-standard" "entity-pii"],
                    "RunTextractAnalyzeAction": True,
                    "NumDocuments": "2",
                },
                {
                    "DocumentType": "loan-information",
                    "FileTypes": [".pdf", ".png", ".jpeg", ".jpg"],
                    "MaxSize": "5",
                    "WorkflowsToProcess": ["textract", "entity-standard" "entity-pii"],
                    "RunTextractAnalyzeAction": True,
                    "NumDocuments": "2",
                },
                {
                    "DocumentType": "driving-license",
                    "FileTypes": [".pdf", ".png", ".jpeg", ".jpg"],
                    "MaxSize": "5",
                    "WorkflowsToProcess": ["textract", "entity-standard" "entity-pii"],
                    "RunTextractAnalyzeAction": True,
                    "NumDocuments": "2",
                },
            ],
            "WorkflowConfigName": lambda_event[RESOURCE_PROPERTIES][WORKFLOW_CONFIG_NAME],
        })
    # fmt: on

    yield lambda_event, ssm
