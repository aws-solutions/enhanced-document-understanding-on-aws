// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { Capture, Match, Template } from 'aws-cdk-lib/assertions';
import { CustomInfraSetup } from '../../lib/utils/custom-infra-setup';
import { SolutionHelper } from '../../lib/utils/solution-helper';
import * as rawCdkJson from '../../cdk.json';

describe('When solution helper construct is created', () => {
    let template: Template;
    let jsonTemplate: { [key: string]: any };

    beforeAll(() => {
        const stack = new cdk.Stack();
        const customInfra = new CustomInfraSetup(stack, 'TestInfra', {
            solutionID: rawCdkJson.context.solution_id,
            solutionVersion: rawCdkJson.context.solution_version
        });
        new SolutionHelper(stack, 'SolutionHelper', {
            customResource: customInfra.customResourceLambda,
            solutionID: 'SO0999',
            version: 'v9.9.9',
            deployKendraIndex: 'Yes',
            workflowConfigName: 'default'
        });

        template = Template.fromStack(stack);
        jsonTemplate = template.toJSON();
    });

    it('should create a custom resource for anonymous data', () => {
        const customResourceLambda = new Capture();

        template.resourceCountIs('Custom::AnonymousData', 1);
        template.hasResourceProperties('Custom::AnonymousData', {
            'ServiceToken': {
                'Fn::GetAtt': [customResourceLambda, 'Arn']
            },
            'Resource': 'ANONYMOUS_METRIC'
        });

        expect(jsonTemplate['Resources'][customResourceLambda.asString()]['Type']).toEqual('AWS::Lambda::Function');
    });

    const conditionLogicalId = new Capture();
    it('should have a custom resource block with a condition', () => {
        template.hasResource('Custom::AnonymousData', {
            Type: 'Custom::AnonymousData',
            Properties: Match.anyValue(),
            UpdateReplacePolicy: 'Delete',
            DeletionPolicy: 'Delete',
            Condition: conditionLogicalId
        });
    });

    it('should have a conditions block in the template', () => {
        template.hasCondition(conditionLogicalId.asString(), {
            'Fn::Equals': [
                {
                    'Fn::FindInMap': ['Solution', 'Data', 'SendAnonymousUsageData']
                },
                'Yes'
            ]
        });
    });
});
