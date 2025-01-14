#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kendra from 'aws-cdk-lib/aws-kendra';
import * as kms from 'aws-cdk-lib/aws-kms';
import { KendraAttributes } from '../utils/constants';

import { Construct, IConstruct } from 'constructs';

import { NagSuppressions } from 'cdk-nag';

export class KendraParameters {
    /**
     * The amount of extra query capacity for an index and [GetQuerySuggestions](https://docs.aws.amazon.com/kendra/latest/dg/API_GetQuerySuggestions.html) capacity.
     * A single extra capacity unit for an index provides 0.1 queries per second or approximately 8,000 queries per day.
     *
     * See: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-kendra-index-capacityunitsconfiguration.html#cfn-kendra-index-capacityunitsconfiguration-querycapacityunits
     */
    public readonly queryCapacityUnits?: number;

    /**
     * The amount of extra storage capacity for an index. A single capacity unit provides 30 GB of storage space or 100,000 documents, whichever is reached first.
     *
     * See: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-kendra-index-capacityunitsconfiguration.html#cfn-kendra-index-capacityunitsconfiguration-storagecapacityunits
     */
    public readonly storageCapacityUnits?: number;

    /**
     * The Kendra edition subscription. Choice between 'DEVELOPER' and 'ENTERPRISE'
     */
    public readonly edition: string;

    /**
     * The Arn of the Role that will write to this index
     */
    public readonly roleArn: string;

    /**
     * The Arn of the Role that will query the index
     */
    public readonly queryLambdaRoleArn: string;

    /**
     * The lambda function Arn that can query the indexed storages (Kendra Index)
     */
    public readonly searchLambdaArn: string;

    /**
     * The document bucket name that will be used to add policy to Kendra Index
     */
    public readonly documentBucketName: string;

    /**
     * The user pool id will be used to add ACLs to Kendra Index
     */
    public readonly userPoolId: string;

    constructor(stack: IConstruct) {
        this.queryCapacityUnits = new cdk.CfnParameter(stack, 'QueryCapacityUnits', {
            type: 'Number',
            description:
                'The amount of extra query capacity for an index and [GetQuerySuggestions](https://docs.aws.amazon.com/kendra/latest/dg/API_GetQuerySuggestions.html) capacity.' +
                'A single extra capacity unit for an index provides 0.1 queries per second or approximately 8,000 queries per day.',
            default: '0',
            minValue: 0,
            maxValue: 1 // since Kendra can get expensive with additional capacity, the maxValue is to ensure customers dont select a higher value unless they really need it
        }).valueAsNumber;

        this.storageCapacityUnits = new cdk.CfnParameter(stack, 'StorageCapacityUnits', {
            type: 'Number',
            description:
                'The amount of extra storage capacity for an index. A single capacity unit provides 30 GB of storage space or 100,000 documents, whichever is reached first.',
            default: '0',
            minValue: 0,
            maxValue: 5 // since Kendra can get expensive with additional capacity, the maxValue is to ensure customers dont select a higher value unless they really need it
        }).valueAsNumber;

        this.edition = new cdk.CfnParameter(stack, 'KendraIndexEdition', {
            type: 'String',
            allowedValues: ['DEVELOPER_EDITION', 'ENTERPRISE_EDITION'],
            default: 'DEVELOPER_EDITION',
            description: 'Indicates whether the index is a Enterprise Edition index or a Developer Edition index',
            constraintDescription: 'You can only choose between "DEVELOPER_EDITION" OR "ENTERPRISE_EDITION"'
        }).valueAsString;

        this.roleArn = new cdk.CfnParameter(stack, 'RoleArn', {
            type: 'String',
            allowedPattern: '^arn:(aws|aws-cn|aws-us-gov):iam::\\d{12}:role\\/\\S+$',
            constraintDescription: 'Please provide a valid IAM Role Arn',
            description: 'The role Arn which will write to the Kendra Index'
        }).valueAsString;

        // create new cfnParameter to read iam role arn
        this.queryLambdaRoleArn = new cdk.CfnParameter(stack, 'QueryLambdaRoleArn', {
            type: 'String',
            allowedPattern: '^arn:(aws|aws-cn|aws-us-gov):iam::\\d{12}:role\\/\\S+$',
            constraintDescription: 'Please provide a valid IAM Role Arn',
            description: 'The role Arn which will query the Kendra Index'
        }).valueAsString;

        // create new cfnParameter to read Document Bucket Name
        this.documentBucketName = new cdk.CfnParameter(stack, 'DocumentBucketName', {
            type: 'String',
            constraintDescription: 'Please provide a valid Document Bucket Name',
            description: 'The Document Bucket Name will be used to add policy to Kendra Index'
        }).valueAsString;

        // create new cfnParameter to read UserPoolId. Using only external userpool id for v2.0.x
        this.userPoolId = new cdk.CfnParameter(stack, 'ExtUserPoolId', {
            type: 'String',
            constraintDescription: 'Please provide a valid cognito user pool id',
            description: 'The user pool id will be used to add ACLs to Kendra Index',
            allowedPattern: '^[a-zA-Z0-9-_]+$'
        }).valueAsString;
    }
}

