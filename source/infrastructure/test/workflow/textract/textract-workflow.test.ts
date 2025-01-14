// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import * as rawCdkJson from '../../../cdk.json';

import { Capture, Match, Template } from 'aws-cdk-lib/assertions';

import { DusStack } from '../../../lib/dus-stack';
import { S3_MULTI_PAGE_PDF_PREFIX } from '../../../lib/utils/constants';
import { TextractWorkflow } from '../../../lib/workflow/textract/textract-workflow';

describe('When creating textract Workflow', () => {
    let nestedStack: TextractWorkflow;
    let template: Template;

    beforeAll(() => {
        const app = new cdk.App();
        const stack = new DusStack(app, 'DusStack', {
            solutionID: rawCdkJson.context.solution_id,
            solutionVersion: rawCdkJson.context.solution_version,
            solutionName: rawCdkJson.context.solution_name,
            appNamespace: rawCdkJson.context.app_namespace,
            applicationTrademarkName: rawCdkJson.context.application_trademark_name
        });
        nestedStack = new TextractWorkflow(stack, 'TextractWorkflowStack');
    });

    it('should pass successfully', async () => {
        template = Template.fromStack(nestedStack);
        expect(template).not.toBe(undefined);

        template.hasResourceProperties(
            'AWS::IAM::Role',
            Match.objectEquals({
                AssumeRolePolicyDocument: {
                    Statement: [
                        {
                            Action: 'sts:AssumeRole',
                            Effect: 'Allow',
                            Principal: {
                                Service: 'textract.amazonaws.com'
                            }
                        }
                    ],
                    Version: '2012-10-17'
                }
            })
        );
    });

    it('should create and attach a policy for lambda to call textract API', () => {
        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyDocument: {
                Statement: [
                    {
                        'Action': ['textract:DetectDocumentText', 'textract:AnalyzeDocument', 'textract:AnalyzeID'],
                        'Effect': 'Allow',
                        'Resource': '*'
                    }
                ],
                Version: '2012-10-17'
            },
            PolicyName: Match.stringLikeRegexp('TextractSyncPolicy*'),
            Roles: [
                {
                    Ref: Match.stringLikeRegexp(
                        'TextractWorkflowTextractWorkflowStepFunctionCallbackTaskLambdaFunctionServiceRole*'
                    )
                }
            ]
        });
    });

    it('should have policy for r/w to inference bucket, and update case ddb table', () => {
        let ddbTableCapture = new Capture();
        let uploadBucketCapture = new Capture();
        let inferencesBucketCapture = new Capture();

        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyDocument: {
                Statement: [
                    {
                        'Action': ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
                        'Effect': 'Allow',
                        'Resource': '*'
                    },
                    {
                        'Action': [
                            'sqs:ReceiveMessage',
                            'sqs:ChangeMessageVisibility',
                            'sqs:GetQueueUrl',
                            'sqs:DeleteMessage',
                            'sqs:GetQueueAttributes'
                        ],
                        'Effect': 'Allow',
                        'Resource': {
                            'Fn::GetAtt': [Match.anyValue(), 'Arn']
                        }
                    },
                    {
                        'Action': [
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
                        'Effect': 'Allow',
                        'Resource': [
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
                        'Action': [
                            'dynamodb:BatchGetItem',
                            'dynamodb:GetRecords',
                            'dynamodb:GetShardIterator',
                            'dynamodb:Query',
                            'dynamodb:GetItem',
                            'dynamodb:Scan',
                            'dynamodb:ConditionCheckItem',
                            'dynamodb:DescribeTable'
                        ],
                        'Effect': 'Allow',
                        'Resource': [
                            {
                                'Ref': ddbTableCapture
                            },
                            {
                                'Ref': 'AWS::NoValue'
                            }
                        ]
                    },
                    {
                        'Action': 'dynamodb:UpdateItem',
                        'Effect': 'Allow',
                        'Resource': [
                            {
                                'Ref': ddbTableCapture
                            },
                            {
                                'Ref': 'AWS::NoValue'
                            }
                        ]
                    },
                    {
                        'Action': ['s3:GetObject*', 's3:GetBucket*', 's3:List*'],
                        'Effect': 'Allow',
                        'Resource': [
                            {
                                'Ref': uploadBucketCapture
                            },
                            {
                                'Fn::Join': [
                                    '',
                                    [
                                        {
                                            'Ref': uploadBucketCapture
                                        },
                                        '/*'
                                    ]
                                ]
                            }
                        ]
                    },
                    {
                        'Action': [
                            's3:PutObject',
                            's3:PutObjectLegalHold',
                            's3:PutObjectRetention',
                            's3:PutObjectTagging',
                            's3:PutObjectVersionTagging',
                            's3:Abort*'
                        ],
                        'Effect': 'Allow',
                        'Resource': {
                            'Fn::Join': [
                                '',
                                [
                                    {
                                        'Ref': uploadBucketCapture
                                    },
                                    `/${S3_MULTI_PAGE_PDF_PREFIX}/*`
                                ]
                            ]
                        }
                    }
                ],
                'Version': '2012-10-17'
            },
            'PolicyName': Match.anyValue(),
            'Roles': [Match.anyValue()]
        });

        expect(ddbTableCapture.asString()).toContain('SyncCaseTable');
        expect(inferencesBucketCapture.asString()).toContain('S3Bucket');
        expect(uploadBucketCapture.asString()).toContain('UploadBucket');
        expect(ddbTableCapture._captured[0]).toEqual(ddbTableCapture._captured[1]);
        expect(inferencesBucketCapture._captured[0]).toEqual(inferencesBucketCapture._captured[1]);
        expect(uploadBucketCapture._captured[0]).toEqual(uploadBucketCapture._captured[1]);
        expect(uploadBucketCapture._captured[1]).toEqual(uploadBucketCapture._captured[2]);
    });
});
