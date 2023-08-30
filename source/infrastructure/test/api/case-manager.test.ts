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
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

import { Capture, Match, Template } from 'aws-cdk-lib/assertions';

import { CaseManager } from '../../lib/api/case-manager';

describe('When CaseManager construct is created', () => {
    let template: Template;
    let caseManager: CaseManager;

    beforeAll(() => {
        const stack = new cdk.Stack();
        caseManager = new CaseManager(stack, 'CaseManagerStack', {
            bucketToUpload: new s3.Bucket(stack, 'UploadBucket'),
            inferenceBucket: new s3.Bucket(stack, 'InferenceBucket'),
            genUUID: 'fake-uuid',
            workflowConfigName: 'fake-config',
            workflowConfigTable: new dynamodb.Table(stack, 'ConfigTable', {
                partitionKey: {
                    name: 'WorkflowConfigName',
                    type: dynamodb.AttributeType.STRING
                }
            })
        });
        template = Template.fromStack(stack);
    });

    it('should create 4 lambda functions', () => {
        template.resourceCountIs('AWS::Lambda::Function', 4);
        template.hasResourceProperties('AWS::Lambda::Function', {
            Runtime: 'nodejs18.x',
            Handler: 'index.handler',
            Code: {
                S3Bucket: {
                    'Fn::Sub': Match.anyValue()
                },
                S3Key: Match.anyValue()
            }
        });
    });

    it('Create Records lambda should have a lambda role policy to allow putting objects into upload bucket, r/w the case table, and read the workflow config table', () => {
        const s3UploadBucketCapture = new Capture();
        const ddbTableCapture = new Capture();
        const configTableCapture = new Capture();
        const policyCapture = new Capture();
        
        template.resourceCountIs('AWS::IAM::Policy', 4);
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
                                'Fn::GetAtt': [configTableCapture, 'Arn']
                            },
                            {
                                'Ref': 'AWS::NoValue'
                            }
                        ]
                    },
                    {
                        Action: [
                            's3:PutObject',
                            's3:PutObjectLegalHold',
                            's3:PutObjectRetention',
                            's3:PutObjectTagging',
                            's3:PutObjectVersionTagging',
                            's3:Abort*'
                        ],
                        Effect: 'Allow',
                        Resource: {
                            'Fn::Join': [
                                '',
                                [
                                    {
                                        'Fn::GetAtt': [s3UploadBucketCapture, 'Arn']
                                    },
                                    `/${caseManager.s3UploadPrefix}/*`
                                ]
                            ]
                        }
                    }
                ]
            },
            PolicyName: policyCapture
        });

        expect(template.toJSON()['Resources'][s3UploadBucketCapture.asString()]['Type']).toEqual('AWS::S3::Bucket');
        expect(template.toJSON()['Resources'][ddbTableCapture.asString()]['Type']).toEqual('AWS::DynamoDB::Table');
        expect(template.toJSON()['Resources'][configTableCapture.asString()]['Type']).toEqual('AWS::DynamoDB::Table');
        expect(policyCapture.asString()).toContain('CreateRecords');
        template.hasResourceProperties('AWS::Lambda::Function', {
            Environment: {
                Variables: {
                    UPLOAD_DOCS_BUCKET_NAME: {
                        Ref: s3UploadBucketCapture.asString()
                    },
                    S3_UPLOAD_PREFIX: caseManager.s3UploadPrefix,
                    CASE_DDB_TABLE_NAME: { Ref: ddbTableCapture.asString() }
                }
            }
        });
    });

    it('Fetch records lambda should have a lambda role policy to allow reading from DDB and inference bucket', () => {
        const ddbTableCapture = new Capture();
        const policyCapture = new Capture();
        const s3UploadBucketCapture = new Capture();
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
                        Action: ['s3:GetObject', 's3:GetObjectAttributes'],
                        Effect: 'Allow',
                        Resource: {
                            'Fn::Join': [
                                '',
                                [
                                    {
                                        'Fn::GetAtt': [s3UploadBucketCapture, 'Arn']
                                    },
                                    '/redacted/*'
                                ]
                            ]
                        }
                    }
                ]
            },
            PolicyName: policyCapture
        });

        expect(template.toJSON()['Resources'][ddbTableCapture.asString()]['Type']).toEqual('AWS::DynamoDB::Table');
        expect(template.toJSON()['Resources'][s3UploadBucketCapture.asString()]['Type']).toEqual('AWS::S3::Bucket');

        expect(policyCapture.asString()).toContain('FetchRecords');
        template.hasResourceProperties('AWS::Lambda::Function', {
            Environment: {
                Variables: {
                    CASE_DDB_TABLE_NAME: { Ref: ddbTableCapture.asString() }
                }
            }
        });
    });

    it('Generate presigned url lambda should have a role policy to allow reading from upload s3', () => {
        const s3UploadBucketCapture = new Capture();
        const policyCapture = new Capture();
        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyDocument: {
                Statement: [
                    {
                        Action: 's3:GetObject*',
                        Effect: 'Allow',
                        Resource: [
                            {
                                'Fn::Join': [
                                    '',

                                    [
                                        {
                                            'Fn::GetAtt': [s3UploadBucketCapture, 'Arn']
                                        },
                                        `/${caseManager.s3UploadPrefix}/*`
                                    ]
                                ]
                            },
                            {
                                'Fn::Join': [
                                    '',

                                    [
                                        {
                                            'Fn::GetAtt': [s3UploadBucketCapture, 'Arn']
                                        },
                                        '/redacted/*'
                                    ]
                                ]
                            }
                        ]
                    }
                ]
            },
            PolicyName: policyCapture
        });

        expect(template.toJSON()['Resources'][s3UploadBucketCapture.asString()]['Type']).toEqual('AWS::S3::Bucket');
        expect(policyCapture.asString()).toContain('GetDocumentUrl');
        template.hasResourceProperties('AWS::Lambda::Function', {
            Environment: {
                Variables: {
                    UPLOAD_DOCS_BUCKET_NAME: {
                        Ref: s3UploadBucketCapture.asString()
                    },
                    S3_UPLOAD_PREFIX: caseManager.s3UploadPrefix
                }
            }
        });
    });

    it('Get Inferences lambda should have a lambda role policy to allow reading from DDB and inferences S3 bucket', () => {
        const s3InferenceBucketCapture = new Capture();
        const ddbTableCapture = new Capture();
        const policyCapture = new Capture();
        template.resourceCountIs('AWS::IAM::Policy', 4);
        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyDocument: {
                Statement: [
                    {
                        Action: ['s3:GetObject*', 's3:GetBucket*', 's3:List*'],
                        Effect: 'Allow',
                        Resource: [
                            {
                                'Fn::GetAtt': [s3InferenceBucketCapture, 'Arn']
                            },
                            {
                                'Fn::Join': [
                                    '',
                                    [
                                        {
                                            'Fn::GetAtt': [s3InferenceBucketCapture, 'Arn']
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
                    }
                ]
            },
            PolicyName: policyCapture
        });

        expect(template.toJSON()['Resources'][s3InferenceBucketCapture.asString()]['Type']).toEqual('AWS::S3::Bucket');
        expect(template.toJSON()['Resources'][ddbTableCapture.asString()]['Type']).toEqual('AWS::DynamoDB::Table');
        expect(policyCapture.asString()).toContain('GetInferences');
        template.hasResourceProperties('AWS::Lambda::Function', {
            Environment: {
                Variables: {
                    S3_INFERENCE_BUCKET_NAME: {
                        Ref: s3InferenceBucketCapture.asString()
                    },
                    CASE_DDB_TABLE_NAME: { Ref: ddbTableCapture.asString() }
                }
            }
        });
    });

    it('Case manager lambda should have a necessary env variables', () => {
        process.env.UUID = 'fake-uuid';
        template.hasResourceProperties('AWS::Lambda::Function', {
            Environment: {
                Variables: {
                    UPLOAD_DOCS_BUCKET_NAME: {
                        'Ref': Match.stringLikeRegexp('UploadBucket*')
                    },
                    S3_UPLOAD_PREFIX: 'initial',
                    UUID: 'fake-uuid',
                    CASE_DDB_TABLE_NAME: {
                        'Ref': Match.stringLikeRegexp('CaseManagerStackCreateRecordsLambdaDDbDynamoTable*')
                    }
                }
            }
        });
    });

    it('should create dynamodb cases and workflow config tables', () => {
        template.resourceCountIs('AWS::DynamoDB::Table', 2);
        template.hasResourceProperties('AWS::DynamoDB::Table', {
            KeySchema: [
                {
                    AttributeName: 'CASE_ID',
                    KeyType: 'HASH'
                },
                {
                    AttributeName: 'DOCUMENT_ID',
                    KeyType: 'RANGE'
                }
            ],
            AttributeDefinitions: [
                {
                    AttributeName: 'CASE_ID',
                    AttributeType: 'S'
                },
                {
                    AttributeName: 'DOCUMENT_ID',
                    AttributeType: 'S'
                },
                {
                    AttributeName: 'USER_ID',
                    AttributeType: 'S'
                }
            ],
            PointInTimeRecoverySpecification: {
                PointInTimeRecoveryEnabled: true
            },
            SSESpecification: {
                SSEEnabled: true
            },
            BillingMode: 'PAY_PER_REQUEST',
            GlobalSecondaryIndexes: [
                {
                    IndexName: 'UserIdIndex',
                    KeySchema: [
                        {
                            AttributeName: 'USER_ID',
                            KeyType: 'HASH'
                        },
                        {
                            AttributeName: 'CASE_ID',
                            KeyType: 'RANGE'
                        }
                    ],
                    Projection: {
                        ProjectionType: 'ALL'
                    }
                }
            ]
        });
    });
});