export class KendraCaseStorage extends cdk.NestedStack {
    /**
     * KMS managed key for accessing kendra
     */
    public readonly kendraKMSKey: kms.Key;

    /**
     * The AWS Kendra index for searching.
     */
    public readonly kendraCaseSearchIndex: kendra.CfnIndex;

    /**
     * An IAM role that can be assumed in order to access the kendra service
     */
    public readonly kendraCaseSearchRole: iam.Role;

    /**
     * AWS Kendra role arn that can be assumed in order to access the kendra service
     */
    public readonly kendraRoleArn: string;

    constructor(scope: Construct, id: string, props: cdk.NestedStackProps) {
        super(scope, id, props);
        const stackParameters = new KendraParameters(cdk.Stack.of(this));

        this.kendraCaseSearchRole = this.createKendraIAMRole(stackParameters.documentBucketName);
        this.kendraRoleArn = this.kendraCaseSearchRole.roleArn;

        this.kendraKMSKey = new kms.Key(this, 'KendraIndexEncryptionKey', {
            enableKeyRotation: true
        });
        this.kendraKMSKey.grantEncryptDecrypt(this.kendraCaseSearchRole);

        this.kendraCaseSearchIndex = this.createKendraIndex(stackParameters);

        const lambdaKendraIndexPolicy = new iam.Policy(this, 'KendraIndexPolicy', {
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        'kendra:BatchPutDocument',
                        'kendra:SubmitFeedback',
                        'kendra:BatchDeleteDocument',
                        'kendra:Query'
                    ],
                    resources: [`${this.kendraCaseSearchIndex.attrArn}`]
                }),
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['iam:PassRole'],
                    resources: [`${this.kendraRoleArn}`]
                })
            ]
        });
        lambdaKendraIndexPolicy.attachToRole(
            iam.Role.fromRoleArn(this, 'LambdaKendraRole', stackParameters.roleArn) as iam.Role
        );

        const lambdaQueryKendraIndexPolicy = new iam.Policy(this, 'LambdaQueryKendraIndexPolicy', {
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['kendra:Query', 'kendra:SubmitFeedback'],
                    resources: [`${this.kendraCaseSearchIndex.attrArn}`]
                })
            ]
        });
        lambdaQueryKendraIndexPolicy.attachToRole(
            iam.Role.fromRoleArn(this, 'LambdaQueryKendraRole', stackParameters.queryLambdaRoleArn) as iam.Role
        );

        // cfnag suppressions
        NagSuppressions.addResourceSuppressions(
            this.kendraCaseSearchRole.node.tryFindChild('DefaultPolicy') as iam.CfnPolicy,
            [
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'Kendra needs this permission to allow logging',
                    appliesTo: [
                        'Resource::arn:<AWS::Partition>:logs:<AWS::Region>:<AWS::AccountId>:log-group:/aws/kendra/*',
                        'Resource::arn:<AWS::Partition>:logs:<AWS::Region>:<AWS::AccountId>:log-group:/aws/kendra/*:log-stream:*'
                    ]
                },
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'Kendra needs the ability to generate keys and re-encrypt. This is granted by kendraKMSKey.grantEncryptDecrypt',
                    appliesTo: ['Action::kms:GenerateDataKey*', 'Action::kms:ReEncrypt*']
                },
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'This permission is required for logs:DescribeLogGroups and cloudwatch:PutMetricData as per https://docs.aws.amazon.com/kendra/latest/dg/iam-roles.html ',
                    appliesTo: ['Action::cloudwatch:PutMetricData', 'Action::logs:DescribeLogGroups', 'Resource::*']
                },
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'Kendra Index needs this permission to read documents from S3 bucket',
                    appliesTo: ['Resource::arn:<AWS::Partition>:s3:::<DocumentBucketName>/*']
                }
            ]
        );
    }

    /**
     * Handles creation of kendra index with given properties
     *
     * @param props properties as passed from constructor
     * @returns CfnIndex. the created kendra index ()
     */
    private createKendraIndex(props: KendraParameters) {
        const kendraProps = {
            capacityUnits: {
                queryCapacityUnits: props.queryCapacityUnits ?? 0,
                storageCapacityUnits: props.storageCapacityUnits ?? 0
            },
            description: 'a kendra index for searching processed documents',
            documentMetadataConfigurations: [
                {
                    name: `${KendraAttributes.CASE_ID}`,
                    type: 'STRING_VALUE',
                    search: {
                        facetable: true,
                        sortable: true,
                        searchable: true,
                        displayable: true
                    }
                },
                {
                    name: `${KendraAttributes.DOC_ID}`,
                    type: 'STRING_VALUE',
                    search: {
                        facetable: true,
                        sortable: true,
                        searchable: true,
                        displayable: true
                    }
                },
                {
                    name: `${KendraAttributes.DOC_TYPE}`,
                    type: 'STRING_VALUE',
                    search: {
                        facetable: true,
                        sortable: true,
                        searchable: true,
                        displayable: true
                    }
                },
                {
                    name: `${KendraAttributes.FILE_NAME}`,
                    type: 'STRING_VALUE',
                    search: {
                        facetable: true,
                        sortable: true,
                        searchable: true,
                        displayable: true
                    }
                },
                {
                    name: `${KendraAttributes.FILE_TYPE}`,
                    type: 'STRING_VALUE',
                    search: {
                        facetable: true,
                        sortable: true,
                        searchable: true,
                        displayable: true
                    }
                }
            ],
            edition: props.edition,
            name: 'KendraCaseSearchIndex',
            roleArn: this.kendraCaseSearchRole.roleArn,
            serverSideEncryptionConfiguration: {
                kmsKeyId: this.kendraKMSKey.keyId
            },
            userContextPolicy: 'USER_TOKEN',
            userTokenConfigurations: [
                {
                    jwtTokenTypeConfiguration: {
                        keyLocation: 'URL',
                        issuer: `https://cognito-idp.${cdk.Aws.REGION}.amazonaws.com/${props.userPoolId}`,
                        userNameAttributeField: 'cognito:username',
                        groupAttributeField: 'cognito:groups',
                        url: `https://cognito-idp.${cdk.Aws.REGION}.amazonaws.com/${props.userPoolId}/.well-known/jwks.json`
                    }
                }
            ]
        } as kendra.CfnIndexProps;

        let kendraCaseSearchIndex = new kendra.CfnIndex(this, 'KendraCaseSearch', kendraProps);

        return kendraCaseSearchIndex;
    }

    /**
     * Creates an IAM role which will be assigned to the kendra index, allowing it to perform logging functions
     *
     * @param scope The construct as passed from the constructor which the IAM role will be created in
     * @returns the IAM role
     */
    private createKendraIAMRole(bucketName: string): iam.Role {
        const kendraRole = new iam.Role(this, 'KendraRole', {
            assumedBy: new iam.ServicePrincipal('kendra.amazonaws.com')
        });

        kendraRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['cloudwatch:PutMetricData'],
                resources: ['*'],
                conditions: { StringEquals: { 'cloudwatch:namespace': 'AWS/Kendra' } }
            })
        );

        kendraRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['logs:DescribeLogGroups'],
                resources: ['*'],
                conditions: { StringEquals: { 'cloudwatch:namespace': 'AWS/Kendra' } }
            })
        );

        kendraRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['logs:CreateLogGroup'],
                resources: [
                    `arn:${cdk.Aws.PARTITION}:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:/aws/kendra/*`
                ]
            })
        );

        kendraRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['logs:DescribeLogStreams', 'logs:CreateLogStream', 'logs:PutLogEvents'],
                resources: [
                    `arn:${cdk.Aws.PARTITION}:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:/aws/kendra/*:log-stream:*`
                ]
            })
        );

        kendraRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['s3:GetObject'],
                resources: [`arn:${cdk.Aws.PARTITION}:s3:::${bucketName}/*`]
            })
        );

        return kendraRole;
    }
}
