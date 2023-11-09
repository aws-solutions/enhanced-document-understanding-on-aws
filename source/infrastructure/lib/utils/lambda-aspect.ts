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

import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NagSuppressions } from 'cdk-nag';
import { Construct, IConstruct } from 'constructs';
import { JavaUserAgentLayer } from '../layers/java-user-agent';
import { NodeUserAgentLayer } from '../layers/node-user-agent';
import { PythonUserAgentLayer } from '../layers/python-user-agent';
import { AwsNodeSdkLibLayer, Boto3SdkLibLayer } from '../layers/runtime-libs';
import { NodejsSharedLibLayer } from '../layers/shared-lib';
import { CloudwatchNamespace } from '../utils/constants';

export interface LambdaAspectProps {
    /**
     * Solution ID associated with the application
     */
    solutionID: string;
    /**
     * Solution version of the application
     */
    solutionVersion: string;
}

/**
 * A collection of aspects to be injected for lambda functions based on their runtime
 */
export class LambdaAspects extends Construct implements cdk.IAspect {
    private nodejsUserAgentLayer: lambda.LayerVersion;
    private nodejsSharedLibLayer: lambda.LayerVersion;
    private awsNodeSdkLibLayer: lambda.LayerVersion;
    private pythonUserAgentLayer: lambda.LayerVersion;
    private boto3SdkLibLayer: lambda.LayerVersion;
    private javaUserAgentLayer: lambda.LayerVersion;
    private customMetricsPolicy: Map<string, iam.Policy>;
    private solutionID: string;
    private solutionVersion: string;

    constructor(scope: Construct, id: string, props: LambdaAspectProps) {
        super(scope, id);
        this.solutionID = props.solutionID;
        this.solutionVersion = props.solutionVersion;
    }

    public visit(node: IConstruct): void {
        const solutionID = this.solutionID;
        const solutionVersion = this.solutionVersion;

        if (node instanceof lambda.Function) {
            this.addCWMetricsPolicy(node);
            if (node.runtime.family === lambda.RuntimeFamily.NODEJS) {
                this.addLayersForNodejsLambda(node, solutionID, solutionVersion);
            } else if (node.runtime.family === lambda.RuntimeFamily.PYTHON) {
                node.addLayers(this.getOrCreatePythonUserAgent(), this.getOrCreateBoto3LibLayer());
                node.addEnvironment(
                    'AWS_SDK_USER_AGENT',
                    `{ "user_agent_extra": "AwsSolution/${solutionID}/${solutionVersion}" }`
                );
            } else if (node.runtime.family === lambda.RuntimeFamily.JAVA) {
                node.addLayers(this.getOrCreateJavaUserAgent());
                node.addEnvironment('AWS_SDK_USER_AGENT', `AwsSolution/${solutionID}/${solutionVersion}`);
            } else {
                throw new Error(`Layer for ${node.runtime.name} currently not supported`);
            }
        }
    }

    /**
     * Method to add policy to put custom metrics to CloudWatch
     *
     * @param lambda
     */
    private addCWMetricsPolicy(lambda: lambda.Function) {
        if (!this.customMetricsPolicy) {
            this.customMetricsPolicy = new Map();
        }

        const stack = cdk.Stack.of(lambda);
        let metricsPolicy = this.customMetricsPolicy.get(stack.stackId);

        if (metricsPolicy === undefined) {
            metricsPolicy = new iam.Policy(stack, 'CustomMetricsPolicy', {
                statements: [
                    new iam.PolicyStatement({
                        actions: ['cloudwatch:PutMetricData'],
                        effect: iam.Effect.ALLOW,
                        resources: ['*'],
                        conditions: {
                            StringEquals: {
                                'cloudwatch:namespace': [
                                    CloudwatchNamespace.CASE,
                                    CloudwatchNamespace.DOCUMENTS,
                                    CloudwatchNamespace.FILE_TYPES,
                                    CloudwatchNamespace.WORKFLOW_TYPES
                                ]
                            }
                        }
                    })
                ]
            });

            this.customMetricsPolicy.set(stack.stackId, metricsPolicy);

            NagSuppressions.addResourceSuppressions(metricsPolicy, [
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'This policy allows put metric data to CloudWatch. The policy is restricted using policy conditions.',
                    appliesTo: ['Resource::*']
                }
            ]);
        }

