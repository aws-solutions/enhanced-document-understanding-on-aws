// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { Capture, Match, Template } from 'aws-cdk-lib/assertions';
import * as rawCdkJson from '../cdk.json';

import { ApplicationSetup } from '../lib/application-setup';

import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';

import { COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME, DEFAULT_WORKFLOW_CONFIG_NAME } from '../lib/utils/constants';

import { extractWorkflowConfigNames } from '../lib/utils/common-utils';

describe('When AppSetup is created', () => {
    let template: Template;
    beforeAll(() => {
        const app = new cdk.App();
        const stack = new cdk.Stack(app, 'TestStack');
        new ApplicationSetup(stack, 'TestSetup', {
            appNamespace: rawCdkJson.context.app_namespace,
            solutionID: rawCdkJson.context.solution_id,
            solutionVersion: rawCdkJson.context.solution_version
        });
        template = Template.fromStack(stack);
    });

    it('should create a custom EventBus', () => {
        template.resourceCountIs('AWS::Events::EventBus', 1);
        template.hasResource('AWS::Events::EventBus', {
            Properties: {
                Name: Match.anyValue()
            }
        });
    });

    it('should create an access logging bucket', () => {
        template.resourceCountIs('AWS::S3::Bucket', 2);
        template.hasResourceProperties('AWS::S3::Bucket', {
            AccessControl: 'LogDeliveryWrite',
            BucketEncryption: {
                ServerSideEncryptionConfiguration: [
                    {
                        ServerSideEncryptionByDefault: {
                            SSEAlgorithm: 'AES256'
                        }
                    }
                ]
            },
            PublicAccessBlockConfiguration: {
                BlockPublicAcls: true,
                BlockPublicPolicy: true,
                IgnorePublicAcls: true,
                RestrictPublicBuckets: true
            }
        });
    });

    it('should have a App setup bucket', () => {
        template.hasResourceProperties('AWS::S3::Bucket', {
            AccessControl: Match.absent(),
            BucketEncryption: {
                ServerSideEncryptionConfiguration: [
                    {
                        ServerSideEncryptionByDefault: {
                            SSEAlgorithm: 'AES256'
                        }
                    }
                ]
            },
            LifecycleConfiguration: Match.absent(),
            LoggingConfiguration: {
                DestinationBucketName: {
                    Ref: Match.anyValue()
                },
                LogFilePrefix: 'AppConfig/'
            },
            PublicAccessBlockConfiguration: {
                BlockPublicAcls: true,
                BlockPublicPolicy: true,
                IgnorePublicAcls: true,
                RestrictPublicBuckets: true
            }
        });
    });

    it('should have a lambda function', () => {
        template.resourceCountIs('AWS::Lambda::Function', 2);
    });

    it('should create a custom resource to generate uuid', () => {
        template.resourceCountIs('Custom::GenUUID', 1);
        template.hasResourceProperties('Custom::GenUUID', {
            Resource: 'GEN_UUID'
        });
    });
});

describe('When addCustomDashboard is called', () => {
    let template: Template;

    beforeAll(() => {
        const app = new cdk.App();
        const stack = new cdk.Stack(app, 'TestStack');

        const applicationSetup = new ApplicationSetup(stack, 'TestSetup', {
            appNamespace: 'fake.namespace',
            solutionID: rawCdkJson.context.solution_id,
            solutionVersion: rawCdkJson.context.solution_version
        });

        applicationSetup.addCustomDashboard({
            apiName: new apigateway.LambdaRestApi(stack, 'Api', {
                handler: new lambda.Function(stack, 'Function', {
                    code: lambda.Code.fromAsset('../infrastructure/test/mock-lambda-func/python-lambda'),
                    handler: 'function.handler',
                    runtime: COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME
                })
            }).restApiName,
            userPoolId: 'fakeUserPoolId',
            genUUID: 'fake-uuid'
        });
        template = Template.fromStack(stack);
    });

    it('should have a condition for custom dashboard deployment', () => {
        template.hasCondition('DeployCustomDashboard', {
            'Fn::Equals': [
                {
                    'Fn::FindInMap': ['FeaturesToDeploy', 'Deploy', 'CustomDashboard']
                },
                'Yes'
            ]
        });
    });

    it('should deploy a custom cloudwatch dashboard', () => {
        template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });
});

