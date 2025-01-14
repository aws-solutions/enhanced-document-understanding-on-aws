// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { Capture, Match, Template } from 'aws-cdk-lib/assertions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { JavaUserAgentLayer } from '../../lib/layers/java-user-agent';
import * as util from '../../lib/utils/common-utils';
import { COMMERCIAL_REGION_LAMBDA_JAVA_RUNTIME, GOV_CLOUD_REGION_LAMBDA_JAVA_RUNTIME } from '../../lib/utils/constants';

describe('When java user agent config layer is injected as an aspect', () => {
    let template: Template;

    beforeAll(() => {
        template = Template.fromStack(buildStack());
    });

    it('should package the lambda layer', () => {
        const layerCapture = new Capture();
        template.resourceCountIs('AWS::Lambda::LayerVersion', 1);
        template.hasResourceProperties('AWS::Lambda::LayerVersion', {
            CompatibleRuntimes: [GOV_CLOUD_REGION_LAMBDA_JAVA_RUNTIME.name, COMMERCIAL_REGION_LAMBDA_JAVA_RUNTIME.name],
            Content: Match.anyValue(),
            Description: 'This layer configures AWS Java SDK initialization to send user-agent information'
        });

        template.resourceCountIs('AWS::Lambda::Function', 1);
        template.hasResourceProperties('AWS::Lambda::Function', {
            Layers: [
                {
                    'Ref': layerCapture
                }
            ]
        });

        expect(template.toJSON()['Resources'][layerCapture.asString()]['Type']).toEqual('AWS::Lambda::LayerVersion');
    });
});

describe('When local build fails', () => {
    let template: Template;
    beforeAll(() => {
        jest.spyOn(util, 'copyFilesSyncRecursively').mockImplementation(() => {
            throw new Error('Fake error to fail local build');
        });

        template = Template.fromStack(buildStack());
    });

    it('should use docker image to build assets when local build fails', () => {
        template.resourceCountIs('AWS::Lambda::LayerVersion', 1);
        template.hasResourceProperties('AWS::Lambda::LayerVersion', {
            CompatibleRuntimes: [GOV_CLOUD_REGION_LAMBDA_JAVA_RUNTIME.name, COMMERCIAL_REGION_LAMBDA_JAVA_RUNTIME.name],
            Content: Match.anyValue(),
            Description: 'This layer configures AWS Java SDK initialization to send user-agent information'
        });
    });

    afterAll(() => {
        jest.clearAllMocks();
    });
});

describe('When a non-supported runtime is provided', () => {
    it('should throw an error if the runtime is Java', () => {
        try {
            const stack = new cdk.Stack();
            new lambda.Function(stack, 'TestFunction', {
                code: lambda.Code.fromAsset('../infrastructure/test/mock-lambda-func/java-lambda'),
                runtime: lambda.Runtime.DOTNET_6,
                handler: 'example.Handler',
                layers: [
                    new JavaUserAgentLayer(stack, 'AWSUserAgentConfigLayer', {
                        entry: '../lambda/layers/custom-java-sdk-config',
                        description: 'This layer configures AWS Java SDK initialization to send user-agent information'
                    })
                ]
            });
        } catch (error) {
            expect((error as Error).message).toEqual(
                `This lambda function uses a runtime that is incompatible with this layer (dotnet6 is not in [${COMMERCIAL_REGION_LAMBDA_JAVA_RUNTIME.name}])`
            );
        }
    });
});

function buildStack(): cdk.Stack {
    const stack = new cdk.Stack();
    new lambda.Function(stack, 'TestFunction', {
        code: lambda.Code.fromAsset('../infrastructure/test/mock-lambda-func/java-lambda'),
        runtime: COMMERCIAL_REGION_LAMBDA_JAVA_RUNTIME,
        handler: 'function.handler',
        layers: [
            new JavaUserAgentLayer(stack, 'AWSUserAgentConfigLayer', {
                entry: '../lambda/layers/custom-java-sdk-config',
                description: 'This layer configures AWS Java SDK initialization to send user-agent information',
                compatibleRuntimes: [GOV_CLOUD_REGION_LAMBDA_JAVA_RUNTIME, COMMERCIAL_REGION_LAMBDA_JAVA_RUNTIME]
            })
        ]
    });

    return stack;
}
