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
import {
    createCaseBodySchema,
    downloadDocResponseSchema,
    getCaseResponseSchema,
    getDocInfoResponseSchema,
    redactRequestBodySchema,
    uploadDocumentBodySchema
} from '../../lib/api/model-schema';

import { RestEndpoint } from '../../lib/api/rest-endpoint';
import { COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME } from '../../lib/utils/constants';

describe('When creating rest endpoints', () => {
    let template: Template;
    let jsonTemplate: any;

    beforeAll(() => {
        const stack = new cdk.Stack();
        const mockLambdaFuncProps = {
            code: lambda.Code.fromAsset('../infrastructure/test/mock-lambda-func/node-lambda'),
            runtime: COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME,
            handler: 'index.handler'
        };
        new RestEndpoint(stack, 'TestEndpointCreation', {
            postRequestLambda: new lambda.Function(stack, 'MockPostRequestFunction', mockLambdaFuncProps),
            getRequestLambda: new lambda.Function(stack, 'MockGetRequestFunction', mockLambdaFuncProps),
            getDocumentLambda: new lambda.Function(stack, 'MockDocDownloadFunction', mockLambdaFuncProps),
            getInferencesLambda: new lambda.Function(stack, 'MockGetInferencesFunction', mockLambdaFuncProps),
            postRedactLambda: new lambda.Function(stack, 'MockPostRedactFunction', mockLambdaFuncProps),
            defaultUserEmail: 'fake-user@example.com',
            applicationTrademarkName: rawCdkJson.context.application_trademark_name
        });

        template = Template.fromStack(stack);
        jsonTemplate = template.toJSON();
    });

    it('should have REST APIGateway setup', () => {
        const restApiCapture = new Capture();

        template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
        template.hasResourceProperties('AWS::ApiGateway::RestApi', {
            'Description': 'API endpoint to access the Document Understanding Services',
            'EndpointConfiguration': {
                'Types': ['EDGE']
            },
            'Name': {
                'Fn::Join': [
                    '',
                    [
                        {
                            'Ref': 'AWS::StackName'
                        },
                        '-RestAPI'
                    ]
                ]
            }
        });

        template.resourceCountIs('AWS::ApiGateway::Deployment', 1);
        template.hasResourceProperties('AWS::ApiGateway::Deployment', {
            RestApiId: {
                Ref: restApiCapture
            }
        });

        expect(jsonTemplate['Resources'][restApiCapture.asString()]['Type']).toEqual('AWS::ApiGateway::RestApi');

        const restApiDeploymentCapture = new Capture();

        template.resourceCountIs('AWS::ApiGateway::Stage', 1);
        template.hasResourceProperties('AWS::ApiGateway::Stage', {
            RestApiId: {
                Ref: restApiCapture.asString()
            },
            AccessLogSetting: {
                DestinationArn: {
                    'Fn::GetAtt': Match.anyValue()
                },
                Format: '{"requestId":"$context.requestId","sourceIp":"$context.identity.sourceIp","method":"$context.httpMethod","path":"$context.resourcePath","userContext":{"sub":"$context.authorizer.claims.sub","email":"$context.authorizer.claims.email"}}'
            },
            DeploymentId: {
                'Ref': restApiDeploymentCapture
            },
            MethodSettings: [
                {
                    DataTraceEnabled: false,
                    HttpMethod: '*',
                    LoggingLevel: 'INFO',
                    ResourcePath: '/*'
                }
            ],
            StageName: 'prod',
            TracingEnabled: true
        });

        expect(jsonTemplate['Resources'][restApiDeploymentCapture.asString()]['Type']).toEqual(
            'AWS::ApiGateway::Deployment'
        );
    });

    it('should have gateway responses 5xx', () => {
        template.hasResourceProperties('AWS::ApiGateway::GatewayResponse', {
            ResponseParameters: {
                'gatewayresponse.header.gatewayresponse.header.Access-Control-Allow-Origin': "'*'",
                'gatewayresponse.header.gatewayresponse.header.Access-Control-Allow-Headers': "'*'"
            },
            ResponseType: 'DEFAULT_5XX',
            RestApiId: {
                Ref: Match.stringLikeRegexp('TestEndpointCreationEndPointLambdaRestApi*')
            },
            StatusCode: '400'
        });
    });

    it('should provide create permissions to invoke lambda functions for specific resource invocations', () => {
        const restApiCapture = new Capture();
        const restApiDeplymentCapture = new Capture();
        const documentLambdaCapture = new Capture();
        const fetchRecordsLambdaCapture = new Capture();
        const downloadDocumentLambdaCapture = new Capture();
        const getInferenceLambdaCapture = new Capture();
        const redactLambdaCapture = new Capture();
        template.resourceCountIs('AWS::Lambda::Permission', 20);
        template.hasResourceProperties('AWS::Lambda::Permission', {
            Action: 'lambda:InvokeFunction',
            FunctionName: {
                'Fn::GetAtt': [documentLambdaCapture, 'Arn']
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
                        '/POST/document'
                    ]
                ]
            }
        });

        template.hasResourceProperties('AWS::Lambda::Permission', {
            'Action': 'lambda:InvokeFunction',
            'FunctionName': {
                'Fn::GetAtt': [fetchRecordsLambdaCapture, 'Arn']
            },
            'Principal': 'apigateway.amazonaws.com',
            'SourceArn': {
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
                            Ref: restApiCapture.asString()
                        },
                        '/',
                        {
                            Ref: restApiDeplymentCapture.asString()
                        },
                        '/GET/document/*/*'
                    ]
                ]
            }
        });

        template.hasResourceProperties('AWS::Lambda::Permission', {
            'Action': 'lambda:InvokeFunction',
            'FunctionName': {
                'Fn::GetAtt': [downloadDocumentLambdaCapture, 'Arn']
            },
            'Principal': 'apigateway.amazonaws.com',
            'SourceArn': {
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
                            Ref: restApiCapture.asString()
                        },
                        '/',
                        {
                            Ref: restApiDeplymentCapture.asString()
                        },
                        '/GET/document/download'
                    ]
                ]
            }
        });

        template.hasResourceProperties('AWS::Lambda::Permission', {
            Action: 'lambda:InvokeFunction',
            FunctionName: {
                'Fn::GetAtt': [documentLambdaCapture.asString(), 'Arn']
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
                            Ref: restApiCapture.asString()
                        },
                        '/',
                        {
                            Ref: restApiDeplymentCapture.asString()
                        },
                        '/POST/case'
                    ]
                ]
            }
        });

        template.hasResourceProperties('AWS::Lambda::Permission', {
            'Action': 'lambda:InvokeFunction',
            'FunctionName': {
                'Fn::GetAtt': [fetchRecordsLambdaCapture.asString(), 'Arn']
            },
            'Principal': 'apigateway.amazonaws.com',
            'SourceArn': {
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
                            Ref: restApiCapture.asString()
                        },
                        '/',
                        {
                            Ref: restApiDeplymentCapture.asString()
                        },
                        '/GET/case/*'
                    ]
                ]
            }
        });

        template.hasResourceProperties('AWS::Lambda::Permission', {
            Action: 'lambda:InvokeFunction',
            FunctionName: {
                'Fn::GetAtt': [getInferenceLambdaCapture, 'Arn']
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
                        '/GET/inferences/*/*/*'
                    ]
                ]
            }
        });

        template.hasResourceProperties('AWS::Lambda::Permission', {
            Action: 'lambda:InvokeFunction',
            FunctionName: {
                'Fn::GetAtt': [redactLambdaCapture, 'Arn']
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
                        '/POST/redact/*/*'
                    ]
                ]
            }
        });

        expect(jsonTemplate['Resources'][restApiDeplymentCapture.asString()]['Type']).toEqual('AWS::ApiGateway::Stage');
        expect(jsonTemplate['Resources'][restApiCapture.asString()]['Type']).toEqual('AWS::ApiGateway::RestApi');
    });

    it('should have a request validator and Web Acl', () => {
        const restApiCapture = new Capture();
        template.hasResourceProperties('AWS::ApiGateway::RequestValidator', {
            RestApiId: {
                'Ref': restApiCapture
            },
            'Name': {
                'Fn::Join': [
                    '',
                    [
                        {
                            'Ref': 'AWS::StackName'
                        },
                        '-api-request-validator'
                    ]
                ]
            },
            'ValidateRequestBody': true,
            'ValidateRequestParameters': true
        });
        expect(jsonTemplate['Resources'][restApiCapture.asString()]['Type']).toEqual('AWS::ApiGateway::RestApi');

        const webAclCapture = new Capture();
        template.resourceCountIs('AWS::WAFv2::WebACL', 1);
        template.resourceCountIs('AWS::WAFv2::WebACLAssociation', 1);
        template.hasResourceProperties('AWS::WAFv2::WebACLAssociation', {
            ResourceArn: {
                'Fn::Join': [
                    '',
                    [
                        'arn:',
                        {
                            Ref: 'AWS::Partition'
                        },
                        ':apigateway:',
                        {
                            Ref: 'AWS::Region'
                        },
                        '::/restapis/',
                        {
                            Ref: restApiCapture.asString()
                        },
                        '/stages/',
                        {
                            'Ref': Match.anyValue()
                        }
                    ]
                ]
            },
            'WebACLArn': {
                'Fn::GetAtt': [webAclCapture, 'Arn']
            }
        });

        expect(jsonTemplate['Resources'][webAclCapture.asString()]['Type']).toEqual('AWS::WAFv2::WebACL');
    });

    it('should create path based resources', () => {
        const restApiCapture = new Capture();

        template.resourceCountIs('AWS::ApiGateway::Resource', 15);

        // the root level resources have matching parents and restApi
        template.hasResourceProperties('AWS::ApiGateway::Resource', {
            ParentId: {
                'Fn::GetAtt': [restApiCapture, 'RootResourceId']
            },
            PathPart: 'case',
            RestApiId: {
                'Ref': restApiCapture
            }
        });

        template.hasResourceProperties('AWS::ApiGateway::Resource', {
            ParentId: {
                'Fn::GetAtt': [restApiCapture.asString(), 'RootResourceId']
            },
            PathPart: 'cases',
            RestApiId: {
                'Ref': restApiCapture.asString()
            }
        });

        template.hasResourceProperties('AWS::ApiGateway::Resource', {
            ParentId: {
                'Fn::GetAtt': [restApiCapture.asString(), 'RootResourceId']
            },
            PathPart: 'document',
            RestApiId: {
                'Ref': restApiCapture.asString()
            }
        });

        template.hasResourceProperties('AWS::ApiGateway::Resource', {
            ParentId: {
                'Fn::GetAtt': [restApiCapture.asString(), 'RootResourceId']
            },
            PathPart: 'inferences',
            RestApiId: {
                'Ref': restApiCapture.asString()
            }
        });

        template.hasResourceProperties('AWS::ApiGateway::Resource', {
            ParentId: {
                'Fn::GetAtt': [restApiCapture.asString(), 'RootResourceId']
            },
            PathPart: 'redact',
            RestApiId: {
                'Ref': restApiCapture.asString()
            }
        });

        expect(jsonTemplate['Resources'][restApiCapture.asString()]['Type']).toEqual('AWS::ApiGateway::RestApi');

        // document resources
        template.hasResourceProperties('AWS::ApiGateway::Resource', {
            ParentId: {
                Ref: Match.stringLikeRegexp('TestEndpointCreationEndPointLambdaRestApidocument*')
            },
            PathPart: 'download',
            RestApiId: {
                'Ref': restApiCapture.asString()
            }
        });
        template.hasResourceProperties('AWS::ApiGateway::Resource', {
            ParentId: {
                Ref: Match.stringLikeRegexp('TestEndpointCreationEndPointLambdaRestApidocument*')
            },
            PathPart: '{caseId}',
            RestApiId: {
                Ref: restApiCapture.asString()
            }
        });
        template.hasResourceProperties('AWS::ApiGateway::Resource', {
            ParentId: {
                Ref: Match.stringLikeRegexp('TestEndpointCreationEndPointLambdaRestApidocumentcaseId*')
            },
            PathPart: '{documentId}',
            RestApiId: {
                Ref: restApiCapture.asString()
            }
        });

        // case resources
        template.hasResourceProperties('AWS::ApiGateway::Resource', {
            ParentId: {
                Ref: Match.stringLikeRegexp('TestEndpointCreationEndPointLambdaRestApicase*')
            },
            PathPart: '{caseId}',
            RestApiId: {
                Ref: restApiCapture.asString()
            }
        });

        // inference resources
        template.hasResourceProperties('AWS::ApiGateway::Resource', {
            ParentId: {
                Ref: Match.stringLikeRegexp('TestEndpointCreationEndPointLambdaRestApiinferences*')
            },
            PathPart: '{caseId}',
            RestApiId: {
                Ref: restApiCapture.asString()
            }
        });
        template.hasResourceProperties('AWS::ApiGateway::Resource', {
            ParentId: {
                Ref: Match.stringLikeRegexp('TestEndpointCreationEndPointLambdaRestApiinferencescaseId*')
            },
            PathPart: '{documentId}',
            RestApiId: {
                'Ref': restApiCapture.asString()
            }
        });
        template.hasResourceProperties('AWS::ApiGateway::Resource', {
            ParentId: {
                Ref: Match.stringLikeRegexp('TestEndpointCreationEndPointLambdaRestApiinferencescaseIddocumentId*')
            },
            PathPart: '{inferenceType}',
            RestApiId: {
                'Ref': restApiCapture.asString()
            }
        });

        // redact resources
        template.hasResourceProperties('AWS::ApiGateway::Resource', {
            ParentId: {
                Ref: Match.stringLikeRegexp('TestEndpointCreationEndPointLambdaRestApiredact*')
            },
            PathPart: '{caseId}',
            RestApiId: {
                Ref: restApiCapture.asString()
            }
        });
        template.hasResourceProperties('AWS::ApiGateway::Resource', {
            ParentId: {
                Ref: Match.stringLikeRegexp('TestEndpointCreationEndPointLambdaRestApiredactcaseId*')
            },
            PathPart: '{documentId}',
            RestApiId: {
                'Ref': restApiCapture.asString()
            }
        });
    });

    it('should set the security policies for the external user pool', () => {
        const snsPublishRoleCapture = new Capture();
        const emailMessageBodyCapture = new Capture();

        template.resourceCountIs('AWS::Cognito::UserPool', 1);

        template.hasResourceProperties('AWS::Cognito::UserPool', {
            AccountRecoverySetting: {
                RecoveryMechanisms: [
                    {
                        Name: 'verified_phone_number',
                        Priority: 1
                    },
                    {
                        Name: 'verified_email',
                        Priority: 2
                    }
                ]
            },
            AdminCreateUserConfig: {
                AllowAdminCreateUserOnly: false,
                InviteMessageTemplate: {
                    EmailMessage: emailMessageBodyCapture,
                    EmailSubject: 'Invitation to join Enhanced Document Understanding on AWS app!'
                }
            },
            AliasAttributes: ['email'],
            AutoVerifiedAttributes: ['email'],
            EmailVerificationMessage: `Thank you for creating your profile on ${rawCdkJson.context.application_trademark_name}. Your verification code is {####}`,
            EmailVerificationSubject: `Verify your email to continue using ${rawCdkJson.context.application_trademark_name}`,
            EnabledMfas: ['SMS_MFA'],
            MfaConfiguration: 'OPTIONAL',
            Policies: {
                PasswordPolicy: {
                    MinimumLength: 12,
                    RequireLowercase: true,
                    RequireNumbers: true,
                    RequireSymbols: true,
                    RequireUppercase: true,
                    TemporaryPasswordValidityDays: 3
                }
            },
            SmsConfiguration: {
                ExternalId: Match.anyValue(),
                SnsCallerArn: {
                    'Fn::GetAtt': [snsPublishRoleCapture, 'Arn']
                }
            },
            SmsVerificationMessage: `Thank you for creating your profile on ${rawCdkJson.context.application_trademark_name}! Your verification code is {####}`,
            UserPoolAddOns: {
                'AdvancedSecurityMode': 'ENFORCED'
            },
            UserPoolName: {
                'Fn::Join': [
                    '',
                    [
                        {
                            Ref: 'AWS::StackName'
                        },
                        '-ExtUsrPool'
                    ]
                ]
            },
            VerificationMessageTemplate: {
                DefaultEmailOption: 'CONFIRM_WITH_CODE',
                EmailMessage: `Thank you for creating your profile on ${rawCdkJson.context.application_trademark_name}. Your verification code is {####}`,
                'EmailSubject': `Verify your email to continue using ${rawCdkJson.context.application_trademark_name}`,
                'SmsMessage': `Thank you for creating your profile on ${rawCdkJson.context.application_trademark_name}! Your verification code is {####}`
            }
        });
        expect(emailMessageBodyCapture.asString()).toContain('{username}');
        expect(emailMessageBodyCapture.asString()).toContain('{####}');
        expect(emailMessageBodyCapture.asString()).toContain(`${rawCdkJson.context.application_trademark_name}`);
        expect(jsonTemplate['Resources'][snsPublishRoleCapture.asString()]['Type']).toEqual('AWS::IAM::Role');

        const restApiCapture = new Capture();
        const extUsrPoolCapture = new Capture();
        template.hasResourceProperties('AWS::ApiGateway::Authorizer', {
            Name: Match.anyValue(),
            RestApiId: {
                'Ref': restApiCapture
            },
            Type: 'COGNITO_USER_POOLS',
            IdentitySource: 'method.request.header.Authorization',
            ProviderARNs: [
                {
                    'Fn::GetAtt': [extUsrPoolCapture, 'Arn']
                }
            ]
        });
        expect(jsonTemplate['Resources'][restApiCapture.asString()]['Type']).toEqual('AWS::ApiGateway::RestApi');
        template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
        expect(jsonTemplate['Resources'][extUsrPoolCapture.asString()]['Type']).toEqual('AWS::Cognito::UserPool');

        template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
            UserPoolId: {
                'Ref': extUsrPoolCapture.asString()
            }
        });
    });

    it('stack should publish a REST endpoint output', () => {
        const restApiCapture = new Capture();
        const restApiDeploymentCapture = new Capture();

        template.hasResourceProperties('AWS::WAFv2::WebACLAssociation', {
            ResourceArn: {
                'Fn::Join': [
                    '',
                    [
                        'arn:',
                        {
                            Ref: 'AWS::Partition'
                        },
                        ':apigateway:',
                        {
                            Ref: 'AWS::Region'
                        },
                        '::/restapis/',
                        {
                            Ref: restApiCapture
                        },
                        '/stages/',
                        {
                            'Ref': restApiDeploymentCapture
                        }
                    ]
                ]
            },
            'WebACLArn': {
                'Fn::GetAtt': [Match.anyValue(), 'Arn']
            }
        });

        template.hasOutput('TestEndpointCreationEndPointLambdaRestApiEndpointE2A92C44', {
            Value: {
                'Fn::Join': [
                    '',
                    [
                        'https://',
                        {
                            Ref: restApiCapture.asString()
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
                            Ref: restApiDeploymentCapture.asString()
                        },
                        '/'
                    ]
                ]
            }
        });
    });

    it('should create Models to validate request and response data', () => {
        template.resourceCountIs('AWS::ApiGateway::Model', 8);
        template.hasResourceProperties('AWS::ApiGateway::Model', {
            ContentType: 'application/json',
            Name: 'UploadDocumentApiBodyModel',
            Schema: uploadDocumentBodySchema
        });

        template.hasResourceProperties('AWS::ApiGateway::Model', {
            ContentType: 'application/json',
            Name: 'RedactionApiRequestBodyModel',
            Schema: redactRequestBodySchema
        });

        template.hasResourceProperties('AWS::ApiGateway::Model', {
            ContentType: 'application/json',
            Name: 'CreateCaseApiBodyModel',
            Schema: createCaseBodySchema
        });

        template.hasResourceProperties('AWS::ApiGateway::Model', {
            ContentType: 'application/json',
            Name: 'GetCaseResponseModel',
            Schema: getCaseResponseSchema
        });

        template.hasResourceProperties('AWS::ApiGateway::Model', {
            ContentType: 'application/json',
            Name: 'DownloadDocumentResponseModel',
            Schema: downloadDocResponseSchema
        });

        template.hasResourceProperties('AWS::ApiGateway::Model', {
            ContentType: 'application/json',
            Name: 'GetDocumentResponseModel',
            Schema: getDocInfoResponseSchema
        });
    });
});