describe('When createWebConfigStorage is called', () => {
    let template: Template;

    beforeAll(() => {
        const app = new cdk.App({
            context: rawCdkJson.context
        });
        const stack = new cdk.Stack(app, 'TestStack');
        const applicationSetup = new ApplicationSetup(stack, 'TestSetup', {
            appNamespace: rawCdkJson.context.app_namespace,
            solutionID: rawCdkJson.context.solution_id,
            solutionVersion: rawCdkJson.context.solution_version
        });
        const extUsrPool = new cognito.UserPool(stack, 'ExtUsrPool', {
            userPoolName: `${cdk.Aws.STACK_NAME}-ExtUsrPool`
        });
        const extUserPoolClient = new cognito.CfnUserPoolClient(stack, 'ClientApp', {
            userPoolId: extUsrPool.userPoolId
        });

        const mockWorkflowConfigName = new cdk.CfnParameter(stack, 'MockWorkflowConfigNameCfnParam', {
            type: 'String',
            allowedValues: extractWorkflowConfigNames(),
            default: DEFAULT_WORKFLOW_CONFIG_NAME
        });

        applicationSetup.createWebConfigStorage({
            workflowConfigName: mockWorkflowConfigName,
            apiEndpoint: new apigateway.LambdaRestApi(stack, 'Api', {
                handler: new lambda.Function(stack, 'Function', {
                    code: lambda.Code.fromAsset('../infrastructure/test/mock-lambda-func/python-lambda'),
                    handler: 'function.handler',
                    runtime: COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME
                })
            }).url,
            userPoolId: extUsrPool.userPoolId,
            userPoolClientId: extUserPoolClient.ref,
            deployKendraIndexCondition: new cdk.CfnCondition(stack, 'DeployKendraIndex', {
                expression: cdk.Fn.conditionEquals('Yes', 'Yes')
            }),
            deployOpenSearchCondition: new cdk.CfnCondition(stack, 'DeployOpenSearchCondition', {
                expression: cdk.Fn.conditionEquals('Yes', 'Yes')
            })
        });
        template = Template.fromStack(stack);
    });

    const lambdaCustomResourceCapture = new Capture();

    it('should create a custom resource to that provisions infrastructure to store WebConfig', () => {
        const userPoolCapture = new Capture();
        const userPoolClientCapture = new Capture();
        const deployKendraIndexCondition = new Capture();
        const workflowConfigDdbTableCapture = new Capture();
        template.hasResourceProperties('Custom::WriteWebConfig', {
            ServiceToken: {
                'Fn::GetAtt': [lambdaCustomResourceCapture, 'Arn']
            },
            Resource: 'WEBCONFIG',
            SSM_KEY: {
                'Fn::Join': [
                    '',
                    [
                        '/',
                        {
                            'Ref': 'AWS::StackName'
                        },
                        '/app.idp/webconfig'
                    ]
                ]
            },
            API_ENDPOINT: {
                'Fn::Join': [
                    '',
                    [
                        'https://',
                        {
                            Ref: Match.anyValue()
                        },
                        '.execute-api.',
                        {
                            Ref: 'AWS::Region'
                        },
                        '.',
                        {
                            Ref: 'AWS::URLSuffix'
                        },
                        '/',
                        {
                            Ref: Match.anyValue()
                        },
                        '/'
                    ]
                ]
            },
            USER_POOL_ID: {
                Ref: userPoolCapture
            },
            USER_POOL_CLIENT_ID: {
                Ref: userPoolClientCapture
            },
            KENDRA_STACK_DEPLOYED: {
                'Fn::If': [deployKendraIndexCondition, 'Yes', 'No']
            },
            WORKFLOW_CONFIG_DDB_TABLE_NAME: { Ref: workflowConfigDdbTableCapture },
            WORKFLOW_CONFIG_NAME: { Ref: 'MockWorkflowConfigNameCfnParam' }
        });

        const jsonTemplate = template.toJSON();
        expect(jsonTemplate['Resources'][workflowConfigDdbTableCapture.asString()]['Type']).toEqual(
            'AWS::DynamoDB::Table'
        );
        expect(jsonTemplate['Resources'][lambdaCustomResourceCapture.asString()]['Type']).toEqual(
            'AWS::Lambda::Function'
        );
        expect(jsonTemplate['Resources'][userPoolCapture.asString()]['Type']).toEqual('AWS::Cognito::UserPool');
        expect(jsonTemplate['Resources'][userPoolClientCapture.asString()]['Type']).toEqual(
            'AWS::Cognito::UserPoolClient'
        );
        expect(jsonTemplate['Conditions']['DeployKendraIndex']['Fn::Equals']).toEqual(['Yes', 'Yes']);
    });

    it('should have a policy to write to SSM Parameter store', () => {
        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyDocument: {
                Statement: [
                    {
                        Action: ['ssm:DeleteParameter', 'ssm:GetParameter', 'ssm:PutParameter'],
                        Effect: 'Allow',
                        Resource: {
                            'Fn::Join': [
                                '',
                                [
                                    'arn:',
                                    {
                                        Ref: 'AWS::Partition'
                                    },
                                    ':ssm:',
                                    {
                                        Ref: 'AWS::Region'
                                    },
                                    ':',
                                    {
                                        Ref: 'AWS::AccountId'
                                    },
                                    ':parameter/',
                                    {
                                        Ref: 'AWS::StackName'
                                    },
                                    '/app.idp/webconfig'
                                ]
                            ]
                        }
                    }
                ],
                Version: '2012-10-17'
            },
            PolicyName: Match.anyValue(),
            Roles: [
                {
                    'Ref': `${
                        template.toJSON()['Resources'][lambdaCustomResourceCapture.asString()]['Properties']['Role'][
                            'Fn::GetAtt'
                        ][0]
                    }`
                }
            ]
        });
    });

    it('should have an exported output value', () => {
        template.hasOutput('WebConfigKey', {
            Value: {
                'Fn::Join': [
                    '',
                    [
                        '/',
                        {
                            Ref: 'AWS::StackName'
                        },
                        '/app.idp/webconfig'
                    ]
                ]
            },
            Export: {
                Name: 'WebConfig'
            }
        });
    });
});

