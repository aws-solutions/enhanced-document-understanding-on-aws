#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';

import { NagSuppressions } from 'cdk-nag';
import { Construct } from 'constructs';
import { AppAssetBundler } from './asset-bundling';
import { ANONYMOUS_METRICS_SCHEDULE, COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME } from './constants';

export interface CustomInfraProps {
    /**
     * The solution id for the AWS solution
     */
    solutionID: string;

    /**
     * The version of the AWS solution being deployed
     */
    solutionVersion: string;
}

export class CustomInfraSetup extends Construct {
    /**
     * The custom resource lambda function
     */
    public readonly customResourceLambda: lambda.Function;

    /**
     * The scheduled anonymous metrics lambda function
     */
    public readonly anonymousMetricsLambda: lambda.Function;

    constructor(scope: Construct, id: string, props: CustomInfraProps) {
        super(scope, id);

        const lambdaServiceRole = new iam.Role(scope, 'CustomResourceLambdaRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            inlinePolicies: {
                LambdaFunctionServiceRolePolicy: new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            actions: ['logs:CreateLogGroup', 'logs:CreateLogStream'],
                            resources: [
                                `arn:${cdk.Aws.PARTITION}:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:/aws/lambda/*`
                            ]
                        }),
                        new iam.PolicyStatement({
                            actions: ['logs:PutLogEvents'],
                            resources: [
                                `arn:${cdk.Aws.PARTITION}:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:/aws/lambda/*:log-stream:*`
                            ]
                        })
                    ]
                })
            }
        });

        const scheduledMetricsRole = new iam.Role(scope, 'ScheduledMetricsLambdaRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            inlinePolicies: {
                LambdaFunctionServiceRolePolicy: new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            actions: ['cloudwatch:GetMetricData'],
                            resources: ['*']
                        }),
                        new iam.PolicyStatement({
                            actions: ['logs:CreateLogGroup', 'logs:CreateLogStream'],
                            resources: [
                                `arn:${cdk.Aws.PARTITION}:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:/aws/lambda/*`
                            ]
                        }),
                        new iam.PolicyStatement({
                            actions: ['logs:PutLogEvents'],
                            resources: [
                                `arn:${cdk.Aws.PARTITION}:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:*:log-stream:*`
                            ]
                        })
                    ]
                })
            }
        });

        this.customResourceLambda = new lambda.Function(this, 'CustomResource', {
            code: lambda.Code.fromAsset(
                '../lambda/custom-resource',
                AppAssetBundler.assetOptionsFactory
                    .assetOptions(COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME)
                    .options('../lambda/custom-resource')
            ),
            handler: 'lambda_func.handler',
            runtime: COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME,
            role: lambdaServiceRole,
            tracing: lambda.Tracing.ACTIVE,
            description: 'A custom resource lambda function to perform operations based on operation type',
            environment: {
                POWERTOOLS_SERVICE_NAME: 'CUSTOM-RESOURCE',
                LOG_LEVEL: 'DEBUG'
            },
            timeout: cdk.Duration.minutes(15)
        });

        this.anonymousMetricsLambda = new lambda.Function(this, 'ScheduledAnonymousMetrics', {
            code: lambda.Code.fromAsset(
                '../lambda/custom-resource',
                AppAssetBundler.assetOptionsFactory
                    .assetOptions(COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME)
                    .options('../lambda/custom-resource/')
            ),
            handler: 'lambda_ops_metrics.handler',
            runtime: COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME,
            role: scheduledMetricsRole,
            tracing: lambda.Tracing.ACTIVE,
            description: 'A lambda function that runs as per defined schedule to publish metrics',
            environment: {
                POWERTOOLS_SERVICE_NAME: 'ANONYMOUS-CW-METRICS',
                LOG_LEVEL: 'DEBUG',
                SOLUTION_ID: props.solutionID,
                SOLUTION_VERSION: props.solutionVersion
            },
            timeout: cdk.Duration.minutes(15)
        });

        const metricsCondition = new cdk.CfnCondition(cdk.Stack.of(this), 'AnonymousDataAWSCondition', {
            expression: cdk.Fn.conditionEquals(cdk.Fn.findInMap('Solution', 'Data', 'SendAnonymousUsageData'), 'Yes')
        });

        (this.anonymousMetricsLambda.node.tryFindChild('Resource') as cdk.CfnCustomResource).cfnOptions.condition =
            metricsCondition;

        // eventbridge rule to the default event-bus to push anonymous metrics
        const rule = new events.Rule(this, 'MetricsPublishFrequency', {
            schedule: events.Schedule.expression(ANONYMOUS_METRICS_SCHEDULE)
        });
        rule.addTarget(new LambdaFunction(this.anonymousMetricsLambda));

        (rule.node.tryFindChild('Resource') as cdk.CfnCustomResource).cfnOptions.condition = metricsCondition;

        if (rule.node.tryFindChild('AllowEventRuleDocUnderstandingSetupInfraSetupScheduledAnonymousMetricsEC0D94D5')) {
            (
                rule.node.tryFindChild(
                    'AllowEventRuleDocUnderstandingSetupInfraSetupScheduledAnonymousMetricsEC0D94D5'
                ) as cdk.CfnCustomResource
            ).cfnOptions.condition = metricsCondition;
        }

        NagSuppressions.addResourceSuppressions(this.customResourceLambda, [
            {
                id: 'AwsSolutions-L1',
                reason: 'The lambda is configured is to use Python 3.11, which is the highest lambda runtime version available'
            }
        ]);

        NagSuppressions.addResourceSuppressions(lambdaServiceRole.node.tryFindChild('DefaultPolicy') as iam.Policy, [
            {
                id: 'AwsSolutions-IAM5',
                reason: 'Lambda role policy is configured to read data from S3 bucket',
                appliesTo: ['Action::s3:Abort*', 'Action::s3:DeleteObject*', 'Resource::<SetupAppConfig016B0097.Arn>/*']
            }
        ]);

        NagSuppressions.addResourceSuppressions(lambdaServiceRole, [
            {
                id: 'AwsSolutions-IAM5',
                reason: 'Lambda function has the required permission to write CloudWatch Logs. It uses custom policy instead of arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole with tighter permissions.',
                appliesTo: [
                    'Resource::arn:<AWS::Partition>:logs:<AWS::Region>:<AWS::AccountId>:log-group:/aws/lambda/*'
                ]
            }
        ]);

        NagSuppressions.addResourceSuppressions(lambdaServiceRole, [
            {
                id: 'AwsSolutions-IAM5',
                reason: 'Lambda function has the required permission to write CloudWatch Log streams. It uses custom policy instead of arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole with tighter permissions.',
                appliesTo: [
                    'Resource::arn:<AWS::Partition>:logs:<AWS::Region>:<AWS::AccountId>:log-group:/aws/lambda/*:log-stream:*'
                ]
            }
        ]);

        NagSuppressions.addResourceSuppressions(lambdaServiceRole.node.tryFindChild('DefaultPolicy') as iam.Policy, [
            {
                id: 'AwsSolutions-IAM5',
                reason: 'Lambda function has the required permission to write CloudWatch Logs. It uses custom policy instead of arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole with tighter permissions.',
                appliesTo: ['Resource::*']
            }
        ]);

        NagSuppressions.addResourceSuppressions(this.anonymousMetricsLambda, [
            {
                id: 'AwsSolutions-L1',
                reason: 'The lambda is configured is to use Python 3.11, which is the highest lambda runtime version available'
            }
        ]);

        NagSuppressions.addResourceSuppressions(scheduledMetricsRole, [
            {
                id: 'AwsSolutions-IAM5',
                reason: 'Lambda function has the required permission to write CloudWatch Logs. It uses custom policy instead of arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole with tighter permissions.',
                appliesTo: [
                    'Resource::arn:<AWS::Partition>:logs:<AWS::Region>:<AWS::AccountId>:log-group:/aws/lambda/*'
                ]
            }
        ]);

        NagSuppressions.addResourceSuppressions(scheduledMetricsRole, [
            {
                id: 'AwsSolutions-IAM5',
                reason: 'Lambda function has the required permission to write CloudWatch Log Streams. It uses custom policy instead of arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole with tighter permissions.',
                appliesTo: [
                    'Resource::arn:<AWS::Partition>:logs:<AWS::Region>:<AWS::AccountId>:log-group:*:log-stream:*'
                ]
            }
        ]);

        NagSuppressions.addResourceSuppressions(scheduledMetricsRole.node.tryFindChild('DefaultPolicy') as iam.Policy, [
            {
                id: 'AwsSolutions-IAM5',
                reason: 'Lambda function has the required permission to write CloudWatch Logs. It uses custom policy instead of arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole with tighter permissions.',
                appliesTo: ['Resource::*']
            }
        ]);

        NagSuppressions.addResourceSuppressions(scheduledMetricsRole, [
            {
                id: 'AwsSolutions-IAM5',
                reason: 'This policy allows get metric data from CloudWatch and has been specified per the AWS documentation.',
                appliesTo: ['Resource::*']
            }
        ]);
    }
}
