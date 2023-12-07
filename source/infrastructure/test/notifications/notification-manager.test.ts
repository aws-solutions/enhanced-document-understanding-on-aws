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
import { Capture, Match, Template } from 'aws-cdk-lib/assertions';
import * as events from 'aws-cdk-lib/aws-events';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rawCdkJson from '../../cdk.json';
import {
    COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME,
    EventSources,
    WorkflowEventDetailTypes
} from '../../lib/utils/constants';

import { NotificationManager } from '../../lib/notifications/notification-manager';
import { CustomInfraSetup } from '../../lib/utils/custom-infra-setup';

describe('When creating the notification manager construct', () => {
    let template: Template;
    const appNamespace = 'app.test';

    beforeAll(() => {
        template = buildStack(appNamespace);
    });

    const assetTemplateBucketCapture = new Capture();
    const snsTopicNameCapture = new Capture();
    const snsTopicArnCapture = new Capture();
    const notificationLambdaRoleCapture = new Capture();
    const eventBusCapture = new Capture();
    const notificationLambdaCapture = new Capture();
    const s3TemplateBucketCapture = new Capture();

    it('should have the lambda function that will send out SNS notification', () => {
        template.resourceCountIs('AWS::Lambda::Function', 3);
        template.hasResourceProperties('AWS::Lambda::Function', {
            Code: Match.anyValue(),
            Runtime: COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME.name,
            Handler: 'index.handler',
            Timeout: 900,
            Description: 'This lambda function sends out SNS notification based on the input event received',
            Environment: {
                Variables: {
                    'TEMPLATES_BUCKET_NAME': {
                        Ref: assetTemplateBucketCapture
                    },
                    'TEMPLATE_PREFIX': 'email-templates/',
                    'SNS_TOPIC_ARN': {
                        Ref: snsTopicNameCapture
                    },
                    'SNS_TOPIC_NAME': {
                        'Fn::GetAtt': [snsTopicNameCapture, 'TopicName']
                    }
                }
            },
            TracingConfig: {
                Mode: 'Active'
            },
            Role: {
                'Fn::GetAtt': [notificationLambdaRoleCapture, 'Arn']
            }
        });

        const snsTopicName = snsTopicNameCapture.asString();
        snsTopicNameCapture.next();
        expect(snsTopicName).toStrictEqual(snsTopicNameCapture.asString());
        expect(template.toJSON()['Resources'][snsTopicNameCapture.asString()]['Type']).toStrictEqual('AWS::SNS::Topic');

        expect(template.toJSON()['Resources'][assetTemplateBucketCapture.asString()]['Type']).toStrictEqual(
            'AWS::S3::Bucket'
        );
    });

    it('should have the SNS topic created', () => {
        template.resourceCountIs('AWS::SNS::Topic', 1);
        template.hasResourceProperties('AWS::SNS::Topic', {
            DisplayName: 'Send notification topic',
            KmsMasterKeyId: {
                'Fn::Join': [
                    '',
                    [
                        'arn:',
                        {
                            Ref: 'AWS::Partition'
                        },
                        ':kms:',
                        {
                            Ref: 'AWS::Region'
                        },
                        ':',
                        {
                            Ref: 'AWS::AccountId'
                        },
                        ':alias/aws/sns'
                    ]
                ]
            }
        });
    });

    it('should have an email subscribed to the SNS topic', () => {
        template.resourceCountIs('AWS::SNS::Subscription', 1);
        template.hasResourceProperties('AWS::SNS::Subscription', {
            Endpoint: 'test@example.com',
            Protocol: 'email',
            TopicArn: { Ref: snsTopicArnCapture }
        });
        expect(template.toJSON()['Resources'][snsTopicArnCapture.asString()]['Type']).toStrictEqual('AWS::SNS::Topic');
    });

    it('should have the policy to publish notifications to the SNS Topic from the lambda function', () => {
        template.resourceCountIs('AWS::SNS::TopicPolicy', 1);
        template.hasResourceProperties('AWS::SNS::TopicPolicy', {
            PolicyDocument: {
                Statement: [
                    {
                        Action: [
                            'SNS:Publish',
                            'SNS:RemovePermission',
                            'SNS:SetTopicAttributes',
                            'SNS:DeleteTopic',
                            'SNS:ListSubscriptionsByTopic',
                            'SNS:GetTopicAttributes',
                            'SNS:Receive',
                            'SNS:AddPermission',
                            'SNS:Subscribe'
                        ],
                        Condition: {
                            StringEquals: {
                                'AWS:SourceOwner': {
                                    Ref: 'AWS::AccountId'
                                }
                            }
                        },
                        Effect: 'Allow',
                        Principal: {
                            AWS: {
                                'Fn::Join': [
                                    '',
                                    [
                                        'arn:',
                                        {
                                            Ref: 'AWS::Partition'
                                        },
                                        ':iam::',
                                        {
                                            'Ref': 'AWS::AccountId'
                                        },
                                        ':root'
                                    ]
                                ]
                            }
                        },
                        Resource: {
                            Ref: snsTopicNameCapture.asString()
                        }
                    },
                    {
                        Action: [
                            'SNS:Publish',
                            'SNS:RemovePermission',
                            'SNS:SetTopicAttributes',
                            'SNS:DeleteTopic',
                            'SNS:ListSubscriptionsByTopic',
                            'SNS:GetTopicAttributes',
                            'SNS:Receive',
                            'SNS:AddPermission',
                            'SNS:Subscribe'
                        ],
                        Condition: {
                            Bool: {
                                'aws:SecureTransport': 'false'
                            }
                        },
                        Effect: 'Deny',
                        Principal: {
                            AWS: '*'
                        },
                        Resource: {
                            Ref: snsTopicNameCapture.asString()
                        }
                    }
                ]
            },
            'Topics': [
                {
                    'Ref': snsTopicNameCapture.asString()
                }
            ]
        });
    });

    it('should create the rule to listen for notification event', () => {
        template.resourceCountIs('AWS::Events::Rule', 3);
        template.hasResourceProperties('AWS::Events::Rule', {
            EventBusName: {
                Ref: eventBusCapture
            },
            EventPattern: {
                account: [
                    {
                        Ref: 'AWS::AccountId'
                    }
                ],
                region: [
                    {
                        'Ref': 'AWS::Region'
                    }
                ],
                source: [`${EventSources.WORKFLOW_ORCHESTRATOR}.${appNamespace}`],
                'detail-type': [WorkflowEventDetailTypes.PROCESSING_COMPLETE]
            },
            State: 'ENABLED',
            Targets: [
                {
                    Arn: {
                        'Fn::GetAtt': [notificationLambdaCapture, 'Arn']
                    },
                    Id: Match.anyValue()
                }
            ]
        });

        template.hasResourceProperties('AWS::Events::Rule', {
            EventBusName: {
                Ref: eventBusCapture
            },
            EventPattern: {
                account: [
                    {
                        Ref: 'AWS::AccountId'
                    }
                ],
                region: [
                    {
                        'Ref': 'AWS::Region'
                    }
                ],
                source: [`${EventSources.WORKFLOW_STEPFUNCTION}.${appNamespace}`],
                'detail-type': [WorkflowEventDetailTypes.PROCESSING_FAILURE]
            },
            State: 'ENABLED',
            Targets: [
                {
                    Arn: {
                        'Fn::GetAtt': [notificationLambdaCapture, 'Arn']
                    },
                    Id: Match.anyValue()
                }
            ]
        });

        expect(template.toJSON()['Resources'][notificationLambdaCapture.asString()]['Type']).toStrictEqual(
            'AWS::Lambda::Function'
        );
    });

    it('should have read only access to read the templates from the s3 bucket and publish x-ray telemetry', () => {
        template.hasResourceProperties('AWS::IAM::Policy', {
            'PolicyDocument': {
                'Statement': [
                    {
                        'Action': ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
                        'Effect': 'Allow',
                        'Resource': '*'
                    },
                    {
                        'Action': ['s3:GetObject*', 's3:GetBucket*', 's3:List*'],
                        'Effect': 'Allow',
                        'Resource': [
                            {
                                'Fn::GetAtt': [s3TemplateBucketCapture, 'Arn']
                            },
                            {
                                'Fn::Join': [
                                    '',
                                    [
                                        {
                                            'Fn::GetAtt': [s3TemplateBucketCapture, 'Arn']
                                        },
                                        '/*'
                                    ]
                                ]
                            }
                        ]
                    },
                    {
                        'Action': 'sns:Publish',
                        'Effect': 'Allow',
                        'Resource': {
                            'Ref': snsTopicNameCapture.asString()
                        }
                    }
                ],
                'Version': '2012-10-17'
            },
            'PolicyName': Match.anyValue(),
            'Roles': [
                {
                    'Ref': notificationLambdaRoleCapture.asString()
                }
            ]
        });

        let s3Bucket = s3TemplateBucketCapture.asString();
        s3TemplateBucketCapture.next();
        expect(s3Bucket).toStrictEqual(s3TemplateBucketCapture.asString());

        expect(template.toJSON()['Resources'][s3TemplateBucketCapture.asString()]['Type']).toStrictEqual(
            'AWS::S3::Bucket'
        );
    });
});

