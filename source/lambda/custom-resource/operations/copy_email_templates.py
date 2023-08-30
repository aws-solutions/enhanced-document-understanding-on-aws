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
    PHYSICAL_RESOURCE_ID,
)
from operations.shared import get_zip_archive
from utils.lambda_context_parser import get_invocation_account_id

DESTINATION_BUCKET_NAME = "DESTINATION_BUCKET_NAME"
DESTINATION_PREFIX = "DESTINATION_PREFIX"


TMP = "/tmp"  # NOSONAR (python:S5443) using lambda's fs storage /tmp # nosec B108


logger = Logger(utc=True)
tracer = Tracer()


@tracer.capture_method
def verify_env_setup(event):
    """This method verifies if all the necessary properties are correctly set in the event object as received by the lambda function's handler

    Args:
        event (LambdaEvent): An event received by the lambda function that is passed by AWS services when invoking the function's handler

    Raises:
        ValueError: If any of the properties in the custom resource properties are not set correctly or are not available
    """
    if event[RESOURCE_PROPERTIES][RESOURCE] != operation_types.COPY_TEMPLATE:
        err_msg = f"Operation type not available or did not match from the request. Expecting operation type to be {operation_types.COPY_TEMPLATE}"
        logger.error(f"{err_msg}. Here are the resource properties received {json.dumps(event[RESOURCE_PROPERTIES])}")
        raise ValueError(err_msg)

    if (
        event[RESOURCE_PROPERTIES].get(DESTINATION_BUCKET_NAME, None) in ["", None]
        or event[RESOURCE_PROPERTIES].get(DESTINATION_PREFIX, None) in ["", None]
    ) or (
        event["RequestType"] != "Delete"
        and (
            event[RESOURCE_PROPERTIES].get(SOURCE_BUCKET_NAME, None) in ["", None]
            or event[RESOURCE_PROPERTIES].get(SOURCE_PREFIX, None) in ["", None]
        )
    ):
        err_msg = f"Either {SOURCE_BUCKET_NAME} or {SOURCE_PREFIX} or {DESTINATION_BUCKET_NAME} or {DESTINATION_PREFIX} has not been passed. Hence operation cannot be performed"
        logger.error(f"{err_msg}. Here are the resource properties received {json.dumps(event[RESOURCE_PROPERTIES])}")
        raise ValueError(err_msg)


@tracer.capture_method
def delete(s3_resource, destination_bucket_name, destination_prefix):
    """This method implements the operations to be performed when a `delete` event is received by a AWS CloudFormation custom resource. This method
    requires delete permissions on the destination bucket. All objects including any versions of the templates will be deleted from the destination
    bucket.

    Args:
        s3_resource (boto3.s3): A boto3 resource for the S3 service
        destination_bucket_name (str): Bucket name created during deployment where email templates will be uploaded after unzipping them from the archive
        destination_prefix (str): The key prefix under which all the email templates exist

    Raises
        botocore.exceptions.ClientError: Failures related to S3 bucket operations
    """
    logger.warning(
        f"Deleting all email templates from {destination_bucket_name} including any versions of those objects"
    )
    try:
        destination_bucket = s3_resource.Bucket(destination_bucket_name)
        destination_bucket.object_versions.filter(Prefix=f"{destination_prefix}/").delete()
    except botocore.exceptions.ClientError as error:
        logger.error(f"Error occurred when deleting objects, error is {error}")
        raise error


