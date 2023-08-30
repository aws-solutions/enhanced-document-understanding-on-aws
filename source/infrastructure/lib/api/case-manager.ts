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
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';

import {
    COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME,
    LAMBDA_TIMEOUT_MINS,
    S3_REDACTED_PREFIX,
    S3_UPLOAD_PREFIX
} from '../utils/constants';

import { LambdaToDynamoDB } from '@aws-solutions-constructs/aws-lambda-dynamodb';
import { NagSuppressions } from 'cdk-nag';
import { Construct } from 'constructs';
import { AppAssetBundler } from '../utils/asset-bundling';

export interface CaseManagerProps {
    /**
     * Bucket to upload documents
     */
    bucketToUpload: s3.Bucket;

    /**
     * Bucket to retrieve inferences (workflow results) from
     */
    inferenceBucket: s3.Bucket;

    /**
     * UUID generated in the parent stack that can be used to append to resource logical ids
     */
    genUUID: string;

    /* Name of the currently active workflow config. Will be used by the docUploadLambda to disallow uploads when we
     * have already reached max documents for a case per the config.
     */
    workflowConfigName: string;

    /**
     * The table which contains the configuration for workflows
     */
    workflowConfigTable: dynamodb.Table;
}

/**
 * This Construct creates the resources for case management functions, such as document upload,
 * fetching cases/document records and inferences post processing
 *
 */
export class CaseManager extends Construct {
    /**
     * The lambda function to handle document uploads, with minimal permissions to lambda
     */
    public readonly docUploadLambda: lambda.Function;

    /**
     * The lambda function for Case Manager to fetch records and documents
     */
    public readonly fetchRecordLambdaFunction: lambda.Function;

    /**
     * The lambda to generate signed urls to get documents
     */
    public readonly generateSignedUrlLambda: lambda.Function;

    /**
     * The lambda to back the get inference results end-point
     */
    public readonly getInferencesLambdaFunction: lambda.Function;

    /**
     * The dynamodb table where all cases are stored by the case manager
     */
    public readonly table: dynamodb.Table;

    /**
     * The key prefix pattern for user uploaded documents will be /S3_UPLOAD_PREFIX/<CaseId>/<docId>.<extension>
     */
    public readonly s3UploadPrefix: string = S3_UPLOAD_PREFIX;

