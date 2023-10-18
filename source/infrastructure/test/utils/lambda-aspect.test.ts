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
import { Capture, Match, Template } from 'aws-cdk-lib/assertions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as rawCdkJson from '../../cdk.json';
import {
    COMMERCIAL_REGION_LAMBDA_JAVA_RUNTIME,
    COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME,
    COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME,
    CloudwatchNamespace
} from '../../lib/utils/constants';
import { LambdaAspects } from '../../lib/utils/lambda-aspect';

describe('When applying aspect to a Node based lambda function', () => {
    let template: Template;

    beforeAll(() => {
        const app = new cdk.App({
            context: rawCdkJson.context
        });
        const stack = new cdk.Stack(app);

        new lambda.Function(stack, 'TestFunction', {
            code: lambda.Code.fromAsset('../infrastructure/test/mock-lambda-func/node-lambda'),
            runtime: COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME,
            handler: 'index.handler'
        });

        cdk.Aspects.of(stack).add(
            new LambdaAspects(stack, 'NodeLambdaConfig', {
                solutionID: rawCdkJson.context.solution_id,
                solutionVersion: rawCdkJson.context.solution_version
            })
        );
        template = Template.fromStack(stack);
    });

    it('should inject the layer for the lambda function', () => {
        const layerCapture = new Capture();
        template.resourceCountIs('AWS::Lambda::LayerVersion', 3);
        template.hasResourceProperties('AWS::Lambda::LayerVersion', {
            CompatibleRuntimes: ['nodejs16.x', 'nodejs18.x'],
            Content: Match.anyValue(),
            Description: 'This layer configures AWS Node SDK initialization to send user-agent information'
        });

        template.hasResourceProperties('AWS::Lambda::Function', {
            Layers: layerCapture
        });

        const jsonTemplate = template.toJSON();

        expect(jsonTemplate['Resources'][layerCapture.asArray()[0]['Ref']]['Type']).toEqual(
            'AWS::Lambda::LayerVersion'
        );
        expect(jsonTemplate['Resources'][layerCapture.asArray()[0]['Ref']]['Properties']['Description']).toEqual(
            'This layer configures AWS Node SDK initialization to send user-agent information'
        );
        expect(jsonTemplate['Resources'][layerCapture.asArray()[1]['Ref']]['Type']).toEqual(
            'AWS::Lambda::LayerVersion'
        );
        expect(jsonTemplate['Resources'][layerCapture.asArray()[1]['Ref']]['Properties']['Description']).toEqual(
            'This layer contains shared libraries and functions across all lambda functions to be bundled with the lambda function'
        );
        expect(jsonTemplate['Resources'][layerCapture.asArray()[2]['Ref']]['Type']).toEqual(
            'AWS::Lambda::LayerVersion'
        );
        expect(jsonTemplate['Resources'][layerCapture.asArray()[2]['Ref']]['Properties']['Description']).toEqual(
            'AWS Node SDK to be bundled with lambda functions'
        );
    });

    it('should add Nodejs keep-alive to re-use connections', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
            Environment: {
                Variables: {
                    AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
                    AWS_SDK_USER_AGENT: `{ "customUserAgent": "AwsSolution/SO0281/${rawCdkJson.context.solution_version}" }`
                }
            }
        });
    });

    it('should have a policy that allows pushing custom metrics', () => {
        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyDocument: {
                Statement: Match.arrayWith([
                    {
                        Action: 'cloudwatch:PutMetricData',
                        Effect: 'Allow',
                        Resource: '*',
                        Condition: {
                            StringEquals: {
                                'cloudwatch:namespace': [
                                    CloudwatchNamespace.CASE,
                                    CloudwatchNamespace.DOCUMENTS,
                                    CloudwatchNamespace.FILE_TYPES,
                                    CloudwatchNamespace.WORKFLOW_TYPES
                                ]
                            }
                        }
                    }
                ])
            }
        });
    });
});

