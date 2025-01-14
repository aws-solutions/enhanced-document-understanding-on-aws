#!/usr/bin/env python
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0


import boto3
from custom_config import custom_usr_agent_config
from aws_lambda_powertools import Logger, Tracer

logger = Logger(utc=True)
tracer = Tracer()

_helpers_service_clients = dict()
_helpers_service_resources = dict()
_session = None


@tracer.capture_method
def get_session():
    global _session
    if not _session:
        _session = boto3.session.Session()
    return _session


@tracer.capture_method
def get_service_client(service_name):
    global _helpers_service_clients
    session = get_session()

    if service_name not in _helpers_service_clients:
        logger.debug(f"Cache miss for {service_name}. Creating a new one and cache it")
        _helpers_service_clients[service_name] = session.client(service_name, config=custom_usr_agent_config())

    return _helpers_service_clients[service_name]


@tracer.capture_method
def get_service_resource(service_name):
    global _helpers_service_resources
    session = get_session()

    if service_name not in _helpers_service_resources:
        logger.debug(f"Cache miss for {service_name}. Creating a new one and cache it")
        _helpers_service_resources[service_name] = session.resource(service_name, config=custom_usr_agent_config())
    return _helpers_service_resources[service_name]
