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
import * as rawCdkJson from '../../cdk.json';

import { Capture, Match, Template } from 'aws-cdk-lib/assertions';

import { RestEndpoint } from '../../lib/api/rest-endpoint';
import { IndexedStorage } from '../../lib/search/indexed-storage';
import { COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME } from '../../lib/utils/constants';

describe('When storage construct is created', () => {
    let template: Template;
    let indexedStorage: IndexedStorage;

    beforeAll(() => {
        const stack = new cdk.Stack();

        const mockLambdaFuncProps = {
            code: lambda.Code.fromAsset('../infrastructure/test/mock-lambda-func/node-lambda'),
            runtime: COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME,
            handler: 'index.handler'
        };

        const testRestEndpoint = new RestEndpoint(stack, 'TestEndpointCreation', {
            postRequestLambda: new lambda.Function(stack, 'MockPostRequestFunction', mockLambdaFuncProps),
            getRequestLambda: new lambda.Function(stack, 'MockGetRequestFunction', mockLambdaFuncProps),
            getDocumentLambda: new lambda.Function(stack, 'MockDocDownloadFunction', mockLambdaFuncProps),
            getInferencesLambda: new lambda.Function(stack, 'MockGetInferencesFunction', mockLambdaFuncProps),
            postRedactLambda: new lambda.Function(stack, 'MockPostRedactFunction', mockLambdaFuncProps),
            defaultUserEmail: 'fake-user@example.com',
            applicationTrademarkName: rawCdkJson.context.application_trademark_name
        });

        const searchLambda = new lambda.Function(stack, 'MockSearchLambda', mockLambdaFuncProps);

        indexedStorage = new IndexedStorage(stack, 'TestIndexedStorage', {
            genUUID: 'FAKEABCD',
            roleArn: 'arn:aws:iam:12345679012::role/fakerole',
            searchLambda: searchLambda,
            apiRootResource: testRestEndpoint.apiRootResource,
            extUsrAuthorizer: testRestEndpoint.extUsrAuthorizer,
            documentBucketName: 'test-bucket-name',
            extUserPoolId: 'mock-user-pool-id'
        });

        template = Template.fromStack(stack);
        template.resourceCountIs('AWS::CloudFormation::Stack', 1);
    });

    it('should create Kendra nested template', () => {
        template.hasResource('AWS::CloudFormation::Stack', {
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
                                'Fn::Sub': 'cdk-hnb659fds-assets-${AWS::AccountId}-${AWS::Region}'
                            },
                            Match.stringLikeRegexp('^[\\S+]*.json$')
                        ]
                    ]
                },
                Parameters: {
                    QueryCapacityUnits: '0',
                    StorageCapacityUnits: '0',
                    RoleArn: 'arn:aws:iam:12345679012::role/fakerole',
                    DocumentBucketName: 'test-bucket-name'
                }
            },
            Condition: Match.stringLikeRegexp('^TestIndexedStorageDeployKendraIndex[\\S+]*$')
        });
    });

    it('has 2 parameters for deployment', () => {
        template.hasParameter('DeployKendraIndex', {
            Type: 'String',
            Default: 'No',
            AllowedPattern: '^(Yes|No)$',
            AllowedValues: ['Yes', 'No'],
            ConstraintDescription: 'Please select either Yes or No',
            Description:
                'Please select if you would like to deploy Amazon Kendra Index. For more details, refer to the implementation guide for this solution'
        });
    });

    it('has conditions for the CFN parameters', () => {
        template.hasCondition('*', {
            'Fn::Equals': [
                {
                    'Ref': 'DeployKendraIndex'
                },
                'Yes'
            ]
        });
    });

    // create a test for the  unit test for ApiGateway resource
    it('should create resource path for kendra index', () => {
        const lambdaCapture = new Capture();
        const restApiCapture = new Capture();
        const restApiDeplymentCapture = new Capture();

        template.resourceCountIs('AWS::ApiGateway::Deployment', 1);
        template.hasResourceProperties('AWS::ApiGateway::Deployment', {
            RestApiId: {
                Ref: restApiCapture
            }
        });

        template.hasResourceProperties('AWS::Lambda::Permission', {
            Action: 'lambda:InvokeFunction',
            FunctionName: {
                'Fn::GetAtt': [lambdaCapture, 'Arn']
            },
            Principal: 'apigateway.amazonaws.com',
            SourceArn: {
                'Fn::Join': [
                    '',
                    [
                        'arn:',
                        {
                            Ref: 'AWS::Partition'
                        },
                        ':execute-api:',
                        {
                            Ref: 'AWS::Region'
                        },
                        ':',
                        {
                            Ref: 'AWS::AccountId'
                        },
                        ':',
                        {
                            Ref: restApiCapture
                        },
                        '/',
                        {
                            'Ref': restApiDeplymentCapture
                        },
                        '/GET/search/kendra/*'
                    ]
                ]
            }
        });
    });

    it('should add conditional environment variable for lambda function', () => {
        const deployKendraIndexCondition = new Capture();
        const kendraIndexNestedStack = new Capture();

        template.hasResourceProperties('AWS::Lambda::Function', {
            Code: Match.anyValue(),
            Role: Match.anyValue(),
            Environment: {
                Variables: {
                    KENDRA_INDEX_ID: {
                        'Fn::If': [
                            deployKendraIndexCondition,
                            {
                                'Fn::GetAtt': [
                                    kendraIndexNestedStack,
                                    Match.stringLikeRegexp('Outputs.TestIndexedStorageKendraCaseSearchD6DED2C0Id*')
                                ]
                            },
                            {
                                Ref: 'AWS::NoValue'
                            }
                        ]
                    }
                }
            },
            Handler: 'index.handler',
            Runtime: 'nodejs18.x'
        });
    });
});
