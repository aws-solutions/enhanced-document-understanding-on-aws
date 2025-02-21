# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

from setuptools import find_packages, setup

setup(
    name="custom_boto3_init",
    version="1.1.11",
    description="Initialize boto config for AWS Python SDK with custom configuration",
    url="https://github.com/aws-solutions/enhanced-document-understanding-on-aws",
    author="Amazon Web Services",
    license="Apache 2.0",
    packages=find_packages(),
    install_requires=["aws-lambda-powertools>=2.30.2", "aws-xray-sdk>=2.12.1", "typing-extensions==4.9.0"],
    include_package_data=True,
    python_requires=">=3.11",
)
