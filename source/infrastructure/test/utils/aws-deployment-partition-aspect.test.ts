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
import { Template } from 'aws-cdk-lib/assertions';
import * as api from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as rawCdkJson from '../../cdk.json';
import { DusStack } from '../../lib/dus-stack';

import {
    ApiGatewayEndpointTypeResourceObserver,
    CfnResourceObserver,
    CognitoUserPoolAdvancedSecurityModeObserver,
    LambdaRuntimeResourceObserver,
    S3WebResourceObserver
} from '../../lib/govcloud/cfn-resource-observer';
import { AwsDeploymentPartitionAspects } from '../../lib/utils/aws-deployment-partition-aspects';
import {
    COMMERCIAL_REGION_LAMBDA_JAVA_RUNTIME,
    COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME,
    GOV_CLOUD_REGION_LAMBDA_JAVA_RUNTIME,
    GOV_CLOUD_REGION_LAMBDA_PYTHON_RUNTIME
} from '../../lib/utils/constants';

describe('add govcloud aspect', () => {
    let template: Template;
    let jsonTemplate;
    let stack: cdk.Stack;

    beforeAll(() => {
        [template, jsonTemplate, stack] = buildStack();
    });

    it('should have a python runtime with a condition for a govcloud', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
            Runtime: {
                'Fn::If': [
                    'isGovCloudPartition',
                    GOV_CLOUD_REGION_LAMBDA_PYTHON_RUNTIME.name,
                    COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME.name
                ]
            }
        });
    });

    it('should have java runtime with a condition for a govcloud', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
            Runtime: {
                'Fn::If': [
                    'isGovCloudPartition',
                    GOV_CLOUD_REGION_LAMBDA_JAVA_RUNTIME.name,
                    COMMERCIAL_REGION_LAMBDA_JAVA_RUNTIME.name
                ]
            }
        });
    });

    it('should have an apigateway endpoint type with a condition for govcloud', () => {
        template.hasResourceProperties('AWS::ApiGateway::RestApi', {
            EndpointConfiguration: {
                Types: [
                    {
                        'Fn::If': ['isGovCloudPartition', 'REGIONAL', 'EDGE']
                    }
                ]
            }
        });
    });

    it('should have a cognito userpool with a condition for govcloud when configuring advanced security mode', () => {
        template.hasResourceProperties('AWS::Cognito::UserPool', {
            UserPoolAddOns: {
                'Fn::If': [
                    'isGovCloudPartition',
                    { Ref: 'AWS::NoValue' },
                    {
                        AdvancedSecurityMode: 'ENFORCED'
                    }
                ]
            }
        });
    });

    it('should have a condition for S3 web nested stack deployment', () => {
        template.hasResource('AWS::CloudFormation::Stack', {
            Condition: 'DeployS3Web'
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
    const applicationTrademarkName = rawCdkJson.context.application_trademark_name;

    const stack = new DusStack(app, 'DusStack', {
        solutionID: solutionID,
        solutionVersion: version,
        solutionName: solutionName,
        appNamespace: appNamespace,
        applicationTrademarkName: applicationTrademarkName
    });

    const cfnObserverMap = new Map<string, CfnResourceObserver[]>();
    cfnObserverMap.set(lambda.Function.name, [new LambdaRuntimeResourceObserver()]);
    cfnObserverMap.set(cdk.CfnStack.name, [new S3WebResourceObserver()]);
    cfnObserverMap.set(api.CfnRestApi.name, [new ApiGatewayEndpointTypeResourceObserver()]);
    cfnObserverMap.set(cognito.CfnUserPool.name, [new CognitoUserPoolAdvancedSecurityModeObserver()]);

    cdk.Aspects.of(app).add(new AwsDeploymentPartitionAspects(cfnObserverMap));
    template = Template.fromStack(stack);
    jsonTemplate = template.toJSON();

    return [template, jsonTemplate, stack];
}
