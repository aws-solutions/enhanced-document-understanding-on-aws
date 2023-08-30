#!/bin/bash
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

[ "$DEBUG" == 'true' ] && set -x
set -e

echo "------------------------------------------"
echo "Script executing from: ${PWD}"
echo "------------------------------------------"

# Write custom instructions to build jars for lambda layers to use in lambda functions on Java runtime

execution_dir="$PWD"
common_java_sdk_config_layer="$execution_dir/../lambda/layers/custom-java-sdk-config"

build_layer() {
    layer_folder=$1
    artifact_jar_name=$2

    echo "-----------------------------------------"
    echo "Running maven build for $layer_folder"
    echo "-----------------------------------------"

    cd $layer_folder

    echo "-----------------------------------------"
    echo "Current directory is: ${PWD}". Running build
    echo "-----------------------------------------"

    mvn clean install -DskipTests --quiet --no-transfer-progress

    echo "-----------------------------------------"
    echo "Build complete"
    echo "-----------------------------------------"
}

build_layer $common_java_sdk_config_layer custom-java-sdk-config