    constructor(scope: Construct, id: string, props: CaseManagerProps) {
        super(scope, id);

        const createRecordsLambdaToDynamoDb = new LambdaToDynamoDB(this, 'CreateRecordsLambdaDDb', {
            lambdaFunctionProps: {
                runtime: COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME,
                handler: 'index.handler',
                code: lambda.Code.fromAsset(
                    '../lambda/upload-document',
                    AppAssetBundler.assetOptionsFactory
                        .assetOptions(COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME)
                        .options('../lambda/upload-document')
                ),
                environment: {
                    UPLOAD_DOCS_BUCKET_NAME: props.bucketToUpload.bucketName,
                    S3_UPLOAD_PREFIX: this.s3UploadPrefix,
                    UUID: props.genUUID,
                    WORKFLOW_CONFIG_NAME: props.workflowConfigName
                },
                timeout: cdk.Duration.minutes(10)
            },
            dynamoTableProps: {
                partitionKey: {
                    name: 'CASE_ID',
                    type: dynamodb.AttributeType.STRING
                },
                sortKey: {
                    name: 'DOCUMENT_ID',
                    type: dynamodb.AttributeType.STRING
                },
                pointInTimeRecovery: true
            },
            tablePermissions: 'ReadWrite',
            tableEnvironmentVariableName: 'CASE_DDB_TABLE_NAME' // the construct automatically populates this
        });

        new LambdaToDynamoDB(this, 'CreateRecordsLambdaReadConfigDdb', {
            existingLambdaObj: createRecordsLambdaToDynamoDb.lambdaFunction,
            existingTableObj: props.workflowConfigTable,
            tablePermissions: 'Read',
            tableEnvironmentVariableName: 'WORKFLOW_CONFIG_TABLE_NAME'
        });

        const globalSecondaryIndexProps: dynamodb.GlobalSecondaryIndexProps = {
            indexName: 'UserIdIndex',
            partitionKey: {
                name: 'USER_ID',
                type: dynamodb.AttributeType.STRING
            },
            projectionType: dynamodb.ProjectionType.ALL,
            sortKey: {
                name: 'CASE_ID',
                type: dynamodb.AttributeType.STRING
            }
        };
        createRecordsLambdaToDynamoDb.dynamoTable.addGlobalSecondaryIndex(globalSecondaryIndexProps);

        this.docUploadLambda = createRecordsLambdaToDynamoDb.lambdaFunction;
        this.table = createRecordsLambdaToDynamoDb.dynamoTable;
        props.bucketToUpload.grantPut(this.docUploadLambda, `${this.s3UploadPrefix}/*`);

        // responsible for retrieving records from the case table in ddb
        const getRecordsLambdaToDynamoDb = new LambdaToDynamoDB(this, 'FetchRecordsLambdaDdb', {
            existingTableObj: createRecordsLambdaToDynamoDb.dynamoTable,
            lambdaFunctionProps: {
                runtime: COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME,
                handler: 'index.handler',
                code: lambda.Code.fromAsset(
                    '../lambda/fetch-records',
                    AppAssetBundler.assetOptionsFactory
                        .assetOptions(COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME)
                        .options('../lambda/fetch-records')
                ),
                memorySize: 192,
                timeout: cdk.Duration.minutes(LAMBDA_TIMEOUT_MINS),
                environment: {
                    DDB_GSI_USER_ID: globalSecondaryIndexProps.indexName,
                    S3_REDACTED_PREFIX: S3_REDACTED_PREFIX
                }
            },
            tablePermissions: 'Read',
            tableEnvironmentVariableName: 'CASE_DDB_TABLE_NAME' // the construct automatically populates this
        });
        this.fetchRecordLambdaFunction = getRecordsLambdaToDynamoDb.lambdaFunction;

        // responsible for creating pre-signed URLs to allow reading of documents from the s3 bucket
        this.generateSignedUrlLambda = new lambda.Function(scope, 'GetDocumentUrlLambda', {
            code: lambda.Code.fromAsset(
                '../lambda/create-presigned-url',
                AppAssetBundler.assetOptionsFactory
                    .assetOptions(COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME)
                    .options('../lambda/create-presigned-url')
            ),
            runtime: COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME,
            handler: 'index.handler',
            environment: {
                UPLOAD_DOCS_BUCKET_NAME: props.bucketToUpload.bucketName,
                S3_UPLOAD_PREFIX: this.s3UploadPrefix
            },
            timeout: cdk.Duration.minutes(LAMBDA_TIMEOUT_MINS)
        });

        // responsible for retrieving inferences, so it must be able to read the DDB table and the inferences s3 bucket
        this.getInferencesLambdaFunction = new lambda.Function(scope, 'GetInferencesLambda', {
            code: lambda.Code.fromAsset(
                '../lambda/get-inferences',
                AppAssetBundler.assetOptionsFactory
                    .assetOptions(COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME)
                    .options('../lambda/get-inferences')
            ),
            runtime: COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME,
            handler: 'index.handler',
            environment: {
                S3_INFERENCE_BUCKET_NAME: props.inferenceBucket.bucketName,
                CASE_DDB_TABLE_NAME: this.table.tableName
            },
            timeout: cdk.Duration.minutes(LAMBDA_TIMEOUT_MINS)
        });

        // grant s3:GetObject permission to the lambda function
        this.generateSignedUrlLambda.addToRolePolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                resources: [
                    `${props.bucketToUpload.bucketArn}/${this.s3UploadPrefix}/*`,
                    `${props.bucketToUpload.bucketArn}/${S3_REDACTED_PREFIX}/*`
                ],
                actions: ['s3:GetObject*']
            })
        );

        props.inferenceBucket.grantRead(this.getInferencesLambdaFunction);
        this.table.grantReadData(this.getInferencesLambdaFunction);

        this.fetchRecordLambdaFunction.addToRolePolicy(
            new iam.PolicyStatement({
                resources: [`${props.bucketToUpload.bucketArn}/${S3_REDACTED_PREFIX}/*`],
                actions: ['s3:GetObject', 's3:GetObjectAttributes'],
                effect: iam.Effect.ALLOW
            })
        );

        NagSuppressions.addResourceSuppressions(
            this.docUploadLambda.role!,
            [
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'The lambda requires access to the dynamoDB table, which has a GSI, hence CDK generates a /index/* resource',
                    appliesTo: [
                        'Resource::<RequestProcessorCaseManagerCreateRecordsLambdaDDbDynamoTable94F42CFC.Arn>/index/*'
                    ]
                },
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'Lambda needs the following minimum required permissions to send trace data to X-Ray and access ENIs in a VPC.',
                    appliesTo: ['Resource::*']
                },
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'The wildcard "*" is to allow all the Abort actions for this bucket',
                    appliesTo: ['Action::s3:Abort*']
                },
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'Providing a key prefix to further restrict access within the upload bucket',
                    appliesTo: [`Resource::<RequestProcessorDocumentRepo94D336AB.Arn>/${this.s3UploadPrefix}/*`]
                },
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'The wildcard "*" is to allow lambda to read contents of bucket',
                    appliesTo: ['Action::s3:GetBucket*', 'Action::s3:GetObject*', 'Action::s3:List*']
                },
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'The log-group name is not known at this point. Hence the wildcard',
                    appliesTo: [
                        'Resource::arn:<AWS::Partition>:logs:<AWS::Region>:<AWS::AccountId>:log-group:/aws/lambda/*'
                    ]
                }
            ],
            true
        );

        NagSuppressions.addResourceSuppressions(
            this.getInferencesLambdaFunction.role!,
            [
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'The lambda requires access to the dynamoDB table, which has a GSI, hence CDK generates a /index/* resource',
                    appliesTo: [
                        'Resource::<RequestProcessorCaseManagerCreateRecordsLambdaDDbDynamoTable94F42CFC.Arn>/index/*'
                    ]
                },
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'Lambda needs the following minimum required permissions to send trace data to X-Ray and access ENIs in a VPC.',
                    appliesTo: ['Resource::*']
                },
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'Providing permission to inferences bucket to read its contents',
                    appliesTo: [
                        'Resource::<RequestProcessorInferences13166F85.Arn>/*',
                        'Action::s3:GetBucket*',
                        'Action::s3:GetObject*',
                        'Action::s3:List*'
                    ]
                },
                {
                    id: 'AwsSolutions-IAM4',
                    reason: 'This lambda generates a managed policy to create log groups, log streams and put events.',
                    appliesTo: ['Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole']
                }
            ],
            true
        );

        NagSuppressions.addResourceSuppressions(
            this.fetchRecordLambdaFunction.role!,
            [
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'The lambda requires access to the dynamoDB table, which has a GSI, hence CDK generates a /index/* resource',
                    appliesTo: [
                        'Resource::<RequestProcessorCaseManagerCreateRecordsLambdaDDbDynamoTable94F42CFC.Arn>/index/*'
                    ]
                },
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'The lambda requires access to the bucket containing redacted document, with prefix redacted',
                    appliesTo: [`Resource::<RequestProcessorDocumentRepo94D336AB.Arn>/redacted/*`]
                },
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'Lambda needs the following minimum required permissions to send trace data to X-Ray and access ENIs in a VPC.',
                    appliesTo: ['Resource::*']
                },
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'The log-group name is not known at this point. Hence the wildcard',
                    appliesTo: [
                        'Resource::arn:<AWS::Partition>:logs:<AWS::Region>:<AWS::AccountId>:log-group:/aws/lambda/*'
                    ]
                }
            ],
            true
        );

        NagSuppressions.addResourceSuppressions(
            this.generateSignedUrlLambda.role!,
            [
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'Providing a key prefix to further restrict access within the bucket',
                    appliesTo: [
                        `Resource::<RequestProcessorDocumentRepo94D336AB.Arn>/${this.s3UploadPrefix}/*`,
                        `Resource::<RequestProcessorDocumentRepo94D336AB.Arn>/${S3_REDACTED_PREFIX}/*`
                    ]
                }
            ],
            true
        );
    }
}
