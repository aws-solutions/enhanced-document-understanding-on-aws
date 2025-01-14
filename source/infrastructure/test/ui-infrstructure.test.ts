// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as rawCdkJson from '../cdk.json';
import { ApplicationSetup } from '../lib/application-setup';
import { UIInfrastructure } from '../lib/ui-infrastructure';

describe('When this construct is instantiated', () => {
    let template: Template;
    beforeAll(() => {
        const app = new cdk.App({
            context: rawCdkJson.context
        });
        const stack = new cdk.Stack(app);
        const appNamespace = stack.node.tryGetContext('app_namespace');
        const applicationSetup = new ApplicationSetup(stack, 'AppSetup', {
            appNamespace: appNamespace,
            solutionID: rawCdkJson.context.solution_id,
            solutionVersion: rawCdkJson.context.solution_version
        });

        new UIInfrastructure(stack, 'TestUIInfra', {
            webRuntimeConfigKey: `/${cdk.Aws.STACK_NAME}/${appNamespace}/webconfig`,
            customInfra: applicationSetup.customResourceLambda,
            accessLoggingBucket: applicationSetup.accessLoggingBucket
        });

        template = Template.fromStack(stack);
    });

    it('should create a condition to check if the UI should be deployed', () => {
        template.hasCondition('DeployWebApp', {
            'Fn::Equals': [
                {
                    'Fn::FindInMap': ['FeaturesToDeploy', 'Deploy', 'WebApp']
                },
                'Yes'
            ]
        });
    });

    it('should have a nested stack', () => {
        template.resourceCountIs('AWS::CloudFormation::Stack', 1);
    });

    it('should have a nested stack with 4 parameters', () => {
        template.hasResourceProperties('AWS::CloudFormation::Stack', {
            TemplateURL: Match.anyValue(),
            Parameters: {
                WebConfigKey: {
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
                CustomResourceLambdaArn: {
                    'Fn::GetAtt': [Match.stringLikeRegexp('AppSetupInfraSetupCustomResource*'), 'Arn']
                },
                CustomResourceRoleArn: {
                    'Fn::GetAtt': [Match.stringLikeRegexp('AppSetupCustomResourceLambdaRole*'), 'Arn']
                },
                AccessLoggingBucketArn: {
                    'Fn::GetAtt': [Match.stringLikeRegexp('AppSetupAccessLog*'), 'Arn']
                }
            }
        });
    });

    it('should have condition attached to nested stack for deployment', () => {
        template.hasResource('AWS::CloudFormation::Stack', {
            Type: 'AWS::CloudFormation::Stack',
            Properties: Match.anyValue(),
            UpdateReplacePolicy: 'Delete',
            DeletionPolicy: 'Delete',
            Condition: 'DeployWebApp'
        });
    });
});
