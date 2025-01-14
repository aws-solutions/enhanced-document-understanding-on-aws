// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';

import { Capture, Match, Template } from 'aws-cdk-lib/assertions';

import * as rawCdkJson from '../../cdk.json';
import { CustomInfraSetup } from '../../lib/utils/custom-infra-setup';
import { WorkflowConfig } from '../../lib/workflow/workflow-config';

describe('When WorkflowConfig construct is created', () => {
    let template: Template;
    const ddbTableCapture = new Capture();

    beforeAll(() => {
        template = Template.fromStack(buildStack());
    });

    it('should have a dynamodb table', () => {
        template.resourceCountIs('AWS::DynamoDB::Table', 1);
        template.hasResourceProperties('AWS::DynamoDB::Table', {
            KeySchema: [
                {
                    AttributeName: 'Name',
                    KeyType: 'HASH'
                }
            ],
            AttributeDefinitions: [
                {
                    AttributeName: 'Name',
                    AttributeType: 'S'
                }
            ],
            BillingMode: 'PAY_PER_REQUEST',
            SSESpecification: {
                SSEEnabled: true
            }
        });
    });

    it('should have a policy to write to the Dynamodb Table', () => {
        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyDocument: {
                Statement: [
                    Match.anyValue(),
                    {
                        Action: [
                            'dynamodb:BatchGetItem',
                            'dynamodb:GetRecords',
                            'dynamodb:GetShardIterator',
                            'dynamodb:Query',
                            'dynamodb:GetItem',
                            'dynamodb:Scan',
                            'dynamodb:ConditionCheckItem',
                            'dynamodb:BatchWriteItem',
                            'dynamodb:PutItem',
                            'dynamodb:UpdateItem',
                            'dynamodb:DeleteItem',
                            'dynamodb:DescribeTable'
                        ],
                        Effect: 'Allow',
                        Resource: [
                            {
                                'Fn::GetAtt': [ddbTableCapture, 'Arn']
                            },
                            {
                                'Ref': 'AWS::NoValue'
                            }
                        ]
                    }
                ]
            }
        });

        expect(template.toJSON()['Resources'][ddbTableCapture.asString()]['Type']).toEqual('AWS::DynamoDB::Table');
    });

    it('should have a custom resource to copy config to Dynamodb Table with Source bucket and prefix for local synth mode', () => {
        const lambdaCapture = new Capture();
        template.resourceCountIs('Custom::CopyWorkflowConfig', 1);
        template.hasResourceProperties('Custom::CopyWorkflowConfig', {
            ServiceToken: {
                'Fn::GetAtt': [lambdaCapture, 'Arn']
            },
            Resource: 'COPY_WORKFLOW_CONFIG',
            DDB_TABLE_NAME: {
                Ref: ddbTableCapture.asString()
            },
            ...(!process.env.DIST_OUTPUT_BUCKET && {
                SOURCE_BUCKET_NAME: {
                    'Fn::Sub': Match.stringLikeRegexp('^cdk-[a-z0-9]*-assets-\\${AWS::AccountId}-\\${AWS::Region}$')
                },
                SOURCE_PREFIX: Match.stringLikeRegexp('^[a-z0-9]*.zip$')
            }),
            ...(process.env.DIST_OUTPUT_BUCKET && {
                SOURCE_BUCKET_NAME: {
                    'Fn::Join': [
                        '-',
                        [
                            {
                                'Fn::FindInMap': ['SourceCode', 'General', 'S3Bucket']
                            },
                            { Ref: 'AWS::Region' }
                        ]
                    ]
                },
                SOURCE_PREFIX: {
                    'Fn::Join': [
                        '',
                        [
                            {
                                'Fn::FindInMap': ['SourceCode', 'General', 'KeyPrefix']
                            },
                            Match.stringLikeRegexp('^/asset[a-z0-9]*.zip$')
                        ]
                    ]
                }
            })
        });

        expect(template.toJSON()['Resources'][lambdaCapture.asString()]['Type']).toEqual('AWS::Lambda::Function');
    });
});

describe('When the construct is called for a synthesis in a builder pipeline', () => {
    let template: Template;

    beforeAll(() => {
        process.env.DIST_OUTPUT_BUCKET = 'fake-bucket';
        template = Template.fromStack(buildStack());
    });

    it('should have a custom resource to copy config to Dynamodb Table with Source bucket and prefix for pipeline mode', () => {
        const lambdaCapture = new Capture();
        template.resourceCountIs('Custom::CopyWorkflowConfig', 1);
        template.hasResourceProperties('Custom::CopyWorkflowConfig', {
            ServiceToken: {
                'Fn::GetAtt': [lambdaCapture, 'Arn']
            },
            'Resource': 'COPY_WORKFLOW_CONFIG',
            'DDB_TABLE_NAME': {
                'Ref': Match.anyValue()
            },
            SOURCE_BUCKET_NAME: {
                'Fn::Join': [
                    '-',
                    [
                        {
                            'Fn::FindInMap': ['SourceCode', 'General', 'S3Bucket']
                        },
                        {
                            Ref: 'AWS::Region'
                        }
                    ]
                ]
            },
            SOURCE_PREFIX: {
                'Fn::Join': [
                    '',
                    [
                        {
                            'Fn::FindInMap': ['SourceCode', 'General', 'KeyPrefix']
                        },
                        Match.stringLikeRegexp('^/asset[a-z0-9]*.zip$')
                    ]
                ]
            }
        });

        expect(template.toJSON()['Resources'][lambdaCapture.asString()]['Type']).toEqual('AWS::Lambda::Function');
    });
});

function buildStack(): cdk.Stack {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const lambda = new CustomInfraSetup(stack, 'WorkflowSetup', {
        solutionID: rawCdkJson.context.solution_id,
        solutionVersion: rawCdkJson.context.solution_version
    }).customResourceLambda;
    new WorkflowConfig(stack, 'TestSetup', {
        customResource: lambda
    });

    return stack;
}
