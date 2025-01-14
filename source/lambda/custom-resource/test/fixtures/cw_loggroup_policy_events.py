#!/usr/bin/env python
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import os

import pytest
from operations import operation_types
from operations.operation_types import RESOURCE, RESOURCE_PROPERTIES, PHYSICAL_RESOURCE_ID


@pytest.fixture
def lambda_event(aws_credentials, custom_resource_event):
    custom_resource_event[RESOURCE_PROPERTIES] = {
        RESOURCE: operation_types.CW_LOGGROUP_POLICY,
        "ServiceToken": "arn:aws:lambda:us-east-1:123456789012:function:fakefunction:1",
        "CWLOG_ARN": "arn:aws:logs:us-east-1:123456789012:log-group:/fake-loggroup-ABC1234:*",
        "CWLOG_NAME": "fake-loggroup-ABC1234",
        "SERVICE_PRINCIPAL": "es.amazonaws.com",
    }
    custom_resource_event[PHYSICAL_RESOURCE_ID] = "fake_physical_resource_id"

    yield custom_resource_event
