#!/usr/bin/env node

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as path from 'path';
import { getCommandsForPythonDockerBuild } from '../utils/asset-bundling';
import { LayerProps, localBundling } from '../utils/common-utils';
import { COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME } from '../utils/constants';

/**
 * A class that defines user-agent layer for Python runtimes
 */
export class PythonUserAgentLayer extends lambda.LayerVersion {
    constructor(scope: Construct, id: string, props: LayerProps) {
        const compatibleRuntimes = props.compatibleRuntimes ?? [lambda.Runtime.PYTHON_3_11, lambda.Runtime.PYTHON_3_12];

        for (const runtime of compatibleRuntimes) {
            if (runtime && runtime.family !== lambda.RuntimeFamily.PYTHON) {
                throw new Error(`Only ${compatibleRuntimes.join(',')} runtimes are supported`);
            }
        }

        const entry = path.resolve(props.entry);

        super(scope, id, {
            code: lambda.Code.fromAsset(entry, {
                bundling: {
                    image: COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME.bundlingImage,
                    local: {
                        tryBundle(outputDir: string) {
                            const cliCommand = `cd ${entry} && echo "Trying local bundling of python modules" && rm -fr .venv* && rm -fr dist && python3 -m pip install poetry && python3 -m poetry build && python3 -m poetry install --only main && python3 -m poetry run pip install -t ${outputDir}/python dist/*.whl`;
                            const targetDirectory = `${outputDir}/python/`;
                            return localBundling(cliCommand, entry, targetDirectory);
                        }
                    },
                    command: getCommandsForPythonDockerBuild('/asset-output/python', 'python user-agent lambda layer'),
                    user: 'root'
                }
            }),
            compatibleRuntimes,
            description: props.description
        } as lambda.LayerVersionProps);
    }
}
