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

import io
import json
import os
import zipfile
from pathlib import Path, PosixPath
from test.fixtures.copy_template_events import lambda_event, setup_email_templates
from uuid import UUID

import botocore
import mock
import pytest
from lambda_func import handler
from operations.copy_email_templates import (
    DESTINATION_BUCKET_NAME,
    DESTINATION_PREFIX,
    PHYSICAL_RESOURCE_ID,
    RESOURCE,
    RESOURCE_PROPERTIES,
    SOURCE_BUCKET_NAME,
    SOURCE_PREFIX,
    create,
    execute,
    verify_env_setup,
)
from utils.lambda_context_parser import get_invocation_account_id


@pytest.mark.parametrize("requestType", ["Create", "Update", "Delete"])
def test_verify_env_setup_success(lambda_event, requestType):
    lambda_event["RequestType"] = requestType
    assert None == verify_env_setup(lambda_event)


def test_evn_setup_with_resource_props_wrong_value(monkeypatch, lambda_event):
    with pytest.raises(ValueError):
        monkeypatch.setitem(lambda_event, RESOURCE_PROPERTIES, value={RESOURCE: "NOT_COPY_TEMPLATE"})
        verify_env_setup(lambda_event)


def test_evn_setup_with_resource_props_empty(monkeypatch, lambda_event):
    with pytest.raises(KeyError):
        monkeypatch.setitem(lambda_event, RESOURCE_PROPERTIES, value={})
        verify_env_setup(lambda_event)


@pytest.mark.parametrize("requestType", ["Create", "Update", "Delete"])
def test_evn_with_missing_source_bucket(monkeypatch, lambda_event, requestType):
    lambda_event["RequestType"] = requestType
    with pytest.raises(ValueError):
        monkeypatch.delitem(lambda_event[RESOURCE_PROPERTIES], DESTINATION_BUCKET_NAME)
        verify_env_setup(lambda_event)


def test_evn_with_missing_destination_bucket(monkeypatch, lambda_event):
    with pytest.raises(ValueError):
        monkeypatch.delitem(lambda_event[RESOURCE_PROPERTIES], DESTINATION_BUCKET_NAME)
        verify_env_setup(lambda_event)


@pytest.mark.parametrize("requestType", ["Create", "Update", "Delete"])
def test_evn_with_source_bucket_str_empty(monkeypatch, lambda_event, requestType):
    lambda_event["RequestType"] = requestType
    with pytest.raises(ValueError):
        monkeypatch.setitem(lambda_event[RESOURCE_PROPERTIES], DESTINATION_BUCKET_NAME, "")
        verify_env_setup(lambda_event)


def test_env_with_destination_bucket_str_empty(monkeypatch, lambda_event):
    with pytest.raises(ValueError):
        monkeypatch.setitem(lambda_event[RESOURCE_PROPERTIES], DESTINATION_BUCKET_NAME, "")
        verify_env_setup(lambda_event)


def test_env_with_destination_bucket_str_empty(monkeypatch, lambda_event):
    with pytest.raises(ValueError):
        monkeypatch.setitem(lambda_event[RESOURCE_PROPERTIES], DESTINATION_PREFIX, "")
        verify_env_setup(lambda_event)


def verify_bucket_contents(s3, bucket_name, prefix):
    bucket = s3.Bucket(bucket_name)
    s3_objects = bucket.objects.filter(Prefix=f"{prefix}")
    assert 1 == len(list(s3_objects))

    with pytest.raises(botocore.exceptions.ClientError):
        s3.Object(bucket_name, f"{prefix}/non_existing.email-template.zip").load()


def test_setup_template_fixture(setup_email_templates):
    lambda_event, s3 = setup_email_templates
    source_bucket_name = lambda_event[RESOURCE_PROPERTIES][SOURCE_BUCKET_NAME]
    source_prefix = lambda_event[RESOURCE_PROPERTIES][SOURCE_PREFIX]
    verify_bucket_contents(s3, source_bucket_name, source_prefix)


