#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as opensearch from 'aws-cdk-lib/aws-opensearchserverless';

import { Construct, IConstruct } from 'constructs';
import { NagSuppressions } from 'cdk-nag';
import { CloudwatchNamespace, MetricNames } from '../utils/constants';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

export interface OpenSearchCollectionProps {
    /**
     * The id of the OpenSearch serverless collection.
     */
    readonly collectionId: string;

    /**
     * The name of the OpenSearch serverless collection.
     */
    readonly collectionName: string;

    /**
     * The endpoint of the OpenSearch serverless collection.
     */
    readonly endpoint: string;
}

export class OpenSearchParameters {
    /**
     * The id of the VPC that OpenSearch serverless will be running in
     */
    public readonly vpcId: string;

    /**
     * The ids of the VPC subnets that OpenSearch serverless will be running in
     */
    public readonly subnetIds: string[];

    /**
     * The id of the security groupI that OpenSearch serverless will be associated with
     */
    public readonly securityGroupId: string;

    /**
     * The Arn of the Role that will write to this collection
     */
    public readonly writeRoleArn: string;

    /**
     * The Arn of the Role that will read to this collection
     */
    public readonly readRoleArn: string;

    constructor(stack: IConstruct) {
        // create new cfnParameter to read vpcId.
        this.vpcId = new cdk.CfnParameter(stack, 'VpcId', {
            type: 'String',
            constraintDescription: 'Please provide a valid vpc id',
            description: 'The vpc id that OpenSearch serverless will be running in'
        }).valueAsString;

        // create new cfnParameter to read subnetIds.
        this.subnetIds = new cdk.CfnParameter(stack, 'SubnetIds', {
            type: 'List<AWS::EC2::Subnet::Id>',
            constraintDescription: 'Please provide valid subnet ids',
            description: 'The subnet ids that OpenSearch serverless will be running in'
        }).valueAsList;

        // create new cfnParameter to read securityGroupId.
        this.securityGroupId = new cdk.CfnParameter(stack, 'SecurityGroupId', {
            type: 'String',
            constraintDescription: 'Please provide a valid security group id',
            description: 'The security group id that OpenSearch serverless will be associated with'
        }).valueAsString;

        // create new cfnParameter to write iam role arn
        this.writeRoleArn = new cdk.CfnParameter(stack, 'WriteRoleArn', {
            type: 'String',
            allowedPattern: '^arn:(aws|aws-cn|aws-us-gov):iam::\\d{12}:role\\/\\S+$',
            constraintDescription: 'Please provide a valid IAM Role Arn',
            description: 'The role Arn which will write to the Kendra Index'
        }).valueAsString;

        // create new cfnParameter to read iam role arn
        this.readRoleArn = new cdk.CfnParameter(stack, 'ReadRoleArn', {
            type: 'String',
            allowedPattern: '^arn:(aws|aws-cn|aws-us-gov):iam::\\d{12}:role\\/\\S+$',
            constraintDescription: 'Please provide a valid IAM Role Arn',
            description: 'The role Arn which will query the Kendra Index'
        }).valueAsString;
    }
}

export class OpenSearchCaseStorage extends cdk.NestedStack {
    /**
     * The VPC endpoint which enables traffic to OpenSearch serverless collections.
     */
    public readonly vpcEndpoint: opensearch.CfnVpcEndpoint;
    /**
     * The OpenSearch serverless collections.
     */
    public readonly collection: opensearch.CfnCollection;
    /**
     * The properties that describe OpenSearch serverless collection: collection name, collection id and endpoint.
     */
    public readonly collectionProps: OpenSearchCollectionProps;

