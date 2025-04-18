#!/usr/bin/env python
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import os
import random
from datetime import datetime

import boto3
import pytest
from aws_lambda_powertools import Metrics
from aws_lambda_powertools.metrics import metrics as metrics_global
from custom_config import custom_usr_agent_config
from moto import mock_aws


@pytest.fixture(autouse=True)
def aws_credentials():
    """Mocked AWS Credentials and general environment variables as required by python based lambda functions"""
    os.environ["AWS_ACCESS_KEY_ID"] = "fakeId"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "fakeAccessKey"  # nosec B105
    os.environ["AWS_REGION"] = "us-east-1"  # must be a valid region
    os.environ["AWS_SDK_USER_AGENT"] = '{ "user_agent_extra": "AwsSolution/SO000/v0.0.0" }'
    os.environ["POWERTOOLS_SERVICE_NAME"] = "test-custom-resource"


@pytest.fixture
def s3():
    with mock_aws():
        yield boto3.resource("s3", config=custom_usr_agent_config())


@pytest.fixture
def ddb():
    with mock_aws():
        yield boto3.client("dynamodb", config=custom_usr_agent_config())


@pytest.fixture
def cw_logs():
    with mock_aws():
        yield boto3.client("logs", config=custom_usr_agent_config())


@pytest.fixture
def ssm():
    with mock_aws():
        yield boto3.client("ssm", config=custom_usr_agent_config())


@pytest.fixture
def custom_resource_event():
    """This event object mocks values that the lambda event object contains when invoked as a CloudFormation custom resource"""
    return {
        "StackId": "fakeStackId",
        "RequestId": "fakeRequestId",
        "ResponseURL": "https://fakeurl/doesnotexist",
        "LogicalResourceId": "fakeLogicalResourceId",
    }


@pytest.fixture
def mock_lambda_context():
    """Create a mock LambdaContext object that can be passed to a lambda function invocation"""

    class FakeLambdaContext(object):
        def __init__(self):
            self.log_stream_name = "fake_logstream_name"
            self.aws_request_id = "fake_request_id"
            self.invoked_function_arn = "arn:aws:lambda:us-us-east-1:123456789012:function:fakefunctionarn"
            self.client_context = None
            self.log_group_name = "/aws/lambda/fakefunctionloggroupname"
            self.function_name = "fakefunctionname"
            self.function_version = "$LATEST"
            self.identity = "fakeIdentity"
            self.memory_limit_in_mb = "128"

    return FakeLambdaContext()


@pytest.fixture(scope="function", autouse=True)
def reset_metric_set():
    """Clear out every metric data prior to every test"""
    metrics = Metrics()
    metrics.clear_metrics()
    metrics_global.is_cold_start = True  # ensure each test has cold start
    metrics.clear_default_dimensions()  # remove persisted default dimensions, if any
    yield


@pytest.fixture(scope="function", autouse=True)
def metric_responses():
    metric_responses = []
    for metric in range(1, 30):
        metric_responses.append(
            {"Id": "metric" + str(metric), "Timestamps": [datetime.now()], "Values": [random.randint(0, 50)]}
        )

    yield metric_responses
