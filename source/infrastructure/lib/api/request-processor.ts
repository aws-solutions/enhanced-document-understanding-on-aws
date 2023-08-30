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
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';

import { EventbridgeToLambda, EventbridgeToLambdaProps } from '@aws-solutions-constructs/aws-eventbridge-lambda';
import {
    COMMERCIAL_REGION_LAMBDA_JAVA_RUNTIME,
    COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME,
    EventSources,
    JAVA_LAMBDA_MEMORY,
    LAMBDA_TIMEOUT_MINS,
    S3_REDACTED_PREFIX,
    S3_UPLOAD_PREFIX,
    WorkflowEventDetailTypes
} from '../utils/constants';

import { Duration } from 'aws-cdk-lib';
import { NagSuppressions } from 'cdk-nag';
import { Construct } from 'constructs';
import { AppAssetBundler } from '../utils/asset-bundling';
import { CaseManager } from './case-manager';
import { RestEndpoint } from './rest-endpoint';

export interface RequestProcessorProps {
    /**
     * The central orchestration bus for events in the system
     */
    orchestratorBus: events.EventBus;

    /**
     * The app namespace to be used when listening to events on the orchestratorBus
     */
    appNamespace: string;

    /**
     * The access logging bucket to be used by the construct when creating an S3 bucket
     */
    s3LoggingBucket: s3.Bucket;

    /**
     * The table which contains the configuration for workflows
     */
    workflowConfigTable: dynamodb.Table;

    /**
     * Name of the config from the workflow-config table to use when setting the config
     * to be used by the Workflow Orchestrator lambda
     */
    workflowConfigName: string;

    /**
     * The UUID to append to CloudFormation resources to ensure their uniqueness. This ID will
     * also be set in the lambda environment variables to be used when interacting some of the AWS resources
     */
    genUUID: string;

    /**
     * Default user email address used to create a cognito user in the user pool.
     */
    defaultUserEmail: string;

    /**
     * The trademark name of the solution
     */
    applicationTrademarkName: string;
}

/**
 * This Construct creates the initial entry point where users can upload documents to be analyzed
 * and processed further. It will create an API Gateway endpoint, an S3 bucket to upload documents
 * and a lambda function that will perform basic validation
 *
 */
export class RequestProcessor extends Construct {
    /**
     * Bucket to upload documents
     */
    public readonly docUploadBucket: [s3.Bucket, s3.Bucket?];

    /**
     * Bucket to store inferences
     */
    public readonly inferenceBucket: [s3.Bucket, s3.Bucket?];

    /**
     * The Gateway to expose external facing APIs
     */
    public readonly apiGateway: apigateway.RestApi;

    /**
     * Lambda function to process requests coming through APIGateway
     */
    public readonly requestProcessFunc: lambda.Function;

    /**
     * Lambda function to process requests coming through APIGateway
     */
    public readonly searchFunc: lambda.Function;

    /**
     * Lambda function to perform workflow orchestration, triggered on document upload and
     * successful execution response events on the custom event bus.
     */
    public readonly workflowOrchestratorFunc: lambda.Function;

    /**
     * Table that stores information about cases and their documents/inferences
     */
    public readonly caseTable: dynamodb.Table;

    /**
     * The UserPool created for authentication
     */
    public readonly extUsrPool: cognito.UserPool;

    /**
     * The UserPoolClient created to allow client apps to sign-in
     */
    public readonly extUserPoolClient: cognito.CfnUserPoolClient;

    /**
     * Cognito external authorizer for external users
     */
    public readonly extUsrAuthorizer: apigateway.CognitoUserPoolsAuthorizer;

    /**
     * The root resource of the API Gateway
     */
    public readonly apiRootResource: apigateway.IResource;