describe('when running as cdk synth locally outside the pipeline', () => {
    let oldEnv: string | undefined;
    let template: Template;
    const appNamespace = 'app.test';

    beforeAll(() => {
        oldEnv = process.env.DIST_OUTPUT_BUCKET;
        delete process.env.DIST_OUTPUT_BUCKET;

        template = buildStack(appNamespace);
    });

    it('should create a custom resource to copy the templates', () => {
        const copyEmailTemplateLambda = new Capture();
        template.resourceCountIs('Custom::CopyTemplates', 1);
        template.hasResource('Custom::CopyTemplates', {
            Properties: {
                ServiceToken: {
                    'Fn::GetAtt': [copyEmailTemplateLambda, 'Arn']
                },
                Resource: 'COPY_TEMPLATE',
                SOURCE_BUCKET_NAME: {
                    'Fn::Sub': Match.anyValue()
                },
                SOURCE_PREFIX: Match.stringLikeRegexp('[.zip]$'),
                DESTINATION_BUCKET_NAME: {
                    Ref: Match.anyValue()
                },
                DESTINATION_PREFIX: 'email-templates'
            },
            'UpdateReplacePolicy': 'Delete',
            'DeletionPolicy': 'Delete'
        });

        expect(template.toJSON()['Resources'][copyEmailTemplateLambda.asString()]['Type']).toStrictEqual(
            'AWS::Lambda::Function'
        );
    });

    it('should add read bucket permissions to custom resource lambda role policy', () => {
        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyDocument: {
                Statement: [
                    {
                        Action: 's3:GetObject',
                        Effect: 'Allow',
                        Resource: {
                            'Fn::Join': [
                                '',
                                [
                                    'arn:',
                                    {
                                        'Ref': 'AWS::Partition'
                                    },
                                    ':s3:::',
                                    {
                                        'Fn::Sub': Match.stringLikeRegexp(
                                            '^cdk-[a-z0-9]*-assets-\\${AWS::AccountId}-\\${AWS::Region}$'
                                        )
                                    },
                                    '/*'
                                ]
                            ]
                        }
                    }
                ],
                Version: '2012-10-17'
            },
            PolicyName: Match.stringLikeRegexp('TestNotificationAssetRead*'),
            Roles: [
                {
                    'Ref': Match.stringLikeRegexp('CustomResourceLambdaRole*')
                }
            ]
        });
    });

    afterAll(() => {
        process.env.DIST_OUTPUT_BUCKET = oldEnv;
    });
});

