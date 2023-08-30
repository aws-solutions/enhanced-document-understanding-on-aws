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
 **********************************************************************************************************************/

import * as cdk from 'aws-cdk-lib';

import { Capture, Match, Template } from 'aws-cdk-lib/assertions';
import { S3_REDACTED_PREFIX, S3_UPLOAD_PREFIX } from '../../../lib/utils/constants';

import { RedactionWorkflow } from '../../../lib/workflow/redaction/redaction-workflow';

describe('When creating redaction Workflow', () => {
    let nestedStack: RedactionWorkflow;
    let template: Template;

    beforeAll(() => {
        const app = new cdk.App();
        const stack = new cdk.Stack(app, 'TestStack');
        nestedStack = new RedactionWorkflow(stack, 'RedactionWorkflowStack');
        template = Template.fromStack(nestedStack);
    });

    const requestProcessorBucket = new Capture();
    const dlq = new Capture();

    it('should create the lambda function', () => {
        template.resourceCountIs('AWS::Lambda::Function', 1);
        template.hasResourceProperties('AWS::Lambda::Function', {
            Runtime: 'java17',
            Handler: 'com.builder.lambda.RedactionSfnHandler',
            Code: {
                S3Bucket: {
                    'Fn::Sub': Match.anyValue()
                },
                S3Key: Match.anyValue()
            },
            Role: {
                'Fn::GetAtt': Match.anyValue()
            },
            Environment: {
                Variables: {
                    CASE_DDB_TABLE_NAME: {
                        'Fn::Select': Match.anyValue()
                    },
                    DOCUMENT_BUCKET_NAME: {
                        // this complex subpath is because cfn extracts the bucket name from the arn
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
                                                        'Ref': requestProcessorBucket
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    S3_UPLOAD_PREFIX: S3_UPLOAD_PREFIX,
                    S3_REDACTED_PREFIX: S3_REDACTED_PREFIX,
                    UUID: {
                        Ref: 'GenUUID'
                    }
                }
            }
        });
    });

    it('should have policy for r/w to upload and inference bucket, and update case ddb table', () => {
        let ddbTableCapture = new Capture();
        let inferencesBucketCapture = new Capture();

        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyDocument: {
                Statement: [
                    Match.anyValue(),
                    Match.anyValue(),
                    {
                        Action: [
                            's3:GetObject*',
                            's3:GetBucket*',
                            's3:List*',
                            's3:DeleteObject*',
                            's3:PutObject',
                            's3:PutObjectLegalHold',
                            's3:PutObjectRetention',
                            's3:PutObjectTagging',
                            's3:PutObjectVersionTagging',
                            's3:Abort*'
                        ],
                        Effect: 'Allow',
                        Resource: [
                            {
                                'Ref': inferencesBucketCapture
                            },
                            {
                                'Fn::Join': [
                                    '',
                                    [
                                        {
                                            'Ref': inferencesBucketCapture
                                        },
                                        '/*'
                                    ]
                                ]
                            }
                        ]
                    },
                    {
                        Action: [
                            'dynamodb:BatchGetItem',
                            'dynamodb:GetRecords',
                            'dynamodb:GetShardIterator',
                            'dynamodb:Query',
                            'dynamodb:GetItem',
                            'dynamodb:Scan',
                            'dynamodb:ConditionCheckItem',
                            'dynamodb:DescribeTable'
                        ],
                        Effect: 'Allow',
                        Resource: [
                            {
                                'Ref': ddbTableCapture
                            },
                            {
                                'Ref': 'AWS::NoValue'
                            }
                        ]
                    },
                    {
                        Action: 'dynamodb:UpdateItem',
                        Effect: 'Allow',
                        Resource: [
                            {
                                'Ref': ddbTableCapture
                            },
                            {
                                'Ref': 'AWS::NoValue'
                            }
                        ]
                    },
                    {
                        Action: [
                            's3:GetObject*',
                            's3:GetBucket*',
                            's3:List*',
                            's3:DeleteObject*',
                            's3:PutObject',
                            's3:PutObjectLegalHold',
                            's3:PutObjectRetention',
                            's3:PutObjectTagging',
                            's3:PutObjectVersionTagging',
                            's3:Abort*'
                        ],
                        Effect: 'Allow',
                        Resource: [
                            {
                                'Ref': requestProcessorBucket.asString()
                            },
                            {
                                'Fn::Join': [
                                    '',
                                    [
                                        {
                                            'Ref': requestProcessorBucket.asString()
                                        },
                                        '/*'
                                    ]
                                ]
                            }
                        ]
                    }
                ],
                'Version': '2012-10-17'
            },
            'PolicyName': Match.anyValue(),
            'Roles': [Match.anyValue()]
        });

        expect(ddbTableCapture.asString()).toContain('SyncCaseTable');
        expect(inferencesBucketCapture.asString()).toContain('S3Bucket');
        expect(ddbTableCapture._captured[0]).toEqual(ddbTableCapture._captured[1]);
        expect(inferencesBucketCapture._captured[0]).toEqual(inferencesBucketCapture._captured[1]);
    });

    it('should have the appropriate amount of SQS Queues', async () => {
        // 1 task queue and 3 DLQ's
        template.resourceCountIs('AWS::SQS::Queue', 3);
    });

    it('should have an SQS Queue with appropriate configs', async () => {
        template.hasResource('AWS::SQS::Queue', {
            Properties: {
                KmsMasterKeyId: Match.anyValue(),
                RedrivePolicy: {
                    deadLetterTargetArn: dlq
                }
            }
        });
    });

    it('should have a DLQ with appropriate configs', async () => {
        template.hasResource('AWS::SQS::Queue', {
            Properties: {
                KmsMasterKeyId: Match.anyValue()
            },
            Metadata: {
                cdk_nag: {
                    'rules_to_suppress': Match.anyValue()
                }
            }
        });
    });
});
