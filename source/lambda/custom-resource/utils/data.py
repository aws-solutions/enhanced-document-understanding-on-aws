#!/usr/bin/env python
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone

import urllib3
from aws_lambda_powertools import Logger, Tracer

logger = Logger(utc=True)
tracer = Tracer()

http = urllib3.PoolManager()
UUID_VERSION = 4


@dataclass
class BuilderMetrics:
    solution_id: str
    version: str
    data: dict
    timestamp: datetime
    uuid: uuid

    def __init__(self, solution_id: str, version: str, data: dict = None, uuid: uuid = None):
        self.solution_id = solution_id
        self.version = version
        self.data = data if data else {}
        self.timestamp = datetime.now(timezone.utc).isoformat()
        self.uuid = uuid

    def __post_init__(self):
        if not isinstance(self.solution_id, str):
            raise TypeError(f"Expected {self.solution_id} to be a str")

        if not isinstance(self.version, str):
            raise TypeError(f"Expected {self.version} to be a str")

        if not isinstance(self.data, dict):
            raise TypeError(f"Expected {self.data} to be a dict")

        try:
            if self.uuid is not None:
                uuid.UUID(self.uuid, version=UUID_VERSION)
        except ValueError:
            raise TypeError(f"Expected {self.uuid} to be a UUID")