describe('Before and after addAnonymousMetricsCustomLambda is called', () => {
    let template: Template;

    beforeAll(() => {
        const app = new cdk.App();
        const stack = new cdk.Stack(app, 'TestStack');
        template = Template.fromStack(stack);
    });

    it('should have a not Custom Anonymous Data resource', () => {
        template.resourceCountIs('Custom::AnonymousData', 0);
    });

    describe('When addAnonymousMetricsCustomLambda is called', () => {
        beforeAll(() => {
            const app = new cdk.App();
            const stack = new cdk.Stack(app, 'TestStack');

            const applicationSetup = new ApplicationSetup(stack, 'TestSetup', {
                appNamespace: 'fake.namespace',
                solutionID: rawCdkJson.context.solution_id,
                solutionVersion: rawCdkJson.context.solution_version
            });

            applicationSetup.addAnonymousMetricsCustomLambda('SO0999', 'v9.9.9', 'Yes', 'default');
            template = Template.fromStack(stack);
        });

        it('should have a Custom Anonymous Data properties', () => {
            const customResourceLambda = new Capture();
            template.resourceCountIs('Custom::AnonymousData', 1);
            template.hasResourceProperties('Custom::AnonymousData', {
                ServiceToken: {
                    'Fn::GetAtt': [customResourceLambda, 'Arn']
                },
                Resource: 'ANONYMOUS_METRIC',
                SolutionId: 'SO0999',
                Version: 'v9.9.9',
                DeployKendraIndex: 'Yes',
                WorkflowConfigName: 'default'
            });
        });

        it('should have a custom resource block with a condition', () => {
            const conditionLogicalId = new Capture();
            template.hasResource('Custom::AnonymousData', {
                Type: 'Custom::AnonymousData',
                Properties: Match.anyValue(),
                UpdateReplacePolicy: 'Delete',
                DeletionPolicy: 'Delete',
                Condition: conditionLogicalId
            });
        });
    });
});
