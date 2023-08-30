#!/usr/bin/env node

/**********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as path from 'path';
import { getCommandsForNodejsDockerBuild } from '../utils/asset-bundling';
import { localBundling } from '../utils/common-utils';
import { COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME } from '../utils/constants';

export interface SharedLibLayerProps {
    /**
     * The path to the root directory of the lambda layer.
     */
    readonly entry: string;

    /**
     * The runtimes compatible with the python layer.
     *
     * @default - All runtimes are supported.
     */
    readonly compatibleRuntimes?: lambda.Runtime[];

    /**
     * Path to lock file
     */
    readonly depsLockFilePath?: string;

    /**
     * Description of the lambda layer
     */
    readonly description?: string;
}

/**
 * A construct to create a lambda layer for common libraries for nodejs lambda functions
 */
export class NodejsSharedLibLayer extends lambda.LayerVersion {
    constructor(scope: Construct, id: string, props: SharedLibLayerProps) {
        const compatibleRuntimes = props.compatibleRuntimes ?? [COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME];

        for (const runtime of compatibleRuntimes) {
            if (runtime && runtime.family !== lambda.RuntimeFamily.NODEJS) {
                throw new Error(`Only ${compatibleRuntimes.join(',')} runtimes are supported`);
            }
        }

        const entry = path.resolve(props.entry);
        const baseFolderName = path.basename(entry);

        super(scope, id, {
            code: lambda.Code.fromAsset(entry, {
                bundling: {
                    image: COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME.bundlingImage,
                    user: 'root',
                    local: {
                        tryBundle(outputDir: string) {
                            const cliCommand = `echo "Trying local bundling of assets" && cd ${entry} && rm -fr node_modules && npm ci --omit=dev`;
                            const targetDirectory = `${outputDir}/nodejs/node_modules/${baseFolderName}`;
                            return localBundling(cliCommand, entry, targetDirectory);
                        }
                    },
                    command: getCommandsForNodejsDockerBuild(
                        `/asset-output/nodejs/node_modules/${path.basename(entry)}`,
                        'shared-lib lambda layer'
                    )
                }
            }),
            compatibleRuntimes,
            description: props.description
        } as lambda.LayerVersionProps);
    }
}
