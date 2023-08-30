#!/usr/bin/env node
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

import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';
import * as api from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';

import { AwsSolutionsChecks } from 'cdk-nag';
import { DusStack } from '../lib/dus-stack';
import {
    ApiGatewayEndpointTypeResourceObserver,
    CfnResourceObserver,
    CognitoUserPoolAdvancedSecurityModeObserver,
    LambdaRuntimeResourceObserver,
    S3WebResourceObserver
} from '../lib/govcloud/cfn-resource-observer';
import { AppRegistry } from '../lib/utils/app-registry-aspects';
import { AwsDeploymentPartitionAspects } from '../lib/utils/aws-deployment-partition-aspects';
import { LambdaAspects } from '../lib/utils/lambda-aspect';

const app = new cdk.App();
const solutionID = process.env.SOLUTION_ID ?? app.node.tryGetContext('solution_id');
const version = process.env.VERSION ?? app.node.tryGetContext('solution_version');
const solutionName = process.env.SOLUTION_NAME ?? app.node.tryGetContext('solution_name');
const namespace = process.env.APP_NAMESPACE ?? app.node.tryGetContext('app_namespace');
const applicationType = app.node.tryGetContext('application_type');
const applicationName = app.node.tryGetContext('app_registry_name');
const applicationTrademarkName = app.node.tryGetContext('application_trademark_name');

const dus = new DusStack(app, 'DocUnderstanding', {
    description: `(${solutionID}) - ${solutionName}. Version ${version}`,
    synthesizer: new cdk.DefaultStackSynthesizer({
        generateBootstrapVersionRule: false
    }),
    solutionID: solutionID,
    solutionVersion: version,
    solutionName: solutionName,
    appNamespace: namespace,
    applicationTrademarkName: applicationTrademarkName
});

// adding cdk-nag checks
cdk.Aspects.of(app).add(new AwsSolutionsChecks());

// adding app registry
cdk.Aspects.of(app).add(
    new AppRegistry(dus, 'AppRegistry', {
        solutionID: solutionID,
        solutionVersion: version,
        solutionName: solutionName,
        applicationType: applicationType,
        applicationName: applicationName
    })
);

// adding lambda layer to all lambda functions for injecting user-agent for SDK calls to AWS services.
cdk.Aspects.of(app).add(
    new LambdaAspects(dus, 'AspectInject', {
        solutionID: solutionID,
        solutionVersion: version
    })
);

const cfnObserverMap = new Map<string, CfnResourceObserver[]>();
cfnObserverMap.set(lambda.Function.name, [new LambdaRuntimeResourceObserver()]);
cfnObserverMap.set(cdk.CfnStack.name, [new S3WebResourceObserver()]);
cfnObserverMap.set(api.CfnRestApi.name, [new ApiGatewayEndpointTypeResourceObserver()]);
cfnObserverMap.set(cognito.CfnUserPool.name, [new CognitoUserPoolAdvancedSecurityModeObserver()]);

cdk.Aspects.of(app).add(new AwsDeploymentPartitionAspects(cfnObserverMap));

app.synth();
