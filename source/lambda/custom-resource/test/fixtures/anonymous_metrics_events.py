#!/usr/bin/env python
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import os
from copy import copy

import pytest
from operations import operation_types
from operations.operation_types import RESOURCE, RESOURCE_PROPERTIES, PHYSICAL_RESOURCE_ID


@pytest.fixture
def lambda_events(aws_credentials, custom_resource_event):
    events_list = []
    payloads = [
        {
            RESOURCE: operation_types.ANONYMOUS_METRIC,
            "SolutionId": "SO0999",
            "Version": "v9.9.9",
            "ServiceToken": "arn:aws:lambda:us-east-1:123456789012:function:fakefunction:1",
            "DeployKendraIndex": "Yes",
            "WorkflowConfigName": "default",
        },
        {
            RESOURCE: operation_types.ANONYMOUS_METRIC,
            "SolutionId": "SO0999",
            "Version": "v9.9.9",
            "ServiceToken": "arn:aws:lambda:us-east-1:123456789012:function:fakefunction:1",
            "DeployKendraIndex": "No",
            "WorkflowConfigName": "default",
        },
        {
            RESOURCE: operation_types.ANONYMOUS_METRIC,
            "SolutionId": "SO0999",
            "Version": "v9.9.9",
            "ServiceToken": "arn:aws:lambda:us-east-1:123456789012:function:fakefunction:1",
        },
    ]
    custom_resource_event[PHYSICAL_RESOURCE_ID] = "fake_physical_resource_id"

    for payload_item in payloads:
        custom_resource_event[RESOURCE_PROPERTIES] = payload_item
        events_list.append(copy(custom_resource_event))

    yield events_list