@pytest.mark.parametrize("requestType", ["Create", "Update", "Delete"])
def test_execute_call_success(setup_email_templates, mock_lambda_context, requestType):
    lambda_event, s3_resource = setup_email_templates
    lambda_event["RequestType"] = requestType

    with mock.patch("cfn_response.http") as mocked_PoolManager:
        mocked_PoolManager.return_value = {"status": 200}
        assert None == execute(lambda_event, mock_lambda_context)
        mocked_PoolManager.request.assert_called_once_with(
            method="PUT",
            url="https://fakeurl/doesnotexist",
            headers={"content-type": "", "content-length": "278"},
            body='{"Status": "SUCCESS", "Reason": "See the details in CloudWatch Log Stream: fake_logstream_name", "PhysicalResourceId": "fake_physical_resource_id", "StackId": "fakeStackId", "RequestId": "fakeRequestId", "LogicalResourceId": "fakeLogicalResourceId", "NoEcho": false, "Data": {}}',
        )

    destination_bucket = s3_resource.Bucket(lambda_event[RESOURCE_PROPERTIES][DESTINATION_BUCKET_NAME])
    file_list = destination_bucket.objects.filter(Prefix=f"{lambda_event[RESOURCE_PROPERTIES][DESTINATION_PREFIX]}/")

    if requestType == "Create" or requestType == "Update":
        assetZipObject = s3_resource.Object(
            bucket_name=lambda_event[RESOURCE_PROPERTIES][SOURCE_BUCKET_NAME],
            key=f"{lambda_event[RESOURCE_PROPERTIES][SOURCE_PREFIX]}",
        )
        buffer = io.BytesIO(assetZipObject.get()["Body"].read())
        zip_archive = zipfile.ZipFile(buffer)
        assert len(list(zip_archive.namelist())) == len(list(file_list))

    if requestType == "Delete":
        assert len(list(file_list)) == 0


@pytest.mark.parametrize("requestType", ["Create", "Update", "Delete"])
def test_execute_call_success_with_generated_physical_resource_id(
    setup_email_templates, mock_lambda_context, requestType
):
    lambda_event, s3_resource = setup_email_templates
    lambda_event["RequestType"] = requestType
    del lambda_event[PHYSICAL_RESOURCE_ID]

    with mock.patch("cfn_response.http") as mocked_PoolManager:
        with mock.patch("uuid.uuid4") as mocked_uuid:
            mocked_uuid.return_value = UUID("12345678123456781234567812345678")
            mocked_PoolManager.return_value = {"status": 200}
            assert None == execute(lambda_event, mock_lambda_context)
            mocked_PoolManager.request.assert_called_once_with(
                method="PUT",
                url="https://fakeurl/doesnotexist",
                headers={"content-type": "", "content-length": "261"},
                body='{"Status": "SUCCESS", "Reason": "See the details in CloudWatch Log Stream: fake_logstream_name", "PhysicalResourceId": "12345678", "StackId": "fakeStackId", "RequestId": "fakeRequestId", "LogicalResourceId": "fakeLogicalResourceId", "NoEcho": false, "Data": {}}',
            )

    destination_bucket = s3_resource.Bucket(lambda_event[RESOURCE_PROPERTIES][DESTINATION_BUCKET_NAME])
    file_list = destination_bucket.objects.filter(Prefix=f"{lambda_event[RESOURCE_PROPERTIES][DESTINATION_PREFIX]}/")

    if requestType == "Create" or requestType == "Update":
        assetZipObject = s3_resource.Object(
            bucket_name=lambda_event[RESOURCE_PROPERTIES][SOURCE_BUCKET_NAME],
            key=f"{lambda_event[RESOURCE_PROPERTIES][SOURCE_PREFIX]}",
        )
        buffer = io.BytesIO(assetZipObject.get()["Body"].read())
        zip_archive = zipfile.ZipFile(buffer)
        assert len(list(zip_archive.namelist())) == len(list(file_list))

    if requestType == "Delete":
        assert len(list(file_list)) == 0


@pytest.mark.parametrize("requestType", ["Create", "Update"])
def test_execute_call_with_bad_archive(tmp_path, setup_email_templates, mock_lambda_context, requestType):
    lambda_event, s3_resource = setup_email_templates
    lambda_event["RequestType"] = requestType
    destination_bucket_name = lambda_event[RESOURCE_PROPERTIES][DESTINATION_BUCKET_NAME]
    source_bucket_name = lambda_event[RESOURCE_PROPERTIES][SOURCE_BUCKET_NAME]
    source_prefix = lambda_event[RESOURCE_PROPERTIES][SOURCE_PREFIX]
    destination_prefix = lambda_event[RESOURCE_PROPERTIES][DESTINATION_PREFIX]
    mock_acc_id = get_invocation_account_id(mock_lambda_context)

    tmp_dir = tmp_path / "bad_zip"
    tmp_dir.mkdir()
    bad_zip_file = tmp_dir / "fake_bad_zip.zip"
    bad_zip_file.write_text("This is a fake bad zip file")
    assert len(list(tmp_path.iterdir())) == 1

    s3_resource.meta.client.upload_file(str(bad_zip_file), source_bucket_name, source_prefix)
    assert len(list(s3_resource.Bucket(source_bucket_name).objects.all())) == 1
    with pytest.raises(zipfile.error):
        create(
            s3_resource,
            source_bucket_name,
            source_prefix,
            destination_bucket_name,
            destination_prefix,
            mock_acc_id,
        )


