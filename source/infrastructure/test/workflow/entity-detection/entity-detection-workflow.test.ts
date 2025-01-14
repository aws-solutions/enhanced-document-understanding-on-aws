// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import * as rawCdkJson from '../../../cdk.json';

import { Capture, Match, Template } from 'aws-cdk-lib/assertions';

import { DusStack } from '../../../lib/dus-stack';
import { COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME } from '../../../lib/utils/constants';
import { EntityDetectionWorkflow } from '../../../lib/workflow/entity-detection/entity-detection-workflow';

describe('When creating EntityDetection Workflow', () => {
    let nestedStack: EntityDetectionWorkflow;
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
        nestedStack = new EntityDetectionWorkflow(stack, 'EntityDetectionWorkflowStack');
        template = Template.fromStack(nestedStack);
    });
    it('should pass successfully', async () => {
        expect(template).not.toBe(undefined);

        template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);
        template.resourceCountIs('AWS::Lambda::Function', 1);
        template.resourceCountIs('AWS::SQS::Queue', 3);
    });
    it('should create and attach a policy for lambda to call comprehend APIs', () => {
        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyDocument: {
                Statement: [
                    {
                        'Action': [
                            'comprehend:DetectEntities',
                            'comprehend:DetectPiiEntities',
                            'comprehendmedical:DetectEntitiesV2'
                        ],
                        'Effect': 'Allow',
                        'Resource': '*'
                    }
                ],
                Version: '2012-10-17'
            },
            PolicyName: Match.stringLikeRegexp('EntityDetectionSyncPolicy*'),
            Roles: [
                {
                    Ref: Match.stringLikeRegexp(
                        'EntityDetectionWorkflowEntityDetectionWorkflowStepFunctionCallbackTaskLambdaFunctionServiceRole*'
                    )
                }
            ]
        });
    });
    it('should have policy for r/w to inference bucket, and update case ddb table', () => {
        let ddbTableCapture = new Capture();
        let inferencesBucketCapture = new Capture();

        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyDocument: {
                Statement: [
                    Match.anyValue(),
                    Match.anyValue(),
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

    it('should have a lambda function', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
            Code: Match.anyValue(),
            Role: Match.anyValue(),
            Environment: {
                Variables: {
                    UUID: {
                        Ref: 'GenUUID'
                    },
                    S3_INFERENCE_BUCKET_NAME: {
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
                                                        Ref: Match.anyValue()
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    CASE_DDB_TABLE_NAME: {
                        'Fn::Select': [
                            1,
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
                                                        Ref: Match.anyValue()
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                }
            },
            Handler: 'entity-detection-sync.handler',
            Runtime: COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME.name,
            Timeout: 900,
            TracingConfig: {
                'Mode': 'Active'
            }
        });
    });
});