describe('When building in standard pipelines', () => {
    let template: Template;
    const appNamespace = 'app.test';

    beforeAll(() => {
        process.env.DIST_OUTPUT_BUCKET = 'fake-bucket';
        process.env.SOLUTION_NAME = 'fake-solution-name';
        process.env.Version = 'v9.9.9';

        template = buildStack(appNamespace);
    });

    it('should synthesis with bucket policies for standard pipelines', () => {
        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyDocument: {
                Statement: [
                    {
                        Action: 's3:GetObject',
                        Effect: 'Allow',
                        Resource: {
                            'Fn::Join': [
                                '',
                                [
                                    'arn:',
                                    {
                                        'Ref': 'AWS::Partition'
                                    },
                                    ':s3:::',
                                    {
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
                                    '/',
                                    {
                                        'Fn::FindInMap': ['SourceCode', 'General', 'KeyPrefix']
                                    },
                                    '/*'
                                ]
                            ]
                        }
                    }
                ],
                Version: '2012-10-17'
            },
            PolicyName: Match.stringLikeRegexp('TestNotificationAssetRead*'),
            Roles: [
                {
                    'Ref': Match.stringLikeRegexp('CustomResourceLambdaRole*')
                }
            ]
        });
    });

    it('should specify appropriate SOURCE_BUCKET_NAME and SOURCE_PREFIX', () => {
        template.hasResourceProperties('Custom::CopyTemplates', {
            ServiceToken: {
                'Fn::GetAtt': [Match.anyValue(), 'Arn']
            },
            Resource: 'COPY_TEMPLATE',
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
                        Match.stringLikeRegexp('/asset[a-z0-9]*.zip')
                    ]
                ]
            },
            DESTINATION_BUCKET_NAME: {
                Ref: Match.anyValue()
            },
            DESTINATION_PREFIX: 'email-templates'
        });
    });

    afterAll(() => {
        delete process.env.DIST_OUTPUT_BUCKET;
        delete process.env.SOLUTION_NAME;
        delete process.env.Version;
    });
});

function buildStack(appNamespace: string) {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    new NotificationManager(stack, 'TestNotification', {
        orchestratorBus: new events.EventBus(stack, 'TestBus'),
        appConfigBucket: new s3.Bucket(stack, 'AppSetBucket', {
            versioned: false, //NOSONAR
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            enforceSSL: true
        }),
        appNamespace: appNamespace,
        customResourceLambda: new CustomInfraSetup(stack, 'InfraSetup', {
            solutionID: rawCdkJson.context.solution_id,
            solutionVersion: rawCdkJson.context.solution_version
        }).customResourceLambda,
        subscriptionEmail: 'test@example.com'
    });

    const template = Template.fromStack(stack);

    return template;
}