@tracer.capture_method
def create(
    s3_resource,
    source_bucket_name,
    source_prefix,
    destination_bucket_name,
    destination_prefix,
    invocation_account_id,
):
    """This method implements the operations to be performed when a `create` (or update) event is received by a AWS CloudFormation
    custom resource. As implementation, this method copies the template files from the source bucket to the destination bucket.
    The source bucket contains the assets as a compressed zip. This method decompresses the files and uploads them to the destination
    bucket. This operation requires read permissions to the source S3 bucket and write permissions to the destination bucket.


    Args:
        s3_resource (boto3.resource): A boto3 resource for the S3 service
        source_bucket_name (str): Bucket name which contains the asset archive with email templates
        source_prefix (str): The prefix under the source bucket which corresponds to the archive for email templates
        destination_bucket_name (str): Bucket name created during deployment where email templates will be uploaded after unzipping them from the archive
        destination_prefix (str): The name of the folder (path), under the destination bucket where the email templates should be copied to
        invocation_account_id (str): Account Id of parsed from the lambda context, used to set expected bucket owner for all s3 api calls

    Raises:
        botocore.exceptions.ClientError: Failures related to S3 bucket operations
    """
    zip_archive = get_zip_archive(s3_resource, source_bucket_name, source_prefix)

    for filename in zip_archive.namelist():
        logger.info(f"Copying {filename} email template to {destination_bucket_name}")
        try:
            s3_resource.meta.client.upload_fileobj(
                zip_archive.open(filename),
                destination_bucket_name,
                f"{destination_prefix}/{filename}",
                ExtraArgs={"ExpectedBucketOwner": invocation_account_id},
            )
        except botocore.exceptions.ClientError as error:
            logger.error(f"Error occurred when uploading file object, error is {error}")
            raise error

    logger.debug(
        "Finished uploading. Bucket %s has %s files"
        % (
            {destination_bucket_name},
            len(list(s3_resource.Bucket(destination_bucket_name).objects.filter(Prefix=f"{destination_prefix}/"))),
        )
    )


@tracer.capture_method
def execute(event, context):
    """This method copies email templates to the Bucket created by CloudFormation when deploying the application. CloudFormation fires 3 events,
    'Create', 'Update', and 'Delete'. For 'Create' and 'Update' events, this method calls :meth:`create`, and :meth:`delete` for 'Delete' event.
    For all the operations to be successful, the lambda role should contain 'Read' permissions on the source bucket and 'Write' and 'Delete'
    permissions on the destination bucket.

    This method expects source and destination bucket and prefix information to be available as 'Resource Properties' in the event object. The
    :meth:`verify_env_setup` method validates if the values are available/ set in the event object before executing the operation.

    Args:
        event (LambdaEvent): An event object received by the lambda function that is passed by AWS services when invoking the function's handler
        context (LambdaContext): A context object received by the lambda function that is passed by AWS services when invoking the function's handler

    Raises:
        Exception: if the custom resource properties are not passed correctly or an error occurs during s3 copy/ transfer
        operation, this method will throw an error. During the handling of this exception it also sends a 'FAILED' status to the  AWS
        Cloudformation service.
    """

    physical_resource_id = None
    try:
        verify_env_setup(event)
        invocation_account_id = get_invocation_account_id(context)

        # Since the underlying resource (an s3 bucket) should never be deleted on update, we must maintain the same
        # fixed physical_resource_id we receive in the event when sending the response.
        # See explanation: https://stackoverflow.com/questions/50599602/updating-custom-resources-causes-them-to-be-deleted
        physical_resource_id = event.get(PHYSICAL_RESOURCE_ID, uuid.uuid4().hex[:8])
        source_bucket_name = event[RESOURCE_PROPERTIES][SOURCE_BUCKET_NAME]
        source_prefix = event[RESOURCE_PROPERTIES][SOURCE_PREFIX]
        destination_bucket_name = event[RESOURCE_PROPERTIES][DESTINATION_BUCKET_NAME]
        destination_prefix = event[RESOURCE_PROPERTIES][DESTINATION_PREFIX]

        s3_resource = get_service_resource("s3")

        if event["RequestType"] == "Create" or event["RequestType"] == "Update":
            # should remove all old templates if present since bucket is re-used
            delete(s3_resource, destination_bucket_name, destination_prefix)
            create(
                s3_resource,
                source_bucket_name,
                source_prefix,
                destination_bucket_name,
                destination_prefix,
                invocation_account_id,
            )
        elif event["RequestType"] == "Delete":
            delete(s3_resource, destination_bucket_name, destination_prefix)

        send_response(event, context, SUCCESS, {}, physical_resource_id)
    except Exception as ex:
        logger.error(f"Error occurred when performing custom resource operation. Error is {ex}")
        send_response(event, context, FAILED, {}, physical_resource_id=physical_resource_id, reason=str(ex))