        metricsPolicy.attachToRole(lambda.role!);
    }

    private addLayersForNodejsLambda(node: cdk.aws_lambda.Function, solutionID: any, solutionVersion: any) {
        node.addLayers(
            this.getNodeUserAgent(),
            this.getOrCreateNodejsCommonLibraries(),
            this.getOrCreateAwsNodeSdkLibLayer()
        );
        node.addEnvironment(
            'AWS_SDK_USER_AGENT',
            `{ "customUserAgent": "AwsSolution/${solutionID}/${solutionVersion}" }`
        );
        node.addEnvironment('AWS_NODEJS_CONNECTION_REUSE_ENABLED', '1');
    }

    /**
     * @returns Node runtime compatible LayerVersion for user-agent
     */
    private getNodeUserAgent(): lambda.LayerVersion {
        if (this.nodejsUserAgentLayer === undefined) {
            this.nodejsUserAgentLayer = new NodeUserAgentLayer(this, 'NodeUserAgentLayer', {
                entry: '../lambda/layers/aws-node-user-agent-config',
                description: 'This layer configures AWS Node SDK initialization to send user-agent information',
                compatibleRuntimes: [lambda.Runtime.NODEJS_18_X]
            });
        }

        return this.nodejsUserAgentLayer;
    }

    /**
     * This method checks if the layer definition exists. If not then creates a new one.
     *
     * @returns Python runtime compatible LayerVersion for user-agent
     */
    private getOrCreatePythonUserAgent(): lambda.LayerVersion {
        if (this.pythonUserAgentLayer === undefined) {
            this.pythonUserAgentLayer = new PythonUserAgentLayer(this, 'PythonUserAgentLayer', {
                entry: '../lambda/layers/custom_boto3_init',
                description: 'This layer configures AWS Python SDK initialization to send user-agent information',
                compatibleRuntimes: [
                    lambda.Runtime.PYTHON_3_8,
                    lambda.Runtime.PYTHON_3_9,
                    lambda.Runtime.PYTHON_3_10,
                    lambda.Runtime.PYTHON_3_11
                ]
            });
        }

        return this.pythonUserAgentLayer;
    }

    /**
     * This method checks if the layer definition exists. If not then creates a new one.
     *
     * @returns Java runtime compatible LayerVersion for user-agent
     */
    private getOrCreateJavaUserAgent(): lambda.LayerVersion {
        if (this.javaUserAgentLayer === undefined) {
            this.javaUserAgentLayer = new JavaUserAgentLayer(this, 'JavaUserAgentLayer', {
                entry: '../lambda/layers/custom-java-sdk-config',
                description: 'This layer configures AWS Java SDK initialization to send user-agent information',
                compatibleRuntimes: [lambda.Runtime.JAVA_11, lambda.Runtime.JAVA_17]
            });
        }

        return this.javaUserAgentLayer;
    }

    /**
     * This method checks if the layer definition exists. If not then creates a new one.
     *
     * @returns Lambda LayerVersion for library/ common functions for Nodejs runtime
     */
    private getOrCreateNodejsCommonLibraries(): lambda.LayerVersion {
        if (this.nodejsSharedLibLayer === undefined) {
            this.nodejsSharedLibLayer = new NodejsSharedLibLayer(this, 'NodejsSharedLib', {
                entry: '../lambda/layers/common-node-lib',
                description:
                    'This layer contains shared libraries and functions across all lambda functions to be bundled with the lambda function',
                compatibleRuntimes: [lambda.Runtime.NODEJS_18_X]
            });
        }

        return this.nodejsSharedLibLayer;
    }

    /**
     * This method checks if the layer definition exists. If not then creates a new one.
     *
     * @returns Lambda LayerVersion for AWS Node SDK
     */
    private getOrCreateAwsNodeSdkLibLayer(): lambda.LayerVersion {
        if (this.awsNodeSdkLibLayer === undefined) {
            this.awsNodeSdkLibLayer = new AwsNodeSdkLibLayer(this, 'AwsNodeSdkLayer', {
                entry: '../lambda/layers/aws-sdk-lib',
                description: 'AWS Node SDK to be bundled with lambda functions',
                compatibleRuntimes: [lambda.Runtime.NODEJS_18_X]
            });
        }

        return this.awsNodeSdkLibLayer;
    }

    /**
     * This method checks if the layer definition exists. If not then creates a new one.
     *
     * @returns returns a LayerVersion for Boto3 library
     */
    private getOrCreateBoto3LibLayer(): lambda.LayerVersion {
        if (this.boto3SdkLibLayer === undefined) {
            this.boto3SdkLibLayer = new Boto3SdkLibLayer(this, 'Boto3Layer', {
                entry: '../lambda/layers/aws_boto3',
                description: 'Boto3 layer to be bundled with python lambda functions',
                compatibleRuntimes: [
                    lambda.Runtime.PYTHON_3_8,
                    lambda.Runtime.PYTHON_3_9,
                    lambda.Runtime.PYTHON_3_10,
                    lambda.Runtime.PYTHON_3_11
                ]
            });
        }

        return this.boto3SdkLibLayer;
    }
}