describe('When creating a default cognito user in the user pool', () => {
    it('should create a default user in the user pool with provided email', () => {
        const extUsrPoolCapture = new Capture();
        const defaultUserEmailCapture = new Capture();

        const [template, jsonTemplate] = createTemplateWithRestEndPoint('fake-user@example.com');

        template.hasResourceProperties('AWS::Cognito::UserPoolUser', {
            UserPoolId: {
                'Ref': extUsrPoolCapture
            },
            DesiredDeliveryMediums: ['EMAIL'],
            ForceAliasCreation: false,
            UserAttributes: [
                {
                    Name: 'email',
                    Value: defaultUserEmailCapture
                }
            ],
            Username: 'fake-user'
        });

        expect(defaultUserEmailCapture.asString()).toEqual('fake-user@example.com');

        template.hasCondition('TestEndpointCreationCognitoUserConditionECC052EF', {
            'Fn::Not': [
                {
                    'Fn::Or': [
                        {
                            'Fn::Equals': [defaultUserEmailCapture.asString(), 'placeholder@example.com']
                        },
                        {
                            'Fn::Equals': [defaultUserEmailCapture.asString(), '']
                        }
                    ]
                }
            ]
        });

        expect(jsonTemplate['Resources'][extUsrPoolCapture.asString()]['Type']).toEqual('AWS::Cognito::UserPool');
        template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
            UserPoolId: {
                'Ref': extUsrPoolCapture.asString()
            }
        });
    });

    it('should not create a default user in the user pool if no email is provided', () => {
        const [template, _] = createTemplateWithRestEndPoint('');

        template.resourcePropertiesCountIs('AWS::Cognito::UserPoolUser', {}, 1);

        // test that the condition resolves to false, showing user will not be created
        template.hasCondition('TestEndpointCreationCognitoUserConditionECC052EF', {
            'Fn::Not': [
                {
                    'Fn::Or': [
                        {
                            'Fn::Equals': ['', 'placeholder@example.com']
                        },
                        {
                            'Fn::Equals': ['', '']
                        }
                    ]
                }
            ]
        });
    });

    function createTemplateWithRestEndPoint(testableEmail: string): [cdk.assertions.Template, any] {
        let stack: cdk.Stack;
        let mockLambdaFuncProps: lambda.FunctionProps;

        stack = new cdk.Stack();
        mockLambdaFuncProps = {
            code: lambda.Code.fromAsset('../infrastructure/test/mock-lambda-func/node-lambda'),
            runtime: COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME,
            handler: 'index.handler'
        };

        new RestEndpoint(stack, 'TestEndpointCreation', {
            postRequestLambda: new lambda.Function(stack, 'MockPostRequestFunction', mockLambdaFuncProps),
            getRequestLambda: new lambda.Function(stack, 'MockGetRequestFunction', mockLambdaFuncProps),
            getDocumentLambda: new lambda.Function(stack, 'MockDocDownloadFunction', mockLambdaFuncProps),
            getInferencesLambda: new lambda.Function(stack, 'MockGetInferencesFunction', mockLambdaFuncProps),
            postRedactLambda: new lambda.Function(stack, 'MockPostRedactFunction', mockLambdaFuncProps),
            defaultUserEmail: testableEmail,
            applicationTrademarkName: rawCdkJson.context.application_trademark_name
        });

        const template = Template.fromStack(stack);

        return [template, template.toJSON()];
    }
});