    constructor(scope: Construct, id: string, props: RequestProcessorProps) {
        super(scope, id);

        // creating the buckets where files can be uploaded
        const uploadBucket = new s3.Bucket(this, 'DocumentRepo', {
            encryption: s3.BucketEncryption.S3_MANAGED,
            versioned: false, // NOSONAR - bucket versioning is recommended in the IG, but is not enforced
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            enforceSSL: true,
            serverAccessLogsBucket: props.s3LoggingBucket,
            serverAccessLogsPrefix: 'DocumentRepo/',
            cors: [
                {
                    allowedMethods: [
                        s3.HttpMethods.GET,
                        s3.HttpMethods.POST,
                        s3.HttpMethods.PUT,
                        s3.HttpMethods.DELETE
                    ],
                    allowedOrigins: ['*'],
                    allowedHeaders: ['*']
                }
            ]
        });

        // creating the bucket where inferences (results of workflows) will be stored
        const inferenceBucket = new s3.Bucket(this, 'Inferences', {
            encryption: s3.BucketEncryption.S3_MANAGED,
            versioned: false, // NOSONAR - bucket versioning is recommended in the IG, but is not enforced
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            enforceSSL: true,
            serverAccessLogsBucket: props.s3LoggingBucket,
            serverAccessLogsPrefix: 'Inferences/'
        });

        /*
         * The CaseManager will generate a UUID tagged session and store
         * the s3 location to the dynamodb table. Also responsible for retrieving results when API is called
         */
        const caseManager = new CaseManager(this, 'CaseManager', {
            bucketToUpload: uploadBucket,
            inferenceBucket: inferenceBucket,
            genUUID: props.genUUID,
            workflowConfigName: props.workflowConfigName,
            workflowConfigTable: props.workflowConfigTable
        });

        // responsible for handling redaction requests as posted to the API, so it must be able to read both the upload and inference buckets
        const apiRedactionLambdaFunction = new lambda.Function(scope, 'RedactApiLambda', {
            runtime: COMMERCIAL_REGION_LAMBDA_JAVA_RUNTIME,
            handler: 'com.builder.lambda.RedactionApiHandler',
            code: lambda.Code.fromAsset(
                '../lambda/redact-content',
                AppAssetBundler.assetOptionsFactory
                    .assetOptions(COMMERCIAL_REGION_LAMBDA_JAVA_RUNTIME)
                    .options('../lambda/redact-content/')
            ),
            timeout: Duration.minutes(LAMBDA_TIMEOUT_MINS),
            memorySize: JAVA_LAMBDA_MEMORY,
            environment: {
                S3_INFERENCE_BUCKET_NAME: inferenceBucket.bucketName,
                DOCUMENT_BUCKET_NAME: uploadBucket.bucketName,
                S3_UPLOAD_PREFIX: S3_UPLOAD_PREFIX,
                S3_REDACTED_PREFIX: S3_REDACTED_PREFIX,
                UUID: props.genUUID
            }
        });

        // lambda to back the search lambda. It could use kendra or open search, decided by
        // the required env variable
        const searchLambdaFunction = new lambda.Function(scope, 'SearchLambda', {
            runtime: COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(
                '../lambda/search',
                AppAssetBundler.assetOptionsFactory
                    .assetOptions(COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME)
                    .options('../lambda/search')
            ),
            timeout: cdk.Duration.minutes(LAMBDA_TIMEOUT_MINS)
        });

        // must read from inferences and uploaded files buckets, be able to upload to redacted prefix in upload bucket
        inferenceBucket.grantRead(apiRedactionLambdaFunction);
        uploadBucket.grantRead(apiRedactionLambdaFunction, `${S3_UPLOAD_PREFIX}/*`);
        uploadBucket.grantPut(apiRedactionLambdaFunction, `${S3_REDACTED_PREFIX}/*`);

        const restEndpoint = new RestEndpoint(this, 'Api', {
            postRequestLambda: caseManager.docUploadLambda,
            getRequestLambda: caseManager.fetchRecordLambdaFunction,
            getDocumentLambda: caseManager.generateSignedUrlLambda,
            getInferencesLambda: caseManager.getInferencesLambdaFunction,
            postRedactLambda: apiRedactionLambdaFunction,
            defaultUserEmail: props.defaultUserEmail,
            applicationTrademarkName: props.applicationTrademarkName
        });

        this.searchFunc = searchLambdaFunction;
        this.apiGateway = restEndpoint.apiGateway;
        this.apiRootResource = restEndpoint.apiRootResource;
        this.extUsrPool = restEndpoint.extUsrPool;
        this.extUserPoolClient = restEndpoint.extUsrPoolClient;

        // enable eventBridge notifications on default bus
        const cfnUploadBucket = uploadBucket.node.defaultChild as s3.CfnBucket;
        cfnUploadBucket.notificationConfiguration = {
            eventBridgeConfiguration: {
                eventBridgeEnabled: true
            }
        };

        // Enable workflow orchestrator to be triggered by s3:PutEvents from default bus
        const eventBridgeLambdaProps: EventbridgeToLambdaProps = {
            lambdaFunctionProps: {
                code: lambda.Code.fromAsset(
                    `../lambda/workflow-orchestrator`,
                    AppAssetBundler.assetOptionsFactory
                        .assetOptions(COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME)
                        .options(`../lambda/workflow-orchestrator`)
                ),
                runtime: COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME,
                handler: 'index.handler',
                timeout: cdk.Duration.minutes(LAMBDA_TIMEOUT_MINS),
                environment: {
                    CASE_DDB_TABLE_NAME: caseManager.table.tableName,
                    WORKFLOW_CONFIG_TABLE_NAME: props.workflowConfigTable.tableName,
                    S3_UPLOAD_PREFIX: caseManager.s3UploadPrefix,
                    S3_INFERENCE_BUCKET_NAME: inferenceBucket.bucketName,
                    EVENT_BUS_ARN: props.orchestratorBus.eventBusArn,
                    WORKFLOW_CONFIG_NAME: props.workflowConfigName,
                    UUID: props.genUUID
                }
            },
            eventRuleProps: {
                eventPattern: {
                    source: ['aws.s3'],
                    detailType: ['Object Created'],
                    account: [cdk.Aws.ACCOUNT_ID],
                    region: [cdk.Aws.REGION],
                    detail: {
                        bucket: { name: [{ prefix: uploadBucket.bucketName }] },
                        object: {
                            key: [{ prefix: S3_UPLOAD_PREFIX }]
                        }
                    }
                }
            }
        };

        const defaultBusToWorkflowOrchestrator = new EventbridgeToLambda(
            this,
            'EventOrchestrator',
            eventBridgeLambdaProps
        );

        this.workflowOrchestratorFunc = defaultBusToWorkflowOrchestrator.lambdaFunction;

        // also enable workflow orchestrator to be triggered by workflow failure events
        new EventbridgeToLambda(this, 'EventOrchestratorOnSfnFailure', {
            existingLambdaObj: this.workflowOrchestratorFunc,
            existingEventBusInterface: props.orchestratorBus,
            eventRuleProps: {
                eventPattern: {
                    account: [cdk.Aws.ACCOUNT_ID],
                    region: [cdk.Aws.REGION],
                    source: [`${EventSources.WORKFLOW_STEPFUNCTION}.${props.appNamespace}`],
                    detailType: [WorkflowEventDetailTypes.PROCESSING_FAILURE]
                }
            }
        });

        // add required permissions
        props.workflowConfigTable.grantReadData(this.workflowOrchestratorFunc);
        caseManager.table.grantReadData(this.workflowOrchestratorFunc);
        caseManager.table.grant(this.workflowOrchestratorFunc, 'dynamodb:UpdateItem');
        props.orchestratorBus.grantPutEventsTo(this.workflowOrchestratorFunc);
        inferenceBucket.grantRead(this.workflowOrchestratorFunc);

        uploadBucket.addToResourcePolicy(
            new iam.PolicyStatement({
                resources: [`${uploadBucket.bucketArn}`, `${uploadBucket.bucketArn}/*`],
                actions: ['s3:List*', 's3:Get*'],
                principals: [new iam.ServicePrincipal('textract.amazonaws.com')],
                effect: iam.Effect.ALLOW
            })
        );

        this.docUploadBucket = [uploadBucket, props.s3LoggingBucket];
        this.inferenceBucket = [inferenceBucket, props.s3LoggingBucket];
        this.caseTable = caseManager.table;
        this.extUsrAuthorizer = restEndpoint.extUsrAuthorizer;

        // prettier-ignore
        new cdk.CfnOutput(cdk.Stack.of(this), 'UserPoolId', { // NOSONAR typescript:S1848. Not valid for CDK
            value: this.extUsrPool.userPoolId,
        });

        // prettier-ignore
        new cdk.CfnOutput(cdk.Stack.of(this), 'UserPoolClientId', { // NOSONAR typescript:S1848. Not valid for CDK
            value: this.extUserPoolClient.ref      
        });

        NagSuppressions.addResourceSuppressions(this.workflowOrchestratorFunc.role!, [
            // add suppressions
            {
                id: 'AwsSolutions-IAM5',
                reason: 'The log-group name is not known at this point. Hence the wildcard',
                appliesTo: [
                    'Resource::arn:<AWS::Partition>:logs:<AWS::Region>:<AWS::AccountId>:log-group:/aws/lambda/*'
                ]
            }
        ]);

        NagSuppressions.addResourceSuppressions(
            this.workflowOrchestratorFunc.role!.node.tryFindChild('DefaultPolicy') as iam.Policy,
            [
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'the lambda has been granted read permissions to the inferences bucket',
                    appliesTo: [
                        'Action::s3:GetBucket*',
                        'Action::s3:GetObject*',
                        'Action::s3:List*',
                        'Resource::<RequestProcessorInferences13166F85.Arn>/*'
                    ]
                },
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
                }
            ],
            true
        );

        NagSuppressions.addResourceSuppressions(
            caseManager.generateSignedUrlLambda.role!.node.tryFindChild('DefaultPolicy') as iam.Policy,
            [
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'This lambda is used to generate signed urls for contents in the bucket',
                    appliesTo: [
                        'Action::s3:GetBucket*',
                        'Action::s3:GetObject*',
                        'Action::s3:List*',
                        `Resource::<RequestProcessorDocumentRepo94D336AB.Arn>/${S3_UPLOAD_PREFIX}/*`
                    ]
                }
            ]
        );

        NagSuppressions.addResourceSuppressions(
            apiRedactionLambdaFunction.role!,
            [
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'Providing permission to read from the upload bucket under the upload prefix',
                    appliesTo: [
                        `Resource::<RequestProcessorDocumentRepo94D336AB.Arn>/${S3_UPLOAD_PREFIX}/*`,
                        'Action::s3:GetBucket*',
                        'Action::s3:GetObject*',
                        'Action::s3:List*'
                    ]
                },
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'Providing permission to upload to the upload bucket under the redaction prefix',
                    appliesTo: [
                        `Resource::<RequestProcessorDocumentRepo94D336AB.Arn>/${S3_REDACTED_PREFIX}/*`,
                        'Action::s3:Put*'
                    ]
                },
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'Providing permission to read from the inferences bucket',
                    appliesTo: [
                        'Resource::<RequestProcessorInferences13166F85.Arn>/*',
                        'Action::s3:GetBucket*',
                        'Action::s3:GetObject*',
                        'Action::s3:List*'
                    ]
                },
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'The wildcard "*" is to allow all the Abort actions for this bucket',
                    appliesTo: ['Action::s3:Abort*']
                },
                {
                    id: 'AwsSolutions-IAM4',
                    reason: 'This lambda generates a managed policy to create log groups, log streams and put events.',
                    appliesTo: ['Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole']
                }
            ],
            true
        );

        NagSuppressions.addResourceSuppressions(caseManager.generateSignedUrlLambda.role!, [
            {
                id: 'AwsSolutions-IAM4',
                reason: 'This lambda generates a managed policy to create log groups, log streams and put events.',
                appliesTo: ['Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole']
            }
        ]);

        NagSuppressions.addResourceSuppressions(this.searchFunc.role!, [
            {
                id: 'AwsSolutions-IAM4',
                reason: 'This lambda generates a managed policy to create log groups, log streams and put events.',
                appliesTo: ['Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole']
            }
        ]);
    }
}
