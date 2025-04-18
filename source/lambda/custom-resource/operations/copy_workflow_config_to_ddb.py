#!/usr/bin/env python
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0


import json
import uuid

import botocore
from aws_lambda_powertools import Logger, Tracer
from cfn_response import send_response
from helper import get_service_resource
from operations import operation_types
from operations.operation_types import (
    FAILED,
    PHYSICAL_RESOURCE_ID,
    RESOURCE,
    RESOURCE_PROPERTIES,
    SOURCE_BUCKET_NAME,
    SOURCE_PREFIX,
    SUCCESS,
)
from operations.shared import get_zip_archive

logger = Logger(utc=True)
tracer = Tracer()

DDB_TABLE_NAME = "DDB_TABLE_NAME"
CONFIG_FILE_NAME = "CONFIG_FILE_NAME"


@tracer.capture_method
def verify_env_setup(event):
    """This method verifies if all the necessary properties are correctly set in the event object as received by the
    lambda function's handler. The parameters required include, 'SOURCE_BUCKET_NAME', 'SOURCE_PREFIX', 'DDB_TABLE_NAME'.

    Args:
        event (LambdaEvent): An event received by the lambda function that is passed by AWS services when invoking the function's handler

    Raises:
        ValueError: If any of the properties in the custom resource properties are not set correctly or are not available
    """
    if event[RESOURCE_PROPERTIES][RESOURCE] != operation_types.COPY_WORKFLOW_CONFIG:
        err_msg = f"Operation type not available or did not match from the request. Expecting operation type to be {operation_types.COPY_WORKFLOW_CONFIG}"
        logger.error(f"{err_msg}. Here are the resource properties received {json.dumps(event[RESOURCE_PROPERTIES])}")
        raise ValueError(err_msg)

    if (
        event[RESOURCE_PROPERTIES].get(SOURCE_BUCKET_NAME, None) in ["", None]
        or event[RESOURCE_PROPERTIES].get(SOURCE_PREFIX, None) in ["", None]
        or event[RESOURCE_PROPERTIES].get(DDB_TABLE_NAME, None) in ["", None]
    ):
        err_msg = f"Either {SOURCE_BUCKET_NAME} or {SOURCE_PREFIX} or {DDB_TABLE_NAME} or has not been passed. Hence operation cannot be performed"
        logger.error(f"{err_msg}. Here are the resource properties received {json.dumps(event[RESOURCE_PROPERTIES])}")
        raise ValueError(err_msg)


@tracer.capture_method
def create(source_bucket_name, source_prefix, ddb_table_name):
    """This method implements the operations to be executed on a 'Create' CloudFormation event. This method loads the json file and
    inserts it into the dynamodb table. This operation supports only 1 JSON object (workflow configuration) per file. The zip archive
    can contain multiple JSON files each with containing a single configuration unique 'Name' across all the files. Here
    'Name' is the 'Hash' key for Dynamodb and should be unique. In case of conflicting  'Name's the data may get
    overwritten with the last written configuration to Dynamodb.

    Args:
        source_bucket_name (str): Bucket name which contains the asset archive with workflow config files
        source_prefix (str): The prefix under the source bucket which corresponds to the archive for workflow config files
        ddb_table_name (str): The dynamodb table where the config files should stored

    Raises
        botocore.exceptions.ClientError: Failures related to Dynamodb write operations
    """
    s3_resource = get_service_resource("s3")

    ddb_resource = get_service_resource("dynamodb")
    config_table = ddb_resource.Table(ddb_table_name)

    zip_archive = get_zip_archive(s3_resource, source_bucket_name, source_prefix)
    for filename in zip_archive.namelist():
        config_json = json.loads(zip_archive.open(filename).read())
        try:
            config_table.put_item(Item=config_json)
        except botocore.exceptions.ClientError as error:
            logger.error(f"Error occurred when writing to dynamodb, error is {error}")
            raise error
    logger.debug("Copy to Dynamodb table complete")


@tracer.capture_method
def execute(event, context):
    """This method provides implementation to copy data to dynamodb from a JSON configuration. This configuration of workflows is
    to be stored in dynamodb

    Args:
        event (LambdaEvent): An event object received by the lambda function that is passed by AWS services when invoking the function's handler
        context (LambdaContext): A context object received by the lambda function that is passed by AWS services when invoking the function's handler

    Raises:
        Exception: Any failures during the execution of this method
    """
    physical_resource_id = None

    try:
        physical_resource_id = event.get(PHYSICAL_RESOURCE_ID, uuid.uuid4().hex[:8])

        if event["RequestType"] == "Create" or event["RequestType"] == "Update":
            verify_env_setup(event)

            source_bucket_name = event[RESOURCE_PROPERTIES][SOURCE_BUCKET_NAME]
            source_prefix = event[RESOURCE_PROPERTIES][SOURCE_PREFIX]
            ddb_table_name = event[RESOURCE_PROPERTIES][DDB_TABLE_NAME]
            create(source_bucket_name, source_prefix, ddb_table_name)
        elif event["RequestType"] == "Delete":
            logger.warning("The data in the dynamodb table will not be deleted when the stack is deleted")

        send_response(event, context, SUCCESS, {}, physical_resource_id)
    except Exception as ex:
        logger.error(f"Error occurred when copying configuration to dynamodb table, Error is {ex}")
        send_response(event, context, FAILED, {}, physical_resource_id=physical_resource_id, reason=str(ex))
