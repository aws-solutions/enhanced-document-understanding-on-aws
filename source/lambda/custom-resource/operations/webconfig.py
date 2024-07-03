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
import uuid

from botocore.exceptions import ClientError
from boto3.dynamodb.types import TypeDeserializer
from aws_lambda_powertools import Logger, Tracer
from cfn_response import send_response
from helper import get_service_client
from operations import operation_types
from operations.operation_types import FAILED, PHYSICAL_RESOURCE_ID, RESOURCE, RESOURCE_PROPERTIES, SUCCESS

logger = Logger(utc=True)
tracer = Tracer()

SSM_KEY = "SSM_KEY"
API_ENDPOINT = "API_ENDPOINT"
USER_POOL_ID = "USER_POOL_ID"
USER_POOL_CLIENT_ID = "USER_POOL_CLIENT_ID"
KENDRA_STACK_DEPLOYED = "KENDRA_STACK_DEPLOYED"
OPEN_SEARCH_STACK_DEPLOYED = "OPEN_SEARCH_STACK_DEPLOYED"
WORKFLOW_CONFIG_DDB_TABLE_NAME = "WORKFLOW_CONFIG_DDB_TABLE_NAME"
WORKFLOW_CONFIG_NAME = "WORKFLOW_CONFIG_NAME"


@tracer.capture_method
def verify_env_setup(event):
    """This method verifies if all the necessary properties are correctly set in the event object as received by the lambda function's handler

    Args:
        event (LambdaEvent): An event received by the lambda function that is passed by AWS services when invoking the function's handler

    Raises:
        ValueError: If any of the properties in the custom resource properties are not set correctly or are not available
    """
    if event[RESOURCE_PROPERTIES][RESOURCE] != operation_types.WEBCONFIG:
        err_msg = f"Operation type not available or did not match from the request. Expecting operation type to be {operation_types.WEBCONFIG}"
        logger.error(f"{err_msg}. Here are the resource properties received {json.dumps(event[RESOURCE_PROPERTIES])}")
        raise ValueError(err_msg)

    if event[RESOURCE_PROPERTIES].get(SSM_KEY, None) in ["", None] or (
        event["RequestType"] != "Delete"
        and (
            event[RESOURCE_PROPERTIES].get(API_ENDPOINT, None) in ["", None]
            or event[RESOURCE_PROPERTIES].get(USER_POOL_ID, None) in ["", None]
            or event[RESOURCE_PROPERTIES].get(USER_POOL_CLIENT_ID, None) in ["", None]
            or event[RESOURCE_PROPERTIES].get(KENDRA_STACK_DEPLOYED, None) in ["", None]
            or event[RESOURCE_PROPERTIES].get(OPEN_SEARCH_STACK_DEPLOYED, None) in ["", None]
            or event[RESOURCE_PROPERTIES].get(WORKFLOW_CONFIG_DDB_TABLE_NAME, None) in ["", None]
            or event[RESOURCE_PROPERTIES].get(WORKFLOW_CONFIG_NAME, None) in ["", None]
        )
    ):
        operations = ", ".join(
            [
                SSM_KEY,
                API_ENDPOINT,
                USER_POOL_ID,
                USER_POOL_CLIENT_ID,
                KENDRA_STACK_DEPLOYED,
                OPEN_SEARCH_STACK_DEPLOYED,
                WORKFLOW_CONFIG_DDB_TABLE_NAME,
                WORKFLOW_CONFIG_NAME,
            ]
        )
        err_msg = f"Any of {operations} has not been passed. Operation cannot be performed"
        logger.error(f"{err_msg}. Here are the resource properties received {json.dumps(event[RESOURCE_PROPERTIES])}")
        raise ValueError(err_msg)


