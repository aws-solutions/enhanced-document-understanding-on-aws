// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import * as api from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import { Construct } from 'constructs';

import { Template } from 'aws-cdk-lib/assertions';
import {
    ApiGatewayEndpointTypeResourceObserver,
    CognitoUserPoolAdvancedSecurityModeObserver,
    LambdaRuntimeResourceObserver,
    S3WebResourceObserver
} from '../../lib/govcloud/cfn-resource-observer';
import { UIAssets } from '../../lib/s3web/ui-asset';
import {
    COMMERCIAL_REGION_LAMBDA_JAVA_RUNTIME,
    COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME,
    GOV_CLOUD_REGION_LAMBDA_JAVA_RUNTIME,
    GOV_CLOUD_REGION_LAMBDA_PYTHON_RUNTIME
} from '../../lib/utils/constants';

describe('When lambda runtime observer is added to a resource', () => {
    let stack: cdk.Stack;
    let cfnCondition: cdk.CfnCondition;
    let pythonLambda: lambda.Function;
    let nodeLambda: lambda.Function;
    let javaLambda: lambda.Function;

    beforeEach(() => {
        stack = new cdk.Stack();

        cfnCondition = createGovCloudCondition(stack);

        pythonLambda = new lambda.Function(stack, 'pythonLambda', {
            runtime: lambda.Runtime.PYTHON_3_10,
            handler: 'lambda_function.lambda_handler',
            code: lambda.Code.fromInline('def handler(event, context): pass')
        });

        nodeLambda = new lambda.Function(stack, 'nodeLambda', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'lambda_function.handler',
            code: lambda.Code.fromInline('exports.handler = function(event, context) {}')
        });

        javaLambda = new lambda.Function(stack, 'javaLambda', {
            runtime: lambda.Runtime.JAVA_17,
            handler: 'lambda_function.handler',
            code: lambda.Code.fromAsset('../infrastructure/test/mock-lambda-func/java-lambda')
        });
    });

    it('should add a condition for govcloud for python runtime', () => {
        const pythonObserver = new LambdaRuntimeResourceObserver();
        pythonObserver.addConditionOnResource(pythonLambda, cfnCondition);

        Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
            Runtime: {
                'Fn::If': [
                    'isGovCloudPartition',
                    GOV_CLOUD_REGION_LAMBDA_PYTHON_RUNTIME.name,
                    COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME.name
                ]
            }
        });
    });

    it('should add a condition for govcloud for java runtime', () => {
        const javaObserver = new LambdaRuntimeResourceObserver();
        javaObserver.addConditionOnResource(javaLambda, cfnCondition);

        Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
            Runtime: {
                'Fn::If': [
                    'isGovCloudPartition',
                    GOV_CLOUD_REGION_LAMBDA_JAVA_RUNTIME.name,
                    COMMERCIAL_REGION_LAMBDA_JAVA_RUNTIME.name
                ]
            }
        });
    });
});

describe('When S3 web observer is added to a resource', () => {
    let stack: cdk.Stack;
    let s3WebStack: UIAssets;
    let cfnCondition: cdk.CfnCondition;

    beforeEach(() => {
        stack = new cdk.Stack();

        cfnCondition = createGovCloudCondition(stack);

        s3WebStack = new UIAssets(stack, 'S3UI', {
            parameters: {
                WebConfigKey: 'fakekey',
                CustomResourceLambdaArn: 'arn:aws:lambda:us-east-1:fakeaccountid:function:fakefunctionname',
                CustomResourceRoleArn: 'arn:aws:iam::fakeaccountid:role/fakerolename',
                AccessLoggingBucketArn: 'arn:aws:s3:::fakebucket'
            }
        });
    });

    it('should add a condition to deploy the S3 web UI assets', () => {
        const s3WebObserver = new S3WebResourceObserver();
        s3WebObserver.addConditionOnResource(s3WebStack.node.defaultChild as cdk.CfnStack, cfnCondition);

        const template = Template.fromStack(stack);
        template.hasResource('AWS::CloudFormation::Stack', {
            Condition: 'isGovCloudPartition'
        });
    });
});

describe('When Api endpoint observer is added to a resource', () => {
    let stack: cdk.Stack;
    let restApi: api.RestApi;
    let cfnCondition: cdk.CfnCondition;

    beforeEach(() => {
        stack = new cdk.Stack();
        cfnCondition = createGovCloudCondition(stack);

        restApi = new api.RestApi(stack, 'restApi', {
            endpointTypes: [api.EndpointType.EDGE]
        });

        const stateMachine = new stepfunctions.StateMachine(stack, 'TestStateMachine', {
            stateMachineType: stepfunctions.StateMachineType.EXPRESS,
            definition: stepfunctions.Chain.start(new stepfunctions.Pass(stack, 'Pass'))
        });

        const apiRoot = restApi.root.addMethod('GET', api.StepFunctionsIntegration.startExecution(stateMachine));
    });

    it('should add a condition to create endpoint type configuration if endpoint type is edge', () => {
        const apiObserver = new ApiGatewayEndpointTypeResourceObserver();
        apiObserver.addConditionOnResource(restApi.node.defaultChild as api.CfnRestApi, cfnCondition);

        const template = Template.fromStack(stack);
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
});

describe('When Cognito user pool observer is added to a resource', () => {
    let stack: cdk.Stack;
    let extUsrPool: cognito.UserPool;
    let cfnCondition: cdk.CfnCondition;

    beforeEach(() => {
        stack = new cdk.Stack();
        cfnCondition = createGovCloudCondition(stack);

        extUsrPool = new cognito.UserPool(stack, 'ExtUsrPool', {
            userPoolName: `${cdk.Aws.STACK_NAME}-ExtUsrPool`,
            selfSignUpEnabled: true,
            userVerification: {
                emailSubject: 'Verify your email to continue using Enhanced Document Understanding on AWS',
                emailBody:
                    'Thank you for creating your profile on Enhanced Document Understanding on AWS. Your verification code is {####}',
                emailStyle: cognito.VerificationEmailStyle.CODE,
                smsMessage:
                    'Thank you for creating your profile on Enhanced Document Understanding on AWS! Your verification code is {####}'
            },
            signInAliases: {
                username: true,
                email: true
            },
            mfa: cognito.Mfa.OPTIONAL,
            passwordPolicy: {
                minLength: 12,
                requireLowercase: true,
                requireUppercase: true,
                requireDigits: true,
                requireSymbols: true,
                tempPasswordValidity: cdk.Duration.days(3)
            },
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        (extUsrPool.node.tryFindChild('Resource') as cognito.CfnUserPool).userPoolAddOns = {
            advancedSecurityMode: 'ENFORCED'
        };

        const cognitoObserver = new CognitoUserPoolAdvancedSecurityModeObserver();
        cognitoObserver.addConditionOnResource(extUsrPool.node.defaultChild as cognito.CfnUserPool, cfnCondition);
    });

    it('should add a condition for advanced security mode', () => {
        Template.fromStack(stack).hasResourceProperties('AWS::Cognito::UserPool', {
            UserPoolAddOns: {
                'Fn::If': ['isGovCloudPartition', { Ref: 'AWS::NoValue' }, { AdvancedSecurityMode: 'ENFORCED' }]
            }
        });
    });
});

function createGovCloudCondition(construct: Construct): cdk.CfnCondition {
    return new cdk.CfnCondition(construct, 'isGovCloudPartition', {
        expression: cdk.Fn.conditionEquals(cdk.Aws.PARTITION, 'aws-us-gov')
    });
}
