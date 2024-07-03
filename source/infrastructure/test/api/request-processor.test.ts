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
import * as events from 'aws-cdk-lib/aws-events';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

import { Capture, Match, Template } from 'aws-cdk-lib/assertions';
import {
    COMMERCIAL_REGION_LAMBDA_JAVA_RUNTIME,
    COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME,
    EventSources,
    S3_REDACTED_PREFIX,
    S3_UPLOAD_PREFIX,
    WorkflowEventDetailTypes
} from '../../lib/utils/constants';

import * as rawCdkJson from '../../cdk.json';
import { RequestProcessor } from '../../lib/api/request-processor';
import { CustomInfraSetup } from '../../lib/utils/custom-infra-setup';
import { IndexedStorageParams } from '../../lib/search/indexed-storage-params';

describe('When RequestProcessor construct is created', () => {
    let template: Template;
    let refS3UploadBucketCapture: Capture;

    beforeAll(() => {
        const stack = new cdk.Stack();
        const customInfraSetup = new CustomInfraSetup(stack, 'InfraSetup', {
            solutionID: rawCdkJson.context.solution_id,
            solutionVersion: rawCdkJson.context.solution_version
        });

        const params = new IndexedStorageParams(stack, 'TestIndexedStorageParams');
        const vpc = new ec2.Vpc(stack, 'vpc');

        new RequestProcessor(stack, 'WorkflowTestStack', {
            orchestratorBus: new events.EventBus(stack, 'TestBus'),
            appNamespace: 'fakeApp',
            s3LoggingBucket: new s3.Bucket(stack, 'testaccesslogging'),
            workflowConfigTable: new dynamodb.Table(stack, 'ConfigTable', {
                partitionKey: {
                    name: 'WorkflowConfigName',
                    type: dynamodb.AttributeType.STRING
                }
            }),
            workflowConfigName: 'default',
            defaultUserEmail: 'fake-email@domain.com',
            applicationTrademarkName: 'trademark-name',
            genUUID: new cdk.CustomResource(stack, 'GenUUID', {
                resourceType: 'Custom::GenUUID',
                serviceToken: customInfraSetup.customResourceLambda.functionArn,
                properties: {
                    Resource: 'GEN_UUID'
                }
            })
                .getAtt('UUID')
                .toString(),
            vpc: vpc,
            securityGroup: new ec2.SecurityGroup(stack, 'IngressSG', {
                vpc,
                allowAllOutbound: true
            }),
            deployOpenSearchIndexCondition: params.deployOpenSearchIndexCondition
        });
        template = Template.fromStack(stack);
    });

    it('should create an S3 bucket with logging bucket', () => {
        const s3BucketCapture = new Capture();
        template.resourceCountIs('AWS::S3::Bucket', 3);
        template.hasResourceProperties('AWS::S3::Bucket', {
            BucketEncryption: {
                ServerSideEncryptionConfiguration: [
                    {
                        ServerSideEncryptionByDefault: {
                            SSEAlgorithm: 'AES256'
                        }
                    }
                ]
            },
            CorsConfiguration: {
                CorsRules: [
                    {
                        AllowedHeaders: ['*'],
                        AllowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
                        AllowedOrigins: ['*']
                    }
                ]
            },
            LoggingConfiguration: {
                DestinationBucketName: {
                    Ref: s3BucketCapture
                }
            },
            NotificationConfiguration: {
                EventBridgeConfiguration: {
                    EventBridgeEnabled: true
                }
            },
            PublicAccessBlockConfiguration: {
                BlockPublicAcls: true,
                BlockPublicPolicy: true,
                IgnorePublicAcls: true,
                RestrictPublicBuckets: true
            }
        });

        expect(template.toJSON()['Resources'][s3BucketCapture.asString()]['Type']).toEqual('AWS::S3::Bucket');
    });

    it('should create bucket policy to deny unsecured transport protocol', () => {
        const s3UploadBucketCapture = new Capture();
        template.resourceCountIs('AWS::S3::BucketPolicy', 2);
        template.hasResourceProperties('AWS::S3::BucketPolicy', {
            Bucket: {
                Ref: s3UploadBucketCapture
            }
        });

        template.hasResourceProperties('AWS::S3::BucketPolicy', {
            PolicyDocument: {
                Statement: [
                    {
                        Action: 's3:*',
                        Condition: {
                            Bool: {
                                'aws:SecureTransport': 'false'
                            }
                        },
                        Effect: 'Deny',
                        Principal: {
                            'AWS': '*'
                        },
                        Resource: [
                            {
                                'Fn::GetAtt': [s3UploadBucketCapture.asString(), 'Arn']
                            },
                            {
                                'Fn::Join': [
                                    '',
                                    [
                                        {
                                            'Fn::GetAtt': [s3UploadBucketCapture.asString(), 'Arn']
                                        },
                                        '/*'
                                    ]
                                ]
                            }
                        ]
                    },
                    Match.anyValue()
                ],
                Version: '2012-10-17'
            }
        });

        const s3LoggingBucketCapture = new Capture();

        template.hasResourceProperties('AWS::S3::BucketPolicy', {
            Bucket: {
                'Ref': s3LoggingBucketCapture
            }
        });
        console.debug(`s3LoggingBucketCapture: ${JSON.stringify(s3LoggingBucketCapture.asString())}`);

        template.hasResourceProperties('AWS::S3::BucketPolicy', {
            PolicyDocument: {
                Statement: [
                    {
                        Action: 's3:*',
                        Condition: {
                            Bool: {
                                'aws:SecureTransport': 'false'
                            }
                        },
                        Effect: 'Deny',
                        Principal: {
                            AWS: '*'
                        },
                        Resource: [
                            {
                                'Fn::GetAtt': [s3LoggingBucketCapture.asString(), 'Arn']
                            },
                            {
                                'Fn::Join': [
                                    '',
                                    [
                                        {
                                            'Fn::GetAtt': [s3LoggingBucketCapture.asString(), 'Arn']
                                        },
                                        '/*'
                                    ]
                                ]
                            }
                        ]
                    },
                    Match.anyValue()
                ],
                Version: '2012-10-17'
            }
        });

        //to be used in other test
        refS3UploadBucketCapture = s3UploadBucketCapture;
    });

    it('should create a lambda function that is invoked on event defined by eventBridge rule with correct role permissions', () => {
        const uploadBucketCapture = new Capture();
        const ddbTableCapture = new Capture();
        const eventBusCapture = new Capture();
        const inferenceBucketCapture = new Capture();
        const workFlowRepo = new Capture();

        template.resourceCountIs('AWS::Lambda::Function', 9);
        template.hasResourceProperties('AWS::Lambda::Function', {
            Runtime: COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME.name,
            Handler: 'index.handler',
            Timeout: 900,
            Code: {
                S3Bucket: {
                    'Fn::Sub': Match.anyValue()
                },
                S3Key: Match.anyValue()
            },
            Environment: {
                Variables: {
                    CASE_DDB_TABLE_NAME: { 'Ref': ddbTableCapture },
                    EVENT_BUS_ARN: { 'Fn::GetAtt': [eventBusCapture, 'Arn'] },
                    S3_UPLOAD_PREFIX: 'initial',
                    WORKFLOW_CONFIG_TABLE_NAME: { 'Ref': Match.stringLikeRegexp('^ConfigTable[A-Z0-9]{8}$') },
                    WORKFLOW_CONFIG_NAME: Match.stringLikeRegexp(
                        'default|entityDetection|entityDetectionStandard|textract|redaction'
                    ),
                    UUID: { 'Fn::GetAtt': [Match.anyValue(), 'UUID'] }
                }
            }
        });

        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyDocument: {
                'Statement': [
                    {
                        'Action': ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
                        'Effect': 'Allow',
                        'Resource': '*'
                    },
                    {
                        'Action': [
                            'ec2:CreateNetworkInterface',
                            'ec2:DescribeNetworkInterfaces',
                            'ec2:DeleteNetworkInterface',
                            'ec2:AssignPrivateIpAddresses',
                            'ec2:UnassignPrivateIpAddresses',
                            'ec2:DetachNetworkInterface'
                        ],
                        'Effect': 'Allow',
                        'Resource': '*'
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
                                'Fn::GetAtt': [Match.stringLikeRegexp('ConfigTable*'), 'Arn']
                            },
                            {
                                Ref: 'AWS::NoValue'
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
                                'Fn::GetAtt': [ddbTableCapture, 'Arn']
                            },
                            {
                                'Fn::Join': [
                                    '',
                                    [
                                        {
                                            'Fn::GetAtt': [ddbTableCapture, 'Arn']
                                        },
                                        '/index/*'
                                    ]
                                ]
                            }
                        ]
                    },
                    {
                        Action: 'dynamodb:UpdateItem',
                        Effect: 'Allow',
                        Resource: [
                            {
                                'Fn::GetAtt': [ddbTableCapture, 'Arn']
                            },
                            {
                                'Fn::Join': [
                                    '',
                                    [
                                        {
                                            'Fn::GetAtt': [ddbTableCapture, 'Arn']
                                        },
                                        '/index/*'
                                    ]
                                ]
                            }
                        ]
                    },
                    {
                        Action: 'dynamodb:PutItem',
                        Effect: 'Allow',
                        Resource: [
                            {
                                'Fn::GetAtt': [ddbTableCapture, 'Arn']
                            },
                            {
                                'Fn::Join': [
                                    '',
                                    [
                                        {
                                            'Fn::GetAtt': [ddbTableCapture, 'Arn']
                                        },
                                        '/index/*'
                                    ]
                                ]
                            }
                        ]
                    },
                    {
                        Action: 'events:PutEvents',
                        Effect: 'Allow',
                        Resource: {
                            'Fn::GetAtt': [eventBusCapture, 'Arn']
                        }
                    },
                    {
                        Action: ['s3:GetObject*', 's3:GetBucket*', 's3:List*'],
                        Effect: 'Allow',
                        Resource: [
                            {
                                'Fn::GetAtt': [inferenceBucketCapture, 'Arn']
                            },
                            {
                                'Fn::Join': [
                                    '',
                                    [
                                        {
                                            'Fn::GetAtt': [inferenceBucketCapture, 'Arn']
                                        },
                                        '/*'
                                    ]
                                ]
                            }
                        ]
                    },
                    {
                        Action: ['s3:GetObject*', 's3:GetBucket*', 's3:List*'],
                        Effect: 'Allow',
                        'Resource': [
                            {
                                'Fn::GetAtt': [workFlowRepo, 'Arn']
                            },
                            {
                                'Fn::Join': [
                                    '',
                                    [
                                        {
                                            'Fn::GetAtt': [workFlowRepo, 'Arn']
                                        },
                                        '/initial/*'
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

        template.resourceCountIs('AWS::Events::Rule', 3);
        template.hasResourceProperties('AWS::Events::Rule', {
            EventPattern: {
                source: ['aws.s3'],
                'detail-type': ['Object Created'],
                account: [
                    {
                        Ref: 'AWS::AccountId'
                    }
                ],
                region: [
                    {
                        Ref: 'AWS::Region'
                    }
                ],
                detail: {
                    bucket: {
                        name: [{ prefix: { Ref: uploadBucketCapture } }]
                    },
                    object: {
                        key: [{ prefix: S3_UPLOAD_PREFIX }]
                    }
                }
            }
        });

        template.hasResourceProperties('AWS::Events::Rule', {
            EventPattern: {
                source: [`${EventSources.WORKFLOW_STEPFUNCTION}.fakeApp`],
                'detail-type': [WorkflowEventDetailTypes.PROCESSING_FAILURE],
                account: [
                    {
                        Ref: 'AWS::AccountId'
                    }
                ],
                region: [
                    {
                        Ref: 'AWS::Region'
                    }
                ]
            }
        });

        expect(uploadBucketCapture.asString()).toEqual(refS3UploadBucketCapture._captured[0]);
        expect(eventBusCapture.asString()).toContain('TestBus');
        expect(ddbTableCapture.asString()).toContain('DynamoTable');
        expect(inferenceBucketCapture.asString()).toContain('Inferences');
    });

    it('should create a lambda function for redaction API with correct role permissions', () => {
        const uploadBucketCapture = new Capture();
        const inferenceBucketCapture = new Capture();

        template.resourceCountIs('AWS::Lambda::Function', 9);
        template.hasResourceProperties('AWS::Lambda::Function', {
            Runtime: COMMERCIAL_REGION_LAMBDA_JAVA_RUNTIME.name,
            Handler: 'com.builder.lambda.RedactionApiHandler',
            Timeout: 900,
            MemorySize: 1024,
            Code: {
                S3Bucket: {
                    'Fn::Sub': Match.anyValue()
                },
                S3Key: Match.anyValue()
            },
            Environment: {
                Variables: {
                    S3_INFERENCE_BUCKET_NAME: {
                        'Ref': inferenceBucketCapture
                    },
                    DOCUMENT_BUCKET_NAME: {
                        'Ref': uploadBucketCapture
                    },
                    S3_UPLOAD_PREFIX: S3_UPLOAD_PREFIX,
                    S3_REDACTED_PREFIX: S3_REDACTED_PREFIX,
                    UUID: { 'Fn::GetAtt': [Match.anyValue(), 'UUID'] }
                }
            }
        });
        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyDocument: {
                Statement: [
                    {
                        'Action': ['s3:GetObject*', 's3:GetBucket*', 's3:List*'],
                        'Effect': 'Allow',
                        'Resource': [
                            {
                                'Fn::GetAtt': [inferenceBucketCapture.asString(), 'Arn']
                            },
                            {
                                'Fn::Join': [
                                    '',
                                    [
                                        {
                                            'Fn::GetAtt': [inferenceBucketCapture.asString(), 'Arn']
                                        },
                                        '/*'
                                    ]
                                ]
                            }
                        ]
                    },
                    {
                        'Action': ['s3:GetObject*', 's3:GetBucket*', 's3:List*'],
                        'Effect': 'Allow',
                        'Resource': [
                            {
                                'Fn::GetAtt': [uploadBucketCapture.asString(), 'Arn']
                            },
                            {
                                'Fn::Join': [
                                    '',
                                    [
                                        {
                                            'Fn::GetAtt': [uploadBucketCapture.asString(), 'Arn']
                                        },
                                        '/initial/*'
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
                                        'Fn::GetAtt': [uploadBucketCapture.asString(), 'Arn']
                                    },
                                    '/redacted/*'
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

        expect(uploadBucketCapture.asString()).toEqual(refS3UploadBucketCapture._captured[0]);
        expect(inferenceBucketCapture.asString()).toContain('Inferences');
    });

    // unit test for lambda creation
    it('should create a lambda function for to back kendra or open search endpoing with correct role permissions', () => {
        template.resourceCountIs('AWS::Lambda::Function', 9);
        template.hasResourceProperties('AWS::Lambda::Function', {
            Runtime: COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME.name,
            Handler: 'index.handler',
            Timeout: 900,
            Code: {
                S3Bucket: {
                    'Fn::Sub': Match.anyValue()
                },
                S3Key: Match.anyValue()
            }
        });
    });

    it('Should create a policy for textract to access objects in upload bucket', () => {
        template.hasResourceProperties('AWS::S3::BucketPolicy', {
            Bucket: {
                Ref: refS3UploadBucketCapture.asString()
            },
            PolicyDocument: {
                Statement: [
                    Match.anyValue(),
                    {
                        Action: ['s3:List*', 's3:Get*'],
                        Effect: 'Allow',
                        Principal: {
                            Service: 'textract.amazonaws.com'
                        },
                        Resource: [
                            {
                                'Fn::GetAtt': [refS3UploadBucketCapture.asString(), 'Arn']
                            },
                            {
                                'Fn::Join': [
                                    '',
                                    [
                                        {
                                            'Fn::GetAtt': [refS3UploadBucketCapture.asString(), 'Arn']
                                        },
                                        '/*'
                                    ]
                                ]
                            }
                        ]
                    }
                ]
            }
        });
    });

    it('should the following outputs', () => {
        template.hasOutput('UserPoolId', {
            Value: {
                Ref: Match.stringLikeRegexp('WorkflowTestStackApiExtUsrPool*')
            }
        });

        template.hasOutput('UserPoolClientId', {
            Value: {
                Ref: Match.stringLikeRegexp('WorkflowTestStackApiClientApp*')
            }
        });
    });
});
