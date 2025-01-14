#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { UIAssets } from './s3web/ui-asset';

export interface UIInfrastructureProps {
    /**
     * Optional: Key of the Web Configuration in Parameter Store containing all the required parameters for the runtime
     * config of the web UI. If not provided, then it will use Fn::ImportValue to import "WebRuntimeConfigKey"
     */
    webRuntimeConfigKey: string;

    /**
     * Custom lambda function to be passed as service token  for the custom infra setup
     */
    customInfra: lambda.Function;

    /**
     * Bucket to store s3 audit logs
     */
    accessLoggingBucket: s3.Bucket;
}

/**
 * The core stack that creates the infrastructure required to build the UI site. This construct will only create the
 * WebApp if the CfnMapping for 'Deploy-->WebApp' is set to 'Yes'"
 */
export class UIInfrastructure extends Construct {
    /**
     * condition if the UI stack should be deployed. If 'Yes', then the stack will be deployed.
     * The condition checks the value from CfnMapping.
     */
    public readonly deployWebApp: cdk.CfnCondition;

    /**
     * Nested Stack for WebApp
     */
    public readonly nestedUIStack: cdk.NestedStack;

    constructor(scope: Construct, id: string, props: UIInfrastructureProps) {
        super(scope, id);

        this.deployWebApp = new cdk.CfnCondition(cdk.Stack.of(this), 'DeployWebApp', {
            expression: cdk.Fn.conditionEquals(cdk.Fn.findInMap('FeaturesToDeploy', 'Deploy', 'WebApp'), 'Yes')
        });

        // the construct should be named 'S3UI' as there is a corresponding CDK aspect that uses this name to add resource
        // condition for govcloud
        this.nestedUIStack = new UIAssets(this, 'S3UI', {
            parameters: {
                WebConfigKey: props.webRuntimeConfigKey,
                CustomResourceLambdaArn: props.customInfra.functionArn,
                CustomResourceRoleArn: props.customInfra.role!.roleArn,
                AccessLoggingBucketArn: props.accessLoggingBucket.bucketArn
            },
            description:
                'Nested stack that deploys UI components that include an S3 bucket for web assets and a CloudFront distribution'
        });
        (this.nestedUIStack.node.defaultChild as cdk.CfnResource).cfnOptions.condition = this.deployWebApp;
    }
}
