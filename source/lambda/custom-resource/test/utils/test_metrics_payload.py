#!/usr/bin/env python
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0
from contextlib import nullcontext as does_not_raise
from datetime import datetime, timedelta

import mock
import pytest
from botocore.exceptions import ClientError
from botocore.stub import Stubber
from freezegun import freeze_time
from helper import get_service_client
from utils.constants import PUBLISH_METRICS_HOURS
from utils.metrics_payload import get_metrics_payload, get_metrics_queries

# fmt: off
expected_metric_data_output = {
    "metric1": mock.ANY, "metric2": mock.ANY, "metric3": mock.ANY, "metric4": mock.ANY, "metric5": mock.ANY, "metric6": mock.ANY,
    "metric7": mock.ANY, "metric8": mock.ANY, "metric9": mock.ANY, "metric10": mock.ANY, "metric11": mock.ANY, "metric12": mock.ANY, 
    "metric13": mock.ANY, "metric14": mock.ANY, "metric15": mock.ANY, "metric16": mock.ANY, "metric17": mock.ANY, "metric18": mock.ANY, 
    "metric19": mock.ANY, "metric20": mock.ANY, "metric21": mock.ANY, "metric22": mock.ANY, "metric23": mock.ANY, "metric24": mock.ANY, 
    "metric25": mock.ANY, "metric26": mock.ANY,
}
# fmt: on


@pytest.fixture(scope="function")
def cw_stub():
    cw = get_service_client("cloudwatch")
    with Stubber(cw) as stubber:
        yield stubber
        stubber.assert_no_pending_responses()


def get_metric_data_stubbed(cw_stub, metric_responses):
    metric_queries = get_metrics_queries()
    mock_end_datetime = datetime.timestamp(datetime.now() - timedelta(1))
    mock_start_datetime = datetime.timestamp(datetime.now() - timedelta(PUBLISH_METRICS_HOURS + 1))
    for query in range(len(metric_queries)):
        cw_stub.add_response(
            "get_metric_data",
            expected_params={
                "MetricDataQueries": metric_queries[query],
                "StartTime": mock_start_datetime,
                "EndTime": mock_end_datetime,
            },
            service_response={"MetricDataResults": [metric_responses[query]]},
        )
    return cw_stub


@freeze_time("2000-01-01T00:00:00")
@mock.patch("lambda_ops_metrics.push_builder_metrics", None)
def test_publish_metrics_success(cw_stub, metric_responses):
    with does_not_raise():
        get_metric_data_stubbed(cw_stub, metric_responses)
        cw_stub.activate()
        get_metrics_payload(PUBLISH_METRICS_HOURS) == expected_metric_data_output
        cw_stub.deactivate()


@mock.patch("lambda_ops_metrics.push_builder_metrics", None)
def test_publish_metrics_raises(cw_stub):
    cw_stub.add_client_error("get_metric_data", service_error_code="fake-code", service_message="fake-error")
    cw_stub.activate()
    with pytest.raises(ClientError) as error:
        get_metrics_payload(PUBLISH_METRICS_HOURS)

    assert error.value.args[0] == "An error occurred (fake-code) when calling the GetMetricData operation: fake-error"
