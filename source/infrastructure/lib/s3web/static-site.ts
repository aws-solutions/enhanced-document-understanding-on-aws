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

import { CloudFrontToS3 } from '@aws-solutions-constructs/aws-cloudfront-s3';
import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { NagSuppressions } from 'cdk-nag';
import { Construct } from 'constructs';

/**
 * Interface that defines properties required for the Static Website
 */
export interface StaticWebsiteProps {
    /**
     * The access logging bucket to use for S3 bucket website. The same bucket will also be used for CloudFront logging
     * with a different prefix
     */
    accessLoggingBucket: s3.IBucket;

    /**
     * Arn of the custom resource lambda function to be used to pass as service token
     */
    customResourceLambdaArn: string;

    /**
     * Arn of the custom resource role to add `s3:PutBucketPublicAccessBlock` policy to the logging bucket
     */
    customResourceRoleArn: string;
}

export class StaticWebsite extends Construct {
    /**
     * The static website bucket created by the construct
     */
    public readonly webS3Bucket: s3.Bucket;

    /**
     * The cloudfront (CDN) distribution created by this construct
     */
    public readonly cloudFrontDistribution: cloudfront.Distribution;

    constructor(scope: Construct, id: string, props: StaticWebsiteProps) {
        super(scope, id);

        this.webS3Bucket = new s3.Bucket(this, 'Bucket', {
            encryption: s3.BucketEncryption.S3_MANAGED,
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            enforceSSL: true,
            versioned: false, // NOSONAR - bucket versioning is recommended in the IG, but is not enforced
            serverAccessLogsBucket: props.accessLoggingBucket,
            serverAccessLogsPrefix: 'webappbucket/'
        });

        const bucketPolicyForLambda = new iam.Policy(this, 'LambdaBucketResourcePolicy', {
            document: new iam.PolicyDocument({
                statements: [
                    new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        actions: ['s3:PutBucketPolicy', 's3:GetBucketPolicy', 's3:PutBucketPublicAccessBlock'],
                        resources: [props.accessLoggingBucket.bucketArn]
                    })
                ]
            })
        });
        bucketPolicyForLambda.attachToRole(
            iam.Role.fromRoleArn(this, 'BucketPolicyLambdaRole', props.customResourceRoleArn)
        );

        const cspResponseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(this, 'CSPResponseHeadersPolicy', {
            responseHeadersPolicyName: `eDU-CSP-${cdk.Aws.STACK_NAME}-${cdk.Aws.REGION}`,
            comment: 'CSP Response Headers Policy',
            securityHeadersBehavior: {
                contentSecurityPolicy: {
                    contentSecurityPolicy:
                        "default-src 'self' data: https://*.amazonaws.com; img-src 'self' data: https://*.cloudfront.net https://*.amazonaws.com; script-src 'self' https://*.cloudfront.net https://*.amazonaws.com; style-src 'self' https://*.amazonaws.com; object-src 'self' https://*.amazonaws.com; worker-src 'self' blob:",
                    override: true
                },
                frameOptions: { frameOption: cloudfront.HeadersFrameOption.DENY, override: true }
            }
        });

        const cloudfrontToS3 = new CloudFrontToS3(this, 'UI', {
            existingBucketObj: this.webS3Bucket,
            cloudFrontDistributionProps: {
                enableLogging: true,
                errorResponses: [
                    { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html' },
                    { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html' }
                ],
                logFilePrefix: 'cloudfront/',
                minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2019,
                defaultRootObject: 'login.html',
                defaultBehavior: {
                    responseHeadersPolicy: cspResponseHeadersPolicy
                }
            }
        });

        const cloudFrontLogsLoggingPrefix = 'cloudfrontlogs-logging';

        this.webS3Bucket.policy?.node.addDependency(cloudfrontToS3.cloudFrontWebDistribution);
        cloudfrontToS3.cloudFrontLoggingBucket?.node
            .tryFindChild('Policy')
            ?.node.tryFindChild('Resource')
            ?.node?.addDependency(cloudfrontToS3.cloudFrontLoggingBucket);

        const bucketPolicyUpdateCustomResource = new cdk.CustomResource(this, 'UpdateBucketPolicy', {
            resourceType: 'Custom::UpdateBucketPolicy',
            serviceToken: props.customResourceLambdaArn,
            properties: {
                Resource: 'UPDATE_BUCKET_POLICY',
                SOURCE_BUCKET_NAME: this.webS3Bucket.bucketName,
                LOGGING_BUCKET_NAME: props.accessLoggingBucket.bucketName,
                SOURCE_PREFIX: 'webappbucket'
            }
        });
        bucketPolicyUpdateCustomResource.node.addDependency(bucketPolicyForLambda);
        bucketPolicyUpdateCustomResource.node.addDependency(this.webS3Bucket.policy!);
        bucketPolicyUpdateCustomResource.node.addDependency(cloudfrontToS3.cloudFrontWebDistribution);

        const cloudFrontLoggingUpdateBucketPolicyCustomResource = new cdk.CustomResource(
            this,
            'CloudFrontLoggingUpdateBucketPolicy',
            {
                resourceType: 'Custom::UpdateBucketPolicy',
                serviceToken: props.customResourceLambdaArn,
                properties: {
                    Resource: 'UPDATE_BUCKET_POLICY',
                    SOURCE_BUCKET_NAME: cloudfrontToS3.cloudFrontLoggingBucket?.bucketName,
                    LOGGING_BUCKET_NAME: props.accessLoggingBucket.bucketName,
                    SOURCE_PREFIX: cloudFrontLogsLoggingPrefix
                }
            }
        );
        cloudFrontLoggingUpdateBucketPolicyCustomResource.node.addDependency(bucketPolicyUpdateCustomResource);
        cloudFrontLoggingUpdateBucketPolicyCustomResource.node.addDependency(
            cloudfrontToS3.cloudFrontLoggingBucket!.policy!
        );
        cloudFrontLoggingUpdateBucketPolicyCustomResource.node.addDependency(cloudfrontToS3.cloudFrontWebDistribution);

        const cfnCloudFrontLoggingBucket = cloudfrontToS3.cloudFrontLoggingBucket?.node.defaultChild as s3.CfnBucket;
        cfnCloudFrontLoggingBucket.addPropertyOverride('LoggingConfiguration', {
            DestinationBucketName: {
                'Fn::Select': [
                    0,
                    {
                        'Fn::Split': [
                            '/',
                            {
                                'Fn::Select': [
                                    5,
                                    {
                                        'Fn::Split': [
                                            ':',
                                            {
                                                'Ref': 'AccessLoggingBucketArn'
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            LogFilePrefix: `${cloudFrontLogsLoggingPrefix}/`
        });
        // disabling versioning, since it was disabled in a previous release, enabling
        // versioning now will create a new bucket with an update from the previous version
        cfnCloudFrontLoggingBucket.addPropertyDeletionOverride('VersioningConfiguration');

        cloudfrontToS3.node.tryFindChild('CloudfrontLoggingBucketAccessLog')?.node.tryRemoveChild('Resource');
        cloudfrontToS3.node
            .tryFindChild('CloudfrontLoggingBucketAccessLog')
            ?.node.tryFindChild('Policy')
            ?.node.tryRemoveChild('Resource');

        const cloudfrontFunction = cloudfrontToS3.node
            .tryFindChild('SetHttpSecurityHeaders')
            ?.node.tryFindChild('Resource') as cloudfront.CfnFunction;

        cloudfrontFunction.addPropertyOverride('FunctionConfig.Comment', 'Set HTTP security headers');
        cloudfrontFunction.addPropertyOverride(
            'Name',
            `HTTPSecurityHeaders-${cdk.Aws.REGION}-${crypto.randomUUID().slice(0, 8)}`
        );

        this.cloudFrontDistribution = cloudfrontToS3.cloudFrontWebDistribution;

        // prettier-ignore
        new cdk.CfnOutput(cdk.Stack.of(this), 'WebUrl', { // NOSONAR - Typescript construct instantiation
            value: `https://${this.cloudFrontDistribution.domainName}`
        });

        NagSuppressions.addResourceSuppressions(this.cloudFrontDistribution, [
            {
                id: 'AwsSolutions-CFR2',
                reason: 'WebACLv2 is only supported in us-east-1. Putting a WAF for a CloudFront distribution in this template restricts deployments to us-east-1 region only'
            }
        ]);

        NagSuppressions.addResourceSuppressions(
            cloudfrontToS3.node.tryFindChild('CloudfrontLoggingBucket')!.node.tryFindChild('Resource')!,
            [
                {
                    id: 'AwsSolutions-S1',
                    reason: 'This is a logging bucket for cloudfront, hence no server access logs have been setup'
                }
            ]
        );

        NagSuppressions.addResourceSuppressions(this.cloudFrontDistribution, [
            {
                id: 'AwsSolutions-CFR1',
                reason: 'No requirement for Geo restrictions'
            },
            {
                id: 'AwsSolutions-CFR4',
                reason: 'Because the domain name is unknown for this solution, a default CDN distribution is used. Hence TLSv2 cannot be enforced'
            }
        ]);
    }
}
