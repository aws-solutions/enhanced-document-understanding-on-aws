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

import os
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

import pytest
from operations import operation_types
from operations.copy_email_templates import (
    DESTINATION_BUCKET_NAME,
    DESTINATION_PREFIX,
    SOURCE_BUCKET_NAME,
    SOURCE_PREFIX,
)
from operations.operation_types import PHYSICAL_RESOURCE_ID, RESOURCE, RESOURCE_PROPERTIES


@pytest.fixture
def lambda_event(aws_credentials, custom_resource_event):
    custom_resource_event[RESOURCE_PROPERTIES] = {RESOURCE: operation_types.COPY_TEMPLATE}
    custom_resource_event[RESOURCE_PROPERTIES][SOURCE_BUCKET_NAME] = "fake_source_bucket"
    custom_resource_event[RESOURCE_PROPERTIES][SOURCE_PREFIX] = "email-templates.zip"
    custom_resource_event[RESOURCE_PROPERTIES][DESTINATION_BUCKET_NAME] = "fake_destination_bucket"
    custom_resource_event[RESOURCE_PROPERTIES][DESTINATION_PREFIX] = "email-templates"
    custom_resource_event[PHYSICAL_RESOURCE_ID] = "fake_physical_resource_id"
    yield custom_resource_event


@pytest.fixture
def setup_email_templates(tmp_path, s3, lambda_event):
    destination_bucket_name = lambda_event[RESOURCE_PROPERTIES][DESTINATION_BUCKET_NAME]
    source_bucket_name = lambda_event[RESOURCE_PROPERTIES][SOURCE_BUCKET_NAME]
    source_prefix = lambda_event[RESOURCE_PROPERTIES][SOURCE_PREFIX]

    s3.create_bucket(Bucket=source_bucket_name)
    local_dir = Path(__file__).absolute().parents[4] / "email-templates"
    assert len(list(local_dir.glob("*"))) > 0

    with ZipFile(str(tmp_path / source_prefix), "w", ZIP_DEFLATED) as assert_archive:
        for folder_name, subfolders, filnames in os.walk(local_dir):
            filnames = filter(lambda file: file.endswith(".template"), filnames)
            for filename in filnames:
                file_path = str(local_dir / filename)
                assert_archive.write(file_path, arcname=os.path.relpath(file_path, local_dir))
    assert_archive.close()

    s3.meta.client.upload_file(
        str(tmp_path / source_prefix),
        source_bucket_name,
        f"{source_prefix}",
    )

    s3.create_bucket(Bucket=destination_bucket_name)
    os.remove(str(tmp_path / source_prefix))
    yield lambda_event, s3