@tracer.capture_method
def create(event, context):
    """This method creates a JSON string that writes to SSM Parameter store.

    Args:
        event (LambdaEvent): An event object received by the lambda function that is passed by AWS services when invoking the function's handler
        context (LambdaContext): A context object received by the lambda function that is passed by AWS services when invoking the function's handler

    Raises:
        botocore.exceptions.ClientError: Failures related to SSM Parameter Store PutParameter operation
    """

    ssm = get_service_client("ssm")
    dynamodb = get_service_client("dynamodb")
    try:
        workflow_config_item = dynamodb.get_item(
            TableName=event[RESOURCE_PROPERTIES][WORKFLOW_CONFIG_DDB_TABLE_NAME],
            Key={"Name": {"S": event[RESOURCE_PROPERTIES][WORKFLOW_CONFIG_NAME]}},
        )

        if workflow_config_item.get("Item", None) is None:
            raise ValueError(f"Workflow Config Item not found in the DynamoDB table")

        required_docs = workflow_config_item["Item"]["MinRequiredDocuments"]
        d = TypeDeserializer()

        ssm_key = event[RESOURCE_PROPERTIES][SSM_KEY]
        json_string = json.dumps(
            {
                "ApiEndpoint": event[RESOURCE_PROPERTIES][API_ENDPOINT],
                "UserPoolId": event[RESOURCE_PROPERTIES][USER_POOL_ID],
                "UserPoolClientId": event[RESOURCE_PROPERTIES][USER_POOL_CLIENT_ID],
                "KendraStackDeployed": event[RESOURCE_PROPERTIES][KENDRA_STACK_DEPLOYED],  # resolves to Yes/No
                "OpenSearchStackDeployed": event[RESOURCE_PROPERTIES][OPEN_SEARCH_STACK_DEPLOYED],  # resolves to Yes/No
                "AwsRegion": os.environ["AWS_REGION"],
                "RequiredDocs": d.deserialize(required_docs),
                "WorkflowConfigName": event[RESOURCE_PROPERTIES][WORKFLOW_CONFIG_NAME],
            }
        )

        ssm.put_parameter(
            Name=ssm_key,
            Value=json_string,
            Type="SecureString",
            Description="Configuration for Client App",
            Overwrite=True,
        )
        logger.debug("Writing to SSM Parameter store complete")
    except ClientError as error:
        logger.error((f"Error occurred when inserting parameter in SSM parameter store, error is {error}"))
        raise error
    except ValueError as error:
        logger.error(f"Error occurred when retrieving Workflow Config Item, error is {error}")
        raise error


@tracer.capture_method
def delete(event, context):
    """This method deletes the Key and Value from SSM Parameter Store. The Key is retrieved from the event object

    Args:
        event (LambdaEvent): An event object received by the lambda function that is passed by AWS services when invoking the function's handler
        context (LambdaContext): A context object received by the lambda function that is passed by AWS services when invoking the function's handler

    Raises
        botocore.exceptions.ClientError: Failures related to SSM Parameter store delete operation
    """
    if event[RESOURCE_PROPERTIES].get(SSM_KEY, None) not in ["", None]:
        ssm = get_service_client("ssm")
        try:
            ssm.delete_parameter(Name=event[RESOURCE_PROPERTIES][SSM_KEY])
        except ssm.exceptions.ParameterNotFound as error:
            logger.error(f"Parameter not found, hence no delete operation will be performed. Detailed error, {error}")
        except ClientError as error:
            logger.error((f"Error occurred when deleting parameter in SSM parameter store, error is {error}"))
            raise error
    else:
        logger.error("SSM Key not found in the event object. Hence no delete operation will be performed")


@tracer.capture_method
def execute(event, context):
    """This method retrieves the web configuration required by the front-end client stack and stores it in the SSM parameter
    with the provided key. The parameters are:
        - API Endpoint
        - User Pool ID
        - User Pool Client ID
        - Kendra Stack Deployed status
        - AWS Region

    For delete event, the lambda will delete the configuration from SSM Parameter Store.

    Note: for update events, if the SSM Key has changed, it is not possible to delete the old key since the key name is not known.

    Args:
        event (LambdaEvent): An event object received by the lambda function that is passed by AWS services when invoking the function's handler
        context (LambdaContext): A context object received by the lambda function that is passed by AWS services when invoking the function's handler

    Raises:
        Exception: if the custom resource properties are not passed correctly or an error occurs during s3 copy/ transfer
        operation, this method will throw an error. During the handling of this exception it also sends a 'FAILED' status to the  AWS
        Cloudformation service.
    """
    physical_resource_id = event.get(PHYSICAL_RESOURCE_ID, uuid.uuid4().hex[:8])
    try:
        verify_env_setup(event)

        if event["RequestType"] == "Create" or event["RequestType"] == "Update":
            create(event, context)

        if event["RequestType"] == "Delete":
            delete(event, context)

        send_response(event, context, SUCCESS, {}, physical_resource_id)
    except Exception as ex:
        logger.error(f"Error occurred when creating web client app configuration. Error is {ex}")
        send_response(event, context, FAILED, {}, physical_resource_id=physical_resource_id, reason=str(ex))
