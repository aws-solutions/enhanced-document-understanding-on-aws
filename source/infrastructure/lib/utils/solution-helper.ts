#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface SolutionHelperProps {
    /**
     * The custom resource lambda function to be used for pushing anonymous metrics data
     */
    customResource: lambda.Function;

    /**
     * The solution id for the AWS solution
     */
    solutionID: string;

    /**
     * The version of the AWS solution being deployed
     */
    version: string;

    /**
     * The value that specifies whether Kendra index was deployed or not
     */
    deployKendraIndex: string;

    /**
     * The name of the workflow configuration to be used for the solution
     */
    workflowConfigName: string;
}

/**
 * This construct creates the custom resource required to publish anonymous metrics data to the solution builder
 * endpoint
 */
export class SolutionHelper extends Construct {
    constructor(scope: Construct, id: string, props: SolutionHelperProps) {
        super(scope, id);

        const anonymousData = new cdk.CustomResource(this, 'AnonymousData', {
            resourceType: 'Custom::AnonymousData',
            serviceToken: props.customResource.functionArn,
            properties: {
                Resource: 'ANONYMOUS_METRIC',
                SolutionId: props.solutionID,
                Version: props.version,
                DeployKendraIndex: props.deployKendraIndex,
                WorkflowConfigName: props.workflowConfigName
            }
        });

        const metricsCondition = new cdk.CfnCondition(cdk.Stack.of(this), 'AnonymousDataAWS', {
            expression: cdk.Fn.conditionEquals(cdk.Fn.findInMap('Solution', 'Data', 'SendAnonymousUsageData'), 'Yes')
        });

        (anonymousData.node.tryFindChild('Default') as cdk.CfnCustomResource).cfnOptions.condition = metricsCondition;
    }
}
