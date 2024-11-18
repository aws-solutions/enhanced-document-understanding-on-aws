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

import json
import os
from test.fixtures.webconfig_events import lambda_event, setup_ssm, setup_workflow_config_ddb_table

import botocore
import mock
import pytest
from helper import get_service_client
from lambda_func import handler
from moto import mock_aws
from operations.webconfig import (
    API_ENDPOINT,
    RESOURCE_PROPERTIES,
    SSM_KEY,
    USER_POOL_CLIENT_ID,
    USER_POOL_ID,
    KENDRA_STACK_DEPLOYED,
    OPEN_SEARCH_STACK_DEPLOYED,
    WORKFLOW_CONFIG_DDB_TABLE_NAME,
    WORKFLOW_CONFIG_NAME,
    create,
    delete,
    execute,
    verify_env_setup,
)


@pytest.mark.parametrize("requestType", ["Create", "Update", "Delete"])
def test_verify_env_setup_success(lambda_event, requestType):
    lambda_event["RequestType"] = requestType
    assert None == verify_env_setup(lambda_event)


def test_env_setup_with_no_ssm_key(monkeypatch, lambda_event):
    with pytest.raises(ValueError):
        monkeypatch.delitem(lambda_event[RESOURCE_PROPERTIES], SSM_KEY)
        verify_env_setup(lambda_event)


@pytest.mark.parametrize("requestType", ["Create", "Update"])
def test_env_setup_with_no_api_endpoint(monkeypatch, lambda_event, requestType):
    lambda_event["RequestType"] = requestType
    with pytest.raises(ValueError):
        monkeypatch.delitem(lambda_event[RESOURCE_PROPERTIES], API_ENDPOINT)
        verify_env_setup(lambda_event)


@pytest.mark.parametrize("requestType", ["Create", "Update"])
def test_env_setup_with_no_usr_pool_id(monkeypatch, lambda_event, requestType):
    lambda_event["RequestType"] = requestType
    with pytest.raises(ValueError):
        monkeypatch.setitem(lambda_event[RESOURCE_PROPERTIES], USER_POOL_ID, "")
        verify_env_setup(lambda_event)


@pytest.mark.parametrize("requestType", ["Create", "Update"])
def test_env_setup_with_no_usr_pool_client_id(monkeypatch, lambda_event, requestType):
    lambda_event["RequestType"] = requestType
    with pytest.raises(ValueError):
        monkeypatch.delitem(lambda_event[RESOURCE_PROPERTIES], USER_POOL_CLIENT_ID)
        verify_env_setup(lambda_event)


@pytest.mark.parametrize("requestType", ["Create", "Update"])
def test_env_setup_with_no_kendra_stack_deployed(monkeypatch, lambda_event, requestType):
    lambda_event["RequestType"] = requestType
    with pytest.raises(ValueError):
        monkeypatch.delitem(lambda_event[RESOURCE_PROPERTIES], KENDRA_STACK_DEPLOYED)
        verify_env_setup(lambda_event)


@pytest.mark.parametrize("requestType", ["Create", "Update"])
def test_env_setup_with_no_open_search_stack_deployed(monkeypatch, lambda_event, requestType):
    lambda_event["RequestType"] = requestType
    with pytest.raises(ValueError):
        monkeypatch.delitem(lambda_event[RESOURCE_PROPERTIES], OPEN_SEARCH_STACK_DEPLOYED)
        verify_env_setup(lambda_event)


@pytest.mark.parametrize("requestType", ["Create", "Update"])
def test_env_setup_with_no_config_ddb_table_name(monkeypatch, lambda_event, requestType):
    lambda_event["RequestType"] = requestType
    with pytest.raises(ValueError):
        monkeypatch.delitem(lambda_event[RESOURCE_PROPERTIES], WORKFLOW_CONFIG_DDB_TABLE_NAME)
        verify_env_setup(lambda_event)


@pytest.mark.parametrize("requestType", ["Create", "Update"])
def test_env_setup_with_no_config_name(monkeypatch, lambda_event, requestType):
    lambda_event["RequestType"] = requestType
    with pytest.raises(ValueError):
        monkeypatch.delitem(lambda_event[RESOURCE_PROPERTIES], WORKFLOW_CONFIG_NAME)
        verify_env_setup(lambda_event)