@pytest.mark.parametrize("requestType", ["Create", "Update"])
def test_execute_call_with_wrong_source_bucket(monkeypatch, setup_email_templates, mock_lambda_context, requestType):
    lambda_event, _ = setup_email_templates
    lambda_event["RequestType"] = requestType
    monkeypatch.setitem(lambda_event[RESOURCE_PROPERTIES], SOURCE_BUCKET_NAME, "non-existing-bucket")

    with mock.patch("cfn_response.http") as mocked_PoolManager:
        mocked_PoolManager.return_value = {"status": 200}

        execute(lambda_event, mock_lambda_context)

        mocked_PoolManager.request.assert_called_once_with(
            method="PUT",
            url="https://fakeurl/doesnotexist",
            headers={"content-type": "", "content-length": "322"},
            body='{"Status": "FAILED", "Reason": "An error occurred (NoSuchBucket) when calling the GetObject operation: The specified bucket does not exist", "PhysicalResourceId": "fake_physical_resource_id", "StackId": "fakeStackId", "RequestId": "fakeRequestId", "LogicalResourceId": "fakeLogicalResourceId", "NoEcho": false, "Data": {}}',
        )


@pytest.mark.parametrize("requestType", ["Create", "Update", "Delete"])
def test_execute_call_with_wrong_destination_bucket(
    monkeypatch, setup_email_templates, mock_lambda_context, requestType
):
    lambda_event, _ = setup_email_templates
    lambda_event["RequestType"] = requestType
    monkeypatch.setitem(lambda_event[RESOURCE_PROPERTIES], DESTINATION_BUCKET_NAME, "non-existing-bucket")

    with mock.patch("cfn_response.http") as mocked_PoolManager:
        mocked_PoolManager.return_value = {"status": 200}
        execute(lambda_event, mock_lambda_context)

        if requestType == "Create" or requestType == "Update":
            mocked_PoolManager.request.assert_called_once_with(
                method="PUT",
                url="https://fakeurl/doesnotexist",
                headers={"content-type": "", "content-length": "331"},
                body='{"Status": "FAILED", "Reason": "An error occurred (NoSuchBucket) when calling the ListObjectVersions operation: The specified bucket does not exist", "PhysicalResourceId": "fake_physical_resource_id", "StackId": "fakeStackId", "RequestId": "fakeRequestId", "LogicalResourceId": "fakeLogicalResourceId", "NoEcho": false, "Data": {}}',
            )
        elif requestType == "Delete":
            mocked_PoolManager.request.assert_called_once_with(
                method="PUT",
                url="https://fakeurl/doesnotexist",
                headers={"content-type": "", "content-length": "331"},
                body='{"Status": "FAILED", "Reason": "An error occurred (NoSuchBucket) when calling the ListObjectVersions operation: The specified bucket does not exist", "PhysicalResourceId": "fake_physical_resource_id", "StackId": "fakeStackId", "RequestId": "fakeRequestId", "LogicalResourceId": "fakeLogicalResourceId", "NoEcho": false, "Data": {}}',
            )


@pytest.mark.parametrize("requestType", ["Create", "Update", "Delete"])
def test_lambda_handler(setup_email_templates, mock_lambda_context, requestType):
    lambda_event, s3_resource = setup_email_templates
    lambda_event["RequestType"] = requestType

    with mock.patch("cfn_response.http") as mocked_PoolManager:
        mocked_PoolManager.return_value = {"status": 200}
        assert None == handler(lambda_event, mock_lambda_context)
        mocked_PoolManager.request.assert_called_once_with(
            method="PUT",
            url="https://fakeurl/doesnotexist",
            headers={"content-type": "", "content-length": "278"},
            body='{"Status": "SUCCESS", "Reason": "See the details in CloudWatch Log Stream: fake_logstream_name", "PhysicalResourceId": "fake_physical_resource_id", "StackId": "fakeStackId", "RequestId": "fakeRequestId", "LogicalResourceId": "fakeLogicalResourceId", "NoEcho": false, "Data": {}}',
        )