    constructor(scope: Construct, id: string, props: cdk.NestedStackProps) {
        super(scope, id, props);
        const stackParameters = new OpenSearchParameters(cdk.Stack.of(this));

        const stackName = id.toLowerCase().substring(0, 5);
        const collectionsName = stackName + '-edu';
        const collectionResourceName = `collection/${collectionsName}`;
        const indexResourceName = `index/${collectionsName}`;

        this.vpcEndpoint = new opensearch.CfnVpcEndpoint(this, 'OpenSearchVPCE', {
            name: `${collectionsName}-vpc-endpoint`, // name should follow canary name pattern
            subnetIds: stackParameters.subnetIds,
            vpcId: stackParameters.vpcId,
            securityGroupIds: [stackParameters.securityGroupId]
        });

        const encryptionPolicy = new opensearch.CfnSecurityPolicy(this, `${collectionsName}-encryption-policy`, {
            name: `${collectionsName}-encryption-policy`, // name should follow canary name pattern
            type: 'encryption',
            policy: JSON.stringify({
                Rules: [
                    {
                        Resource: [
                            // usd wildcard since it should allow access to all indices under this collection
                            'collection/*'
                        ],
                        ResourceType: 'collection'
                    }
                ],
                AWSOwnedKey: true
            })
        });
        const networkPolicy = new opensearch.CfnSecurityPolicy(this, `${collectionsName}-network-policy`, {
            name: `${collectionsName}-network-policy`, // name should follow canary name pattern
            type: 'network',
            policy: JSON.stringify([
                {
                    Rules: [
                        {
                            Resource: [`${collectionResourceName}`],
                            ResourceType: 'dashboard'
                        }
                    ],
                    AllowFromPublic: true
                },
                {
                    Rules: [
                        {
                            Resource: [`${collectionResourceName}`],
                            ResourceType: 'collection'
                        }
                    ],
                    AllowFromPublic: false,
                    SourceVPCEs: [this.vpcEndpoint.attrId]
                }
            ])
        });
        this.collection = new opensearch.CfnCollection(this, collectionsName, {
            name: `${collectionsName}`, // name should follow canary name pattern
            type: 'SEARCH'
        });

        this.collectionProps = {
            collectionId: this.collection.attrId,
            collectionName: collectionsName,
            endpoint: this.collection.attrCollectionEndpoint
        };
        this.collection.addDependency(this.vpcEndpoint);
        this.collection.addDependency(encryptionPolicy);
        this.collection.addDependency(networkPolicy);

        const lambdaOpenWritePolicy = new opensearch.CfnAccessPolicy(this, 'OpenSearchWritePolicy', {
            name: `${collectionsName}-lambda-write-policy`, // name should follow canary name pattern
            type: 'data',
            policy: JSON.stringify([
                {
                    Rules: [
                        {
                            ResourceType: 'index',
                            Resource: [`${indexResourceName}/*`],
                            Permission: [
                                'aoss:ReadDocument',
                                'aoss:WriteDocument',
                                'aoss:CreateIndex',
                                'aoss:UpdateIndex',
                                'aoss:DescribeIndex'
                            ]
                        },
                        {
                            ResourceType: 'collection',
                            Resource: [`${collectionResourceName}`],
                            Permission: [
                                'aoss:CreateCollectionItems',
                                'aoss:UpdateCollectionItems',
                                'aoss:DescribeCollectionItems'
                            ]
                        }
                    ],
                    Principal: [stackParameters.writeRoleArn]
                }
            ])
        });

        const lambdaOpenReadPolicy = new opensearch.CfnAccessPolicy(this, 'OpenSearchReadPolicy', {
            name: `${collectionsName}-lambda-read-policy`, // name should follow canary name pattern
            type: 'data',
            policy: JSON.stringify([
                {
                    Rules: [
                        {
                            ResourceType: 'index',
                            Resource: [`${indexResourceName}/*`],
                            Permission: ['aoss:ReadDocument', 'aoss:CreateIndex', 'aoss:DescribeIndex']
                        },
                        {
                            ResourceType: 'collection',
                            Resource: [`${collectionResourceName}`],
                            Permission: ['aoss:DescribeCollectionItems']
                        }
                    ],
                    Principal: [stackParameters.readRoleArn]
                }
            ])
        });

        const apiAccessPolicy = new iam.Policy(this, 'OpenSearchApiAccessPolicy', {
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['aoss:APIAccessAll'],
                    resources: [`${this.collection.attrArn}`]
                })
            ]
        });
        apiAccessPolicy.attachToRole(
            iam.Role.fromRoleArn(this, 'LambdaApiAccessReadRole', stackParameters.readRoleArn) as iam.Role
        );
        apiAccessPolicy.attachToRole(
            iam.Role.fromRoleArn(this, 'LambdaApiAccessWriteRole', stackParameters.writeRoleArn) as iam.Role
        );

        // As this is a nested stack and simply passing an aws resource object is not allowed and there is a lack
        // of functionality to import an existing cloudwatch dashboard, we just create a new one as long as
        // the deployment open search condition is configured as yes.
        const dashboard = new cloudwatch.Dashboard(this, 'CustomAossDashboard', {
            dashboardName: `${cdk.Aws.STACK_NAME}-${cdk.Aws.REGION}-Aoss-Dashboard`,
            periodOverride: cloudwatch.PeriodOverride.AUTO,
            start: 'start',
            end: 'end'
        });

        const openSearchDimensionMap = {
            'ClientId': cdk.Aws.ACCOUNT_ID,
            'CollectionId': this.collection.attrId,
            'CollectionName': collectionsName
        };
        dashboard.addWidgets(
            new cloudwatch.GraphWidget({
                title: MetricNames.INGESTION_DOC_ERRORS,
                left: [
                    new cloudwatch.Metric({
                        color: cloudwatch.Color.BLUE,
                        namespace: CloudwatchNamespace.AOSS,
                        metricName: MetricNames.INGESTION_DOC_ERRORS,
                        dimensionsMap: openSearchDimensionMap,
                        statistic: cloudwatch.Stats.SUM,
                        period: cdk.Duration.hours(1)
                    })
                ]
            }),
            new cloudwatch.GraphWidget({
                title: MetricNames.INGESTION_DOC_ERRORS,
                left: [
                    new cloudwatch.Metric({
                        color: cloudwatch.Color.ORANGE,
                        namespace: CloudwatchNamespace.AOSS,
                        metricName: MetricNames.INGESTION_DOC_ERRORS,
                        dimensionsMap: openSearchDimensionMap,
                        statistic: cloudwatch.Stats.AVERAGE,
                        period: cdk.Duration.hours(1)
                    })
                ]
            }),
            new cloudwatch.GraphWidget({
                title: MetricNames.INGESTION_DOC_ERRORS,
                left: [
                    new cloudwatch.Metric({
                        color: cloudwatch.Color.GREEN,
                        namespace: CloudwatchNamespace.AOSS,
                        metricName: MetricNames.INGESTION_DOC_ERRORS,
                        dimensionsMap: openSearchDimensionMap,
                        statistic: cloudwatch.Stats.AVERAGE,
                        period: cdk.Duration.hours(1)
                    })
                ]
            }),
            new cloudwatch.GraphWidget({
                title: MetricNames.INGESTION_DOC_ERRORS,
                left: [
                    new cloudwatch.Metric({
                        color: cloudwatch.Color.BROWN,
                        namespace: CloudwatchNamespace.AOSS,
                        metricName: MetricNames.INGESTION_DOC_ERRORS,
                        dimensionsMap: openSearchDimensionMap,
                        statistic: cloudwatch.Stats.AVERAGE,
                        period: cdk.Duration.hours(1)
                    })
                ]
            }),
            new cloudwatch.GraphWidget({
                title: MetricNames.INGESTION_DOC_ERRORS,
                left: [
                    new cloudwatch.Metric({
                        color: cloudwatch.Color.PURPLE,
                        namespace: CloudwatchNamespace.AOSS,
                        metricName: MetricNames.INGESTION_DOC_ERRORS,
                        dimensionsMap: openSearchDimensionMap,
                        statistic: cloudwatch.Stats.MAXIMUM,
                        period: cdk.Duration.hours(1)
                    })
                ]
            })
        );

        NagSuppressions.addResourceSuppressions(
            lambdaOpenWritePolicy,
            [
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'The lambda requires access to the all indices under the collection'
                }
            ],
            true
        );

        NagSuppressions.addResourceSuppressions(
            lambdaOpenReadPolicy,
            [
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'The lambda requires access to the all indices under the collection'
                }
            ],
            true
        );
    }
}
