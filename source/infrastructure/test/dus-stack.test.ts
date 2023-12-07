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
import * as rawCdkJson from '../cdk.json';

import { Capture, Match, Template } from 'aws-cdk-lib/assertions';

import { DusStack } from '../lib/dus-stack';
import { COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME, EventSources } from '../lib/utils/constants';

describe('When App is created', () => {
    let template: Template;
    let jsonTemplate: { [key: string]: any };
    let stack: cdk.Stack;

    beforeAll(() => {
        [template, jsonTemplate, stack] = buildStack();
    });

    describe('when workflow stacks are created', () => {
        it('should create nested workflows for textract, redaction and entity detection', () => {
            template.resourceCountIs('AWS::CloudFormation::Stack', 6);
            template.hasResource('AWS::CloudFormation::Stack', {
                Type: 'AWS::CloudFormation::Stack',
                Properties: {
                    TemplateURL: {
                        'Fn::Join': [
                            '',
                            [
                                'https://s3.',
                                {
                                    Ref: 'AWS::Region'
                                },
                                '.',
                                {
                                    Ref: 'AWS::URLSuffix'
                                },
                                '/',
                                {
                                    'Fn::Sub': Match.anyValue()
                                },
                                Match.anyValue()
                            ]
                        ]
                    },
                    Parameters: {
                        GenUUID: { 'Fn::GetAtt': [Match.stringLikeRegexp('SetupGenUUID*'), 'UUID'] }
                    }
                },
                UpdateReplacePolicy: 'Delete',
                DeletionPolicy: 'Delete'
            });
        });

        it('should have a description in the nested stack', () => {
            const dusStack = stack as DusStack;
            expect(Template.fromStack(dusStack.textractWorkflow).toJSON()['Description']).toEqual(
                'Nested Stack that deploys components to interact with Amazon Textract for uploaded documents'
            );

            expect(Template.fromStack(dusStack.entityDetectionWorkflow).toJSON()['Description']).toEqual(
                'Nested Stack that deploys components to interact with Amazon Comprehend and Amazon Comprehend Medical for uploaded documents'
            );

            expect(Template.fromStack(dusStack.redactionWorkflow).toJSON()['Description']).toEqual(
                'Nested Stack that deploys components to redact content in uploaded documents'
            );
        });

        it('should have a condition for textract workflow', () => {
            template.hasCondition('DeployTextractWorkflow', {
                'Fn::Equals': [
                    {
                        'Fn::FindInMap': ['FeaturesToDeploy', 'Deploy', 'TextractWorkflow']
                    },
                    'Yes'
                ]
            });
        });

        it('should have a condition for Comprehend workflow', () => {
            template.hasCondition('DeployComprehendWorkflow', {
                'Fn::Equals': [
                    {
                        'Fn::FindInMap': ['FeaturesToDeploy', 'Deploy', 'ComprehendWorkflow']
                    },
                    'Yes'
                ]
            });
        });

        it('should have a condition for Redaction workflow', () => {
            template.hasCondition('DeployRedactionWorkflow', {
                'Fn::Equals': [
                    {
                        'Fn::FindInMap': ['FeaturesToDeploy', 'Deploy', 'RedactionWorkflow']
                    },
                    'Yes'
                ]
            });
        });
    });

    it('has a cloudformation parameter for email', () => {
        template.hasParameter('DefaultUserEmail', {
            Type: 'String',
            AllowedPattern: "^$|[A-Za-z0-9_!#$%&'*+/=?`{|}~^.-]+@[A-Za-z0-9.-]+$",
            ConstraintDescription: 'Please provide a valid email, or leave blank',
            Description:
                'Optional email to create a Cognito user with access to the application, and to receive document processing notifications from the application.'
        });
    });

    describe('When the UI stack is deployed', () => {
        it('should have UI stack as a nested stack', () => {
            template.hasResource('AWS::CloudFormation::Stack', {
                Type: 'AWS::CloudFormation::Stack',
                Properties: {
                    TemplateURL: Match.anyValue(),
                    Parameters: {
                        WebConfigKey: {
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
                        CustomResourceLambdaArn: {
                            'Fn::GetAtt': [Match.stringLikeRegexp('SetupInfraSetupCustomResource*'), 'Arn']
                        },
                        CustomResourceRoleArn: {
                            'Fn::GetAtt': [Match.stringLikeRegexp('SetupCustomResourceLambdaRole*'), 'Arn']
                        },
                        AccessLoggingBucketArn: {
                            'Fn::GetAtt': [Match.stringLikeRegexp('SetupAccessLog*'), 'Arn']
                        }
                    }
                },
                DependsOn: [Match.stringLikeRegexp('SetupAccessLogPolicy*'), 'WebConfig'],
                UpdateReplacePolicy: 'Delete',
                DeletionPolicy: 'Delete',
                Condition: 'DeployWebApp'
            });
        });

        it('should have a description in the nested UI stack', () => {
            const dusStack = stack as DusStack;
            expect(Template.fromStack(dusStack.uiInfrastructure.nestedUIStack).toJSON()['Description']).toEqual(
                'Nested stack that deploys UI components that include an S3 bucket for web assets and a CloudFront distribution'
            );
        });
    });

    describe('When Kendra is deployed', () => {
        it('should have Kendra as a nested stack', () => {
            template.hasResource('AWS::CloudFormation::Stack', {
                Type: 'AWS::CloudFormation::Stack',
                Properties: {
                    TemplateURL: Match.anyValue(),
                    Parameters: {
                        QueryCapacityUnits: '0',
                        StorageCapacityUnits: '0',
                        RoleArn: {
                            'Fn::GetAtt': [
                                Match.stringLikeRegexp('RequestProcessorEventOrchestratorLambdaFunctionServiceRole*'),
                                'Arn'
                            ]
                        },
                        QueryLambdaRoleArn: {
                            'Fn::GetAtt': [Match.stringLikeRegexp('SearchLambdaServiceRole*'), 'Arn']
                        },
                        DocumentBucketName: {
                            Ref: Match.stringLikeRegexp('RequestProcessorDocumentRepo*')
                        },
                        ExtUserPoolId: {
                            Ref: Match.stringLikeRegexp('RequestProcessorApiExtUsrPoolD*')
                        }
                    }
                },
                UpdateReplacePolicy: 'Delete',
                DeletionPolicy: 'Delete',
                Condition: Match.stringLikeRegexp('IndexedStorageDeployKendraIndexCondition*')
            });
        });

        it('should have a description in the nested stack', () => {
            const dusStack = stack as DusStack;
            expect(Template.fromStack(dusStack.indexedStorage.kendraCaseSearch).toJSON()['Description']).toEqual(
                'Nested Stack that creates the Kendra Index'
            );
        });

        it('should have kendra as conditional environment variables for lambda functions', () => {
            const deployKendraIndexCondition = new Capture();
            const kendraIndexNestedStack = new Capture();

            template.hasResourceProperties('AWS::Lambda::Function', {
                Code: Match.anyValue(),
                Role: Match.anyValue(),
                Environment: {
                    Variables: {
                        CASE_DDB_TABLE_NAME: Match.anyValue(),
                        WORKFLOW_CONFIG_TABLE_NAME: Match.anyValue(),
                        S3_UPLOAD_PREFIX: Match.anyValue(),
                        EVENT_BUS_ARN: {
                            'Fn::GetAtt': [Match.stringLikeRegexp('SetupEventOrchestrator*'), 'Arn']
                        },
                        WORKFLOW_CONFIG_NAME: Match.anyValue(),
                        KENDRA_INDEX_ID: {
                            'Fn::If': [
                                deployKendraIndexCondition,
                                {
                                    'Fn::GetAtt': [
                                        kendraIndexNestedStack,
                                        Match.stringLikeRegexp('Outputs.DusStackIndexedStorageKendraCaseSearch*')
                                    ]
                                },
                                {
                                    Ref: 'AWS::NoValue'
                                }
                            ]
                        },
                        KENDRA_ROLE_ARN: {
                            'Fn::If': [
                                deployKendraIndexCondition,
                                {
                                    'Fn::GetAtt': [
                                        kendraIndexNestedStack,
                                        Match.stringLikeRegexp(
                                            'Outputs.DusStackIndexedStorageKendraCaseSearchKendraRole*'
                                        )
                                    ]
                                },
                                {
                                    Ref: 'AWS::NoValue'
                                }
                            ]
                        },
                        APP_NAMESPACE: {
                            'Fn::FindInMap': ['Solution', 'Data', 'AppNamespace']
                        }
                    }
                },
                Handler: 'index.handler',
                Runtime: COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME.name,
                Timeout: 900,
                TracingConfig: {
                    Mode: 'Active'
                }
            });

            const jsonTemplate = template.toJSON();

            expect(jsonTemplate['Conditions'][deployKendraIndexCondition.asString()]).toEqual({
                'Fn::Equals': [{ Ref: 'DeployKendraIndex' }, 'Yes']
            });

            expect(jsonTemplate['Resources'][kendraIndexNestedStack.asString()]['Type']).toEqual(
                'AWS::CloudFormation::Stack'
            );
        });
    });

    describe('When Sample Documents are deployed', () => {
        it('should have Sample Documents as a nested stack', () => {
            template.hasResource('AWS::CloudFormation::Stack', {
                Type: 'AWS::CloudFormation::Stack',
                Properties: {
                    TemplateURL: Match.anyValue(),
                    Parameters: {
                        SamplesSourceBucketName: {
                            'Ref': Match.stringLikeRegexp('SetupAppConfig*')
                        },
                        SamplesCustomResourceLambdaArn: {
                            'Fn::GetAtt': [Match.stringLikeRegexp('SetupInfraSetupCustomResource*'), 'Arn']
                        }
                    }
                },
                UpdateReplacePolicy: 'Delete',
                DeletionPolicy: 'Delete',
                DependsOn: [Match.stringLikeRegexp('NotificationManagerCopyTemplates*')],
                Condition: 'DeploySamples'
            });
        });

        it('should have a condition for deploying samples', () => {
            template.hasCondition('DeploySamples', {
                'Fn::Equals': [
                    {
                        'Fn::FindInMap': ['FeaturesToDeploy', 'Deploy', 'SampleDocuments']
                    },
                    'Yes'
                ]
            });
        });

        it('should create a condition to check if the samples should be deployed', () => {
            template.hasCondition('DeploySamples', {
                'Fn::Equals': [
                    {
                        'Fn::FindInMap': ['FeaturesToDeploy', 'Deploy', 'SampleDocuments']
                    },
                    'Yes'
                ]
            });
        });

        it('should have conditions attached to nested stack for deployment', () => {
            template.hasResource('AWS::CloudFormation::Stack', {
                Type: 'AWS::CloudFormation::Stack',
                Properties: Match.anyValue(),
                UpdateReplacePolicy: 'Delete',
                DeletionPolicy: 'Delete',
                Condition: 'DeploySamples'
            });
        });
    });

    it('should have a condition for Web App workflow', () => {
        template.hasCondition('DeployWebApp', {
            'Fn::Equals': [
                {
                    'Fn::FindInMap': ['FeaturesToDeploy', 'Deploy', 'WebApp']
                },
                'Yes'
            ]
        });
    });

    describe('When deploying custom dashboard', () => {
        it('should have a condition for deploying custom dashboard', () => {
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

    it('should have a dependency on the custom resource to create the policy before executing the custom resource', () => {
        template.hasResource('AWS::CloudFormation::Stack', {
            Type: 'AWS::CloudFormation::Stack',
            Properties: Match.anyValue(),
            DependsOn: [Match.stringLikeRegexp('NotificationManagerCopy*')]
        });
    });
});

describe('With all environment variables and context.json available', () => {
    let template: Template;
    let jsonTemplate: { [key: string]: any };

    beforeAll(() => {
        process.env.DIST_OUTPUT_BUCKET = 'fake-artifact-bucket';
        process.env.SOLUTION_ID = 'SO0999';
        process.env.SOLUTION_NAME = 'fake-solution-name';
        process.env.VERSION = 'v9.9.9';
        process.env.APP_NAMESPACE = 'app.idp';

        [template, jsonTemplate] = buildStack();
    });

    afterAll(() => {
        delete process.env.DIST_OUTPUT_BUCKET;
        delete process.env.SOLUTION_ID;
        delete process.env.SOLUTION_NAME;
        delete process.env.VERSION;
        delete process.env.APP_NAMESPACE;
    });

    describe('When synthesizing through standard pipeline, it should generate necessary mapping', () => {
        it('has mapping for "Data"', () => {
            expect(jsonTemplate['Mappings']['Solution']['Data']['SendAnonymousUsageData']).toEqual('Yes');
            expect(jsonTemplate['Mappings']['Solution']['Data']['ID']).toEqual(process.env.SOLUTION_ID);
            expect(jsonTemplate['Mappings']['Solution']['Data']['Version']).toEqual(process.env.VERSION);
            expect(jsonTemplate['Mappings']['Solution']['Data']['SolutionName']).toEqual(process.env.SOLUTION_NAME);
            expect(jsonTemplate['Mappings']['Solution']['Data']['AppNamespace']).toEqual(process.env.APP_NAMESPACE);
        });

        it('has mapping for "SourceCode', () => {
            expect(jsonTemplate['Mappings']['SourceCode']['General']).toEqual({
                S3Bucket: process.env.DIST_OUTPUT_BUCKET,
                KeyPrefix: `${process.env.SOLUTION_NAME}/${process.env.VERSION}`
            });
        });

        it('has mapping for features to be deployed', () => {
            expect(jsonTemplate['Mappings']['FeaturesToDeploy']['Deploy']['TextractWorkflow']).toEqual('Yes');
            expect(jsonTemplate['Mappings']['FeaturesToDeploy']['Deploy']['ComprehendWorkflow']).toEqual('Yes');
            expect(jsonTemplate['Mappings']['FeaturesToDeploy']['Deploy']['RedactionWorkflow']).toEqual('Yes');
            expect(jsonTemplate['Mappings']['FeaturesToDeploy']['Deploy']['CustomDashboard']).toEqual('Yes');
        });
    });

    describe('When creating a rule to trigger the workflow orchestrator', () => {
        it('Should create and attach the required event rule', () => {
            template.resourceCountIs('AWS::Events::Rule', 6);
            template.hasResourceProperties('AWS::Events::Rule', {
                EventBusName: {
                    Ref: Match.stringLikeRegexp('SetupEventOrchestrator*')
                },
                EventPattern: {
                    source: [
                        {
                            'Fn::Join': [
                                '',
                                [
                                    `${EventSources.WORKFLOW_STEPFUNCTION}.`,
                                    {
                                        'Fn::FindInMap': ['Solution', 'Data', 'AppNamespace']
                                    }
                                ]
                            ]
                        }
                    ]
                },
                State: 'ENABLED',
                Targets: [
                    {
                        Arn: {
                            'Fn::GetAtt': [
                                Match.stringLikeRegexp(
                                    'NotificationManagerEventRuleToCompleteNotificationLambdaFunction*'
                                ),
                                'Arn'
                            ]
                        },
                        Id: 'Target0'
                    }
                ]
            });
        });
    });

    describe('Anonymous custom lambda exists', () => {
        it('should have a Custom Anonymous Data resource', () => {
            const customResourceLambda = new Capture();
            template.resourceCountIs('Custom::AnonymousData', 1);
            template.hasResourceProperties('Custom::AnonymousData', {
                ServiceToken: {
                    'Fn::GetAtt': [customResourceLambda, 'Arn']
                },
                Resource: 'ANONYMOUS_METRIC',
                SolutionId: 'SO0999',
                Version: 'v9.9.9',
                DeployKendraIndex: {
                    Ref: 'DeployKendraIndex'
                },
                WorkflowConfigName: {
                    Ref: 'WorkflowConfigName'
                }
            });
        });

        it('should have a Custom Anonymous Lambda with required env vars', () => {
            template.resourceCountIs('AWS::Lambda::Function', 10);
            template.hasResourceProperties('AWS::Lambda::Function', {
                Environment: {
                    Variables: {
                        POWERTOOLS_SERVICE_NAME: 'ANONYMOUS-CW-METRICS',
                        LOG_LEVEL: 'DEBUG',
                        SOLUTION_ID: 'SO0999',
                        SOLUTION_VERSION: 'v9.9.9',
                        REST_API_NAME: {
                            'Fn::Join': [
                                '',
                                [
                                    {
                                        'Ref': 'AWS::StackName'
                                    },
                                    '-RestAPI'
                                ]
                            ]
                        },
                        USER_POOL_ID: {
                            'Ref': 'RequestProcessorApiExtUsrPoolD660310E'
                        },
                        KENDRA_INDEX_ID: {
                            'Fn::If': [
                                Match.stringLikeRegexp('IndexedStorageDeployKendraIndexCondition*'),
                                {
                                    'Fn::GetAtt': [
                                        Match.stringLikeRegexp(
                                            'IndexedStorageKendraCaseSearchNestedStackKendraCaseSearchNestedStackResource*'
                                        ),
                                        Match.stringLikeRegexp('Outputs.DusStackIndexedStorageKendraCaseSearch*')
                                    ]
                                },
                                {
                                    'Ref': 'AWS::NoValue'
                                }
                            ]
                        },
                        UUID: {
                            'Fn::GetAtt': [Match.stringLikeRegexp('SetupGenUUID*'), 'UUID']
                        }
                    }
                },
                Handler: 'lambda_ops_metrics.handler'
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

function buildStack(): [Template, { [key: string]: any }, cdk.Stack] {
    let template: Template;
    let jsonTemplate: { [key: string]: any };

    const app = new cdk.App({
        context: rawCdkJson.context
    });

    const solutionID = process.env.SOLUTION_ID ?? app.node.tryGetContext('solution_id');
    const version = process.env.VERSION ?? app.node.tryGetContext('solution_version');
    const solutionName = process.env.SOLUTION_NAME ?? app.node.tryGetContext('solution_name');
    const appNamespace = app.node.tryGetContext('app_namespace');

    const stack = new DusStack(app, 'DusStack', {
        solutionID: solutionID,
        solutionVersion: version,
        solutionName: solutionName,
        appNamespace: appNamespace,
        applicationTrademarkName: rawCdkJson.context.application_trademark_name
    });
    template = Template.fromStack(stack);
    jsonTemplate = template.toJSON();

    return [template, jsonTemplate, stack];
}