@mock_aws
def test_create_success(lambda_event, mock_lambda_context, setup_workflow_config_ddb_table):
    create(lambda_event, mock_lambda_context)
    ssm = get_service_client("ssm")
    # fmt: off
    web_config_value = ssm.get_parameter(
        Name=lambda_event[RESOURCE_PROPERTIES][SSM_KEY],
        WithDecryption=True)["Parameter"]["Value"]
    # fmt: on

    assert web_config_value == json.dumps(
        {
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
                    "WorkflowsToProcess": ["textract", "entity-standard", "entity-pii"],
                    "RunTextractAnalyzeAction": True,
                    "NumDocuments": "2",
                },
                {
                    "DocumentType": "loan-information",
                    "FileTypes": [".pdf", ".png", ".jpeg", ".jpg"],
                    "MaxSize": "5",
                    "WorkflowsToProcess": ["textract", "entity-standard", "entity-pii"],
                    "RunTextractAnalyzeAction": True,
                    "NumDocuments": "1",
                },
                {
                    "DocumentType": "driving-license",
                    "FileTypes": [".pdf", ".png", ".jpeg", ".jpg"],
                    "MaxSize": "5",
                    "WorkflowsToProcess": ["textract", "entity-standard", "entity-pii"],
                    "RunTextractAnalyzeAction": True,
                    "NumDocuments": "1",
                },
            ],
            "WorkflowConfigName": "fake-workflow",
        }
    )


@mock_aws
def test_delete_failure(monkeypatch, setup_ssm, mock_lambda_context):
    lambda_event, ssm = setup_ssm
    monkeypatch.setitem(lambda_event[RESOURCE_PROPERTIES], SSM_KEY, "/non-existent/key")
    assert None == delete(lambda_event, mock_lambda_context)


@mock_aws
def test_delete_success(setup_ssm, mock_lambda_context):
    lambda_event, ssm = setup_ssm
    delete(lambda_event, lambda_event)

    parameter_list = ssm.describe_parameters(
        ParameterFilters=[{"Key": "Name", "Values": [lambda_event[RESOURCE_PROPERTIES][SSM_KEY]]}]
    )

    assert len(parameter_list["Parameters"]) == 0


@mock_aws
@pytest.mark.parametrize("requestType", ["Create", "Update"])
def test_execute_create_and_update(lambda_event, mock_lambda_context, requestType, setup_workflow_config_ddb_table):
    lambda_event["RequestType"] = requestType
    with mock.patch("cfn_response.http") as mocked_PoolManager:
        mocked_PoolManager.return_value = {"status": 200}

        if lambda_event["RequestType"] == "Create" or lambda_event["RequestType"] == "Update":
            assert None == execute(lambda_event, mock_lambda_context)
            mocked_PoolManager.request.assert_called_once_with(
                method="PUT",
                url="https://fakeurl/doesnotexist",
                headers={"content-type": "", "content-length": "278"},
                body='{"Status": "SUCCESS", "Reason": "See the details in CloudWatch Log Stream: fake_logstream_name", "PhysicalResourceId": "fake_physical_resource_id", "StackId": "fakeStackId", "RequestId": "fakeRequestId", "LogicalResourceId": "fakeLogicalResourceId", "NoEcho": false, "Data": {}}',
            )


@mock_aws
def test_execute_delete(setup_ssm, mock_lambda_context):
    lambda_event, ssm = setup_ssm
    lambda_event["RequestType"] = "Delete"

    with mock.patch("cfn_response.http") as mocked_PoolManager:
        mocked_PoolManager.return_value = {"status": 200}

        assert None == execute(lambda_event, mock_lambda_context)
        mocked_PoolManager.request.assert_called_once_with(
            method="PUT",
            url="https://fakeurl/doesnotexist",
            headers={"content-type": "", "content-length": "278"},
            body='{"Status": "SUCCESS", "Reason": "See the details in CloudWatch Log Stream: fake_logstream_name", "PhysicalResourceId": "fake_physical_resource_id", "StackId": "fakeStackId", "RequestId": "fakeRequestId", "LogicalResourceId": "fakeLogicalResourceId", "NoEcho": false, "Data": {}}',
        )


@pytest.mark.parametrize("requestType", ["Create", "Update", "Delete"])
def test_execute_failure(monkeypatch, lambda_event, mock_lambda_context, requestType):
    lambda_event["RequestType"] = requestType
    monkeypatch.delitem(lambda_event[RESOURCE_PROPERTIES], SSM_KEY)

    with mock.patch("cfn_response.http") as mocked_PoolManager:
        mocked_PoolManager.return_value = {"status": 200}
        execute(lambda_event, mock_lambda_context)
        mocked_PoolManager.request.assert_called_once_with(
            method="PUT",
            url="https://fakeurl/doesnotexist",
            headers={"content-type": "", "content-length": "435"},
            body='{"Status": "FAILED", "Reason": "Any of SSM_KEY, API_ENDPOINT, USER_POOL_ID, USER_POOL_CLIENT_ID, KENDRA_STACK_DEPLOYED, OPEN_SEARCH_STACK_DEPLOYED, WORKFLOW_CONFIG_DDB_TABLE_NAME, WORKFLOW_CONFIG_NAME has not been passed. Operation cannot be performed", "PhysicalResourceId": "fake_physical_resource_id", "StackId": "fakeStackId", "RequestId": "fakeRequestId", "LogicalResourceId": "fakeLogicalResourceId", "NoEcho": false, "Data": {}}',
        )
