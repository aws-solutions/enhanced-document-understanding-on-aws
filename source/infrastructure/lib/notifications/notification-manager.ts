// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3_asset from 'aws-cdk-lib/aws-s3-assets';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as path from 'path';

import {
    COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME,
    EventSources,
    LAMBDA_TIMEOUT_MINS,
    PLACEHOLDER_EMAIL,
    WorkflowEventDetailTypes
} from '../utils/constants';

import { EventbridgeToLambda } from '@aws-solutions-constructs/aws-eventbridge-lambda';
import { LambdaToS3 } from '@aws-solutions-constructs/aws-lambda-s3';
import { LambdaToSns } from '@aws-solutions-constructs/aws-lambda-sns';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { NagSuppressions } from 'cdk-nag';
import { Construct } from 'constructs';
import { AppAssetBundler } from '../utils/asset-bundling';
import { getResourceProperties } from '../utils/common-utils';

export interface NotificationManagerProps {
    /**
     * The central orchestration bus for events in the system
     */
    orchestratorBus: events.EventBus;

    /**
     * The bucket to setup configuration settings for the bucket
     */
    appConfigBucket: s3.Bucket;

    /**
     * The namespace associated for events to listen to from EventBus.
     */
    appNamespace: string;

    /**
     * reference to the AWS CloudFormation custom resource lambda function definition
     */
    customResourceLambda: lambda.Function;

    /**
     * Optional email to receive the notifications published to SNS by the notification manager lambda
     */
    subscriptionEmail?: string;
}

/**
 * This construct creates the resource and setup to deploy the functionality required to send
 * out notifications from the application. When the construct is deployed:
 *
 * - bundles a folder containing various email templates for notifications to be
 * used by the application and
 *
 * - provisions a lambda function that reads the template, makes necessary substitutions
 * and sends out an SNS notification based on the subscription
 *
 * - Creates and subscribes to the SNS topic in question
 */
export class NotificationManager extends Construct {
    /**
     * The lambda function that sends out notification (as part of Notification Manager)
     */
    public readonly lambdaFunction: lambda.Function;

    /**
     * The custom resource that will transfer templates from the assets to the destination bucket
     */
    public readonly emailTemplatesCustomResource: cdk.CustomResource;

    /**
     * The topic which we publish notifications to
     */
    public readonly snsTopic: sns.Topic;

    constructor(scope: Construct, id: string, props: NotificationManagerProps) {
        super(scope, id);

        // creates the send-notification lambda along with the rule which triggers it for processing complete events
        const customEventBusToNotificationLambdaComplete = new EventbridgeToLambda(
            this,
            'EventRuleToCompleteNotification',
            {
                lambdaFunctionProps: {
                    runtime: COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME,
                    handler: 'index.handler',
                    code: lambda.Code.fromAsset(
                        '../lambda/send-notification',
                        AppAssetBundler.assetOptionsFactory
                            .assetOptions(COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME)
                            .options('../lambda/send-notification')
                    ),
                    timeout: cdk.Duration.minutes(LAMBDA_TIMEOUT_MINS),
                    description: 'This lambda function sends out SNS notification based on the input event received'
                },
                existingEventBusInterface: props.orchestratorBus,
                eventRuleProps: {
                    eventBus: props.orchestratorBus,
                    eventPattern: {
                        account: [cdk.Aws.ACCOUNT_ID],
                        region: [cdk.Aws.REGION],
                        source: [`${EventSources.WORKFLOW_ORCHESTRATOR}.${props.appNamespace}`],
                        detailType: [WorkflowEventDetailTypes.PROCESSING_COMPLETE]
                    }
                }
            }
        );
        const sendNotificationLambda = customEventBusToNotificationLambdaComplete.lambdaFunction;

        // adds a rule which triggers the send-notification lambda for any workflow failures
        new EventbridgeToLambda(this, 'EventRuleToFailureNotification', {
            existingLambdaObj: sendNotificationLambda,
            existingEventBusInterface: props.orchestratorBus,
            eventRuleProps: {
                eventBus: props.orchestratorBus,
                eventPattern: {
                    account: [cdk.Aws.ACCOUNT_ID],
                    region: [cdk.Aws.REGION],
                    source: [`${EventSources.WORKFLOW_STEPFUNCTION}.${props.appNamespace}`],
                    detailType: [WorkflowEventDetailTypes.PROCESSING_FAILURE]
                }
            }
        });

        new LambdaToS3(this, 'LambdaToS3', {
            existingLambdaObj: sendNotificationLambda,
            existingBucketObj: props.appConfigBucket,
            bucketPermissions: ['Read'],
            bucketEnvironmentVariableName: 'TEMPLATES_BUCKET_NAME'
        });

        sendNotificationLambda.addEnvironment('TEMPLATE_PREFIX', 'email-templates/');

        const lambdaToSns = new LambdaToSns(this, 'LambdaToSNS', {
            existingLambdaObj: sendNotificationLambda,
            topicProps: {
                displayName: 'Send notification topic'
            }
        });

        if (props.subscriptionEmail && props.subscriptionEmail !== PLACEHOLDER_EMAIL) {
            lambdaToSns.snsTopic.addSubscription(new EmailSubscription(props.subscriptionEmail));
        }

        const emailTemplate = new s3_asset.Asset(this, 'EmailTemplates', {
            path: path.join(__dirname, '../../../email-templates/')
        });

        props.appConfigBucket.grantReadWrite(props.customResourceLambda.role as iam.Role);

        this.emailTemplatesCustomResource = new cdk.CustomResource(this, 'CopyTemplates', {
            resourceType: 'Custom::CopyTemplates',
            serviceToken: props.customResourceLambda.functionArn,
            properties: {
                ...getResourceProperties(this, emailTemplate, props.customResourceLambda),
                Resource: 'COPY_TEMPLATE',
                DESTINATION_BUCKET_NAME: props.appConfigBucket.bucketName,
                DESTINATION_PREFIX: 'email-templates'
            }
        });

        this.snsTopic = lambdaToSns.snsTopic;
        this.lambdaFunction = sendNotificationLambda;

        NagSuppressions.addResourceSuppressions(sendNotificationLambda.role!, [
            {
                id: 'AwsSolutions-IAM5',
                reason: 'Lambda functions has the required permission to write CloudWatch Logs. It uses custom policy instead of arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole with tighter permissions.',
                appliesTo: [
                    'Resource::arn:<AWS::Partition>:logs:<AWS::Region>:<AWS::AccountId>:log-group:/aws/lambda/*'
                ]
            }
        ]);

        NagSuppressions.addResourceSuppressions(
            sendNotificationLambda.role!.node.tryFindChild('DefaultPolicy') as iam.Policy,
            [
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'Lambda role policy is configured to read data from S3 bucket',
                    appliesTo: [
                        'Action::s3:GetBucket*',
                        'Action::s3:GetObject*',
                        'Action::s3:List*',
                        'Resource::<SetupAppConfig016B0097.Arn>/*',
                        'Resource::*'
                    ]
                }
            ]
        );

        NagSuppressions.addResourceSuppressions(
            props.customResourceLambda.role!.node.tryFindChild('DefaultPolicy') as iam.Policy,
            [
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'Custom resource lambda is configured to read and write from App Config bucket',
                    appliesTo: ['Action::s3:GetBucket*', 'Action::s3:GetObject*', 'Action::s3:List*']
                }
            ],
            true
        );
    }
}
