#!/bin/bash
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

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