describe('When applying aspect to a Python based lambda function', () => {
    let template: Template;

    beforeAll(() => {
        const stack = new cdk.Stack();

        new lambda.Function(stack, 'TestFunction', {
            code: lambda.Code.fromAsset('../infrastructure/test/mock-lambda-func/python-lambda'),
            runtime: COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME,
            handler: 'function.handler'
        });

        cdk.Aspects.of(stack).add(
            new LambdaAspects(stack, 'PythonLambdaConfig', {
                solutionID: rawCdkJson.context.solution_id,
                solutionVersion: rawCdkJson.context.solution_version
            })
        );
        template = Template.fromStack(stack);
    });

    it('should inject the layer for the lambda function', () => {
        const layerCapture = new Capture();
        template.resourceCountIs('AWS::Lambda::LayerVersion', 2);
        template.hasResourceProperties('AWS::Lambda::LayerVersion', {
            CompatibleRuntimes: ['python3.8', 'python3.9', 'python3.10', 'python3.11'],
            Content: Match.anyValue(),
            Description: 'This layer configures AWS Python SDK initialization to send user-agent information'
        });

        template.hasResourceProperties('AWS::Lambda::Function', {
            Layers: [
                {
                    'Ref': layerCapture
                },
                {
                    'Ref': layerCapture
                }
            ]
        });

        const jsonTemplate = template.toJSON();
        expect(jsonTemplate['Resources'][layerCapture.asString()]['Type']).toEqual('AWS::Lambda::LayerVersion');
        expect(layerCapture.next()).toBeTruthy;
        expect(jsonTemplate['Resources'][layerCapture.asString()]['Type']).toEqual('AWS::Lambda::LayerVersion');
    });

    it('should have a policy that allows pushing custom metrics', () => {
        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyDocument: {
                Statement: Match.arrayWith([
                    {
                        Action: 'cloudwatch:PutMetricData',
                        Effect: 'Allow',
                        Resource: '*',
                        Condition: {
                            StringEquals: {
                                'cloudwatch:namespace': [
                                    CloudwatchNamespace.CASE,
                                    CloudwatchNamespace.DOCUMENTS,
                                    CloudwatchNamespace.FILE_TYPES,
                                    CloudwatchNamespace.WORKFLOW_TYPES
                                ]
                            }
                        }
                    }
                ])
            }
        });
    });
});

describe('When applying aspect to a Java based lambda function', () => {
    let template: Template;

    beforeAll(() => {
        const stack = new cdk.Stack();

        new lambda.Function(stack, 'TestFunction', {
            code: lambda.Code.fromAsset('../infrastructure/test/mock-lambda-func/java-lambda'),
            runtime: COMMERCIAL_REGION_LAMBDA_JAVA_RUNTIME,
            handler: 'function.handler'
        });

        cdk.Aspects.of(stack).add(
            new LambdaAspects(stack, 'JavaLambdaConfig', {
                solutionID: rawCdkJson.context.solution_id,
                solutionVersion: rawCdkJson.context.solution_version
            })
        );
        template = Template.fromStack(stack);
    });

    it('should inject the layer for the lambda function', () => {
        const layerCapture = new Capture();
        template.resourceCountIs('AWS::Lambda::LayerVersion', 1);
        template.hasResourceProperties('AWS::Lambda::LayerVersion', {
            CompatibleRuntimes: [lambda.Runtime.JAVA_11.toString(), lambda.Runtime.JAVA_17.toString()],
            Content: Match.anyValue(),
            Description: 'This layer configures AWS Java SDK initialization to send user-agent information'
        });

        template.hasResourceProperties('AWS::Lambda::Function', {
            Layers: [
                {
                    'Ref': layerCapture
                }
            ]
        });

        const jsonTemplate = template.toJSON();
        expect(jsonTemplate['Resources'][layerCapture.asString()]['Type']).toEqual('AWS::Lambda::LayerVersion');
    });

    it('should have a policy that allows pushing custom metrics', () => {
        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyDocument: {
                Statement: Match.arrayWith([
                    {
                        Action: 'cloudwatch:PutMetricData',
                        Effect: 'Allow',
                        Resource: '*',
                        Condition: {
                            StringEquals: {
                                'cloudwatch:namespace': [
                                    CloudwatchNamespace.CASE,
                                    CloudwatchNamespace.DOCUMENTS,
                                    CloudwatchNamespace.FILE_TYPES,
                                    CloudwatchNamespace.WORKFLOW_TYPES
                                ]
                            }
                        }
                    }
                ])
            }
        });
    });
});

describe('When applying aspect to another (non-Node) runtime lambda functions', () => {
    it('should not inject layer for a python lambda function and throw an error', () => {
        const fnRuntime = lambda.Runtime.DOTNET_6;
        try {
            const stack = new cdk.Stack();
            new lambda.Function(stack, 'TestFunction', {
                code: lambda.Code.fromAsset('../infrastructure/test/mock-lambda-func/node-lambda'),
                runtime: fnRuntime,
                handler: 'function.handler'
            });

            cdk.Aspects.of(stack).add(
                new LambdaAspects(stack, 'NodeLambdaConfig', {
                    solutionID: rawCdkJson.context.solution_id,
                    solutionVersion: rawCdkJson.context.solution_version
                })
            );
            Template.fromStack(stack);
        } catch (error) {
            expect((error as Error).message).toEqual(`Layer for ${fnRuntime} currently not supported`);
        }
    });
});
