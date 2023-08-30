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
import * as lambda from 'aws-cdk-lib/aws-lambda';

import { Capture, Match, Template } from 'aws-cdk-lib/assertions';

import { KendraCaseStorage } from '../../lib/search/kendra-case-storage';
import { COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME, KendraAttributes } from '../../lib/utils/constants';

describe('When KendraCaseStorage construct is created', () => {
    let template: Template;
    let jsonTemplate: { [key: string]: any };
    let kendraCaseStorage: KendraCaseStorage;

    const kendraRoleCapture = new Capture();
    const kendraKeyCapture = new Capture();

    beforeAll(() => {
        const stack = new cdk.Stack();
        kendraCaseStorage = new KendraCaseStorage(stack, 'KendraCaseSearch', {});
        new lambda.Function(stack, 'MockFunction', {
            code: lambda.Code.fromAsset('../infrastructure/test/mock-lambda-func/node-lambda'),
            runtime: COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME,
            handler: 'index.js',
            environment: {
                KENDRA_INDEX_ARN: kendraCaseStorage.kendraCaseSearchIndex.attrArn,
                KENDRA_ATTR_ID: kendraCaseStorage.kendraCaseSearchIndex.attrId
            }
        });
        template = Template.fromStack(kendraCaseStorage);
        jsonTemplate = template.toJSON();
    });

    it('should have kendra index created, with correct prop', () => {
        template.resourceCountIs('AWS::Kendra::Index', 1);
        template.resourceCountIs('AWS::IAM::Role', 1);

        console.debug(kendraCaseStorage.kendraCaseSearchRole.roleArn);
        template.hasResourceProperties('AWS::Kendra::Index', {
            CapacityUnits: {
                QueryCapacityUnits: {
                    Ref: 'QueryCapacityUnits'
                },
                StorageCapacityUnits: {
                    Ref: 'StorageCapacityUnits'
                }
            },
            Description: 'a kendra index for searching processed documents',
            DocumentMetadataConfigurations: [
                {
                    Name: `${KendraAttributes.CASE_ID}`,
                    Type: 'STRING_VALUE',
                    Search: {
                        Facetable: true,
                        Sortable: true,
                        Searchable: true,
                        Displayable: true
                    }
                },
                {
                    Name: `${KendraAttributes.DOC_ID}`,
                    Type: 'STRING_VALUE',
                    Search: {
                        Facetable: true,
                        Sortable: true,
                        Searchable: true,
                        Displayable: true
                    }
                },
                {
                    Name: `${KendraAttributes.DOC_TYPE}`,
                    Type: 'STRING_VALUE',
                    Search: {
                        Facetable: true,
                        Sortable: true,
                        Searchable: true,
                        Displayable: true
                    }
                },
                {
                    Name: `${KendraAttributes.FILE_NAME}`,
                    Type: 'STRING_VALUE',
                    Search: {
                        Facetable: true,
                        Sortable: true,
                        Searchable: true,
                        Displayable: true
                    }
                },
                {
                    Name: `${KendraAttributes.FILE_TYPE}`,
                    Type: 'STRING_VALUE',
                    Search: {
                        Facetable: true,
                        Sortable: true,
                        Searchable: true,
                        Displayable: true
                    }
                }
            ],
            Edition: {
                Ref: 'KendraIndexEdition'
            },
            Name: 'KendraCaseSearchIndex',
            RoleArn: { 'Fn::GetAtt': [kendraRoleCapture, 'Arn'] },
            ServerSideEncryptionConfiguration: {
                KmsKeyId: {
                    'Ref': kendraKeyCapture
                }
            },
            UserContextPolicy: 'USER_TOKEN',
            UserTokenConfigurations: [
                {
                    JwtTokenTypeConfiguration: {
                        GroupAttributeField: 'cognito:groups',
                        Issuer: {
                            'Fn::Join': [
                                '',
                                [
                                    'https://cognito-idp.',
                                    {
                                        'Ref': 'AWS::Region'
                                    },
                                    '.amazonaws.com/',
                                    {
                                        'Ref': 'ExtUserPoolId'
                                    }
                                ]
                            ]
                        },
                        KeyLocation: 'URL',
                        URL: {
                            'Fn::Join': [
                                '',
                                [
                                    'https://cognito-idp.',
                                    {
                                        'Ref': 'AWS::Region'
                                    },
                                    '.amazonaws.com/',
                                    {
                                        'Ref': 'ExtUserPoolId'
                                    },
                                    '/.well-known/jwks.json'
                                ]
                            ]
                        },
                        UserNameAttributeField: 'cognito:username'
                    }
                }
            ]
        });

        expect(jsonTemplate['Resources'][kendraRoleCapture._captured[0]]['Type']).toMatch('AWS::IAM::Role');
        expect(jsonTemplate['Resources'][kendraKeyCapture._captured[0]]['Type']).toMatch('AWS::KMS::Key');
    });

    it('should have parameters for nested stack', () => {
        template.hasParameter('QueryCapacityUnits', {
            Type: 'Number',
            Default: '0',
            Description:
                'The amount of extra query capacity for an index and [GetQuerySuggestions](https://docs.aws.amazon.com/kendra/latest/dg/API_GetQuerySuggestions.html) capacity.A single extra capacity unit for an index provides 0.1 queries per second or approximately 8,000 queries per day.',
            MaxValue: 1,
            MinValue: 0
        });

        template.hasParameter('StorageCapacityUnits', {
            Type: 'Number',
            Description:
                'The amount of extra storage capacity for an index. A single capacity unit provides 30 GB of storage space or 100,000 documents, whichever is reached first.',
            MaxValue: 5,
            MinValue: 0
        });

        template.hasParameter('KendraIndexEdition', {
            Type: 'String',
            Default: 'DEVELOPER_EDITION',
            AllowedValues: ['DEVELOPER_EDITION', 'ENTERPRISE_EDITION'],
            ConstraintDescription: 'You can only choose between "DEVELOPER_EDITION" OR "ENTERPRISE_EDITION"',
            Description: 'Indicates whether the index is a Enterprise Edition index or a Developer Edition index'
        });

        template.hasParameter('RoleArn', {
            Type: 'String',
            AllowedPattern: '^arn:(aws|aws-cn|aws-us-gov):iam::\\d{12}:role\\/\\S+$',
            ConstraintDescription: 'Please provide a valid IAM Role Arn',
            Description: 'The role Arn which will write to the Kendra Index'
        });

        template.hasParameter('QueryLambdaRoleArn', {
            Type: 'String',
            AllowedPattern: '^arn:(aws|aws-cn|aws-us-gov):iam::\\d{12}:role\\/\\S+$',
            ConstraintDescription: 'Please provide a valid IAM Role Arn',
            Description: 'The role Arn which will query the Kendra Index'
        });

        template.hasParameter('DocumentBucketName', {
            Type: 'String',
            ConstraintDescription: 'Please provide a valid Document Bucket Name',
            Description: 'The Document Bucket Name will be used to add policy to Kendra Index'
        });

        template.hasParameter('ExtUserPoolId', {
            Type: 'String',
            ConstraintDescription: 'Please provide a valid cognito user pool id',
            Description: 'The user pool id will be used to add ACLs to Kendra Index',
            AllowedPattern: '^[a-zA-Z0-9-_]+$'
        });
    });

    it('should have template output with for Kendra Index Arn and AttrId', () => {
        template.hasOutput('*', {
            Value: {
                'Fn::GetAtt': ['KendraCaseSearch', 'Arn']
            }
        });

        template.hasOutput('*', {
            Value: {
                'Fn::GetAtt': ['KendraCaseSearch', 'Id']
            }
        });
    });

    it('should create a kendra index policy', () => {
        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyDocument: {
                Statement: [
                    {
                        Action: [
                            'kendra:BatchPutDocument',
                            'kendra:SubmitFeedback',
                            'kendra:BatchDeleteDocument',
                            'kendra:Query'
                        ],
                        Effect: 'Allow',
                        Resource: {
                            'Fn::GetAtt': ['KendraCaseSearch', 'Arn']
                        }
                    },
                    {
                        Action: 'iam:PassRole',
                        Effect: 'Allow',
                        Resource: {
                            'Fn::GetAtt': [Match.stringLikeRegexp('KendraRole*'), 'Arn']
                        }
                    }
                ],
                Version: '2012-10-17'
            },
            PolicyName: Match.anyValue(),
            Roles: [
                {
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
                                                    Ref: 'RoleArn'
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        });
    });

    it('should create a policy to query the kendra index', () => {
        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyDocument: {
                Statement: [
                    {
                        Action: ['kendra:Query', 'kendra:SubmitFeedback'],
                        Effect: 'Allow',
                        Resource: {
                            'Fn::GetAtt': ['KendraCaseSearch', 'Arn']
                        }
                    }
                ],
                Version: '2012-10-17'
            },
            PolicyName: Match.anyValue(),
            Roles: [
                {
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
                                                    Ref: 'QueryLambdaRoleArn'
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        });
    });
});

describe('KendraCaseStorage optional params', () => {
    let template: Template;
    let kendraCaseSearch: KendraCaseStorage;

    beforeAll(() => {
        const stack = new cdk.Stack();
        kendraCaseSearch = new KendraCaseStorage(stack, 'KendraCaseSearch', {
            parameters: {
                QueryCapacityUnits: '50',
                StorageCapacityUnits: '5000'
            }
        });
        template = Template.fromStack(kendraCaseSearch);
    });

    it('should have default props overridden', () => {
        template.hasResourceProperties('AWS::Kendra::Index', {
            CapacityUnits: {
                QueryCapacityUnits: {
                    Ref: 'QueryCapacityUnits'
                },
                StorageCapacityUnits: {
                    Ref: 'StorageCapacityUnits'
                }
            }
        });
    });
});
