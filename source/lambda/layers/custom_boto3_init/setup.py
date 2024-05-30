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

from setuptools import find_packages, setup

setup(
    name="custom_boto3_init",
    version="1.0.10",
    description="Initialize boto config for AWS Python SDK with custom configuration",
    url="https://github.com/aws-solutions/enhanced-document-understanding-on-aws",
    author="Amazon Web Services",
    license="Apache 2.0",
    packages=find_packages(),
    install_requires=["aws-lambda-powertools>=2.30.2", "aws-xray-sdk>=2.12.1", "typing-extensions==4.9.0"],
    include_package_data=True,
    python_requires=">=3.11",
)
