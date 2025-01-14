#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as path from 'path';
import { getCommandsForNodejsDockerBuild } from '../utils/asset-bundling';
import { getNodejsLayerLocalBundling, LayerProps } from '../utils/common-utils';
import { COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME, GOV_CLOUD_REGION_LAMBDA_NODE_RUNTIME } from '../utils/constants';

/**
 * A class the defines the user-agent layer Construct for Node runtimes
 */
export class NodeUserAgentLayer extends lambda.LayerVersion {
    constructor(scope: Construct, id: string, props: LayerProps) {
        const compatibleRuntimes = props.compatibleRuntimes ?? [
            GOV_CLOUD_REGION_LAMBDA_NODE_RUNTIME,
            COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME
        ];

        for (const runtime of compatibleRuntimes) {
            if (runtime && runtime.family !== lambda.RuntimeFamily.NODEJS) {
                throw new Error(`Only ${compatibleRuntimes.join(',')} runtimes are supported`);
            }
        }

        const entry = path.resolve(props.entry);

        super(scope, id, {
            code: lambda.Code.fromAsset(entry, {
                bundling: {
                    image: COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME.bundlingImage,
                    user: 'root',
                    local: getNodejsLayerLocalBundling(entry),
                    command: getCommandsForNodejsDockerBuild(
                        `/asset-output/nodejs/node_modules/${path.basename(entry)}`,
                        'node user-agent lambda layer'
                    )
                }
            }),
            compatibleRuntimes,
            description: props.description
        } as lambda.LayerVersionProps);
    }
}
