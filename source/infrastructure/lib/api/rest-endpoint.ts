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

import * as api from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';

import { LambdaRestApiProps, Model } from 'aws-cdk-lib/aws-apigateway';
import {
    createCaseBodySchema,
    createCaseResponseSchema,
    downloadDocResponseSchema,
    getCaseResponseSchema,
    getDocInfoResponseSchema,
    redactRequestBodySchema,
    uploadDocumentBodySchema
} from './model-schema';

import { ApiGatewayToLambda } from '@aws-solutions-constructs/aws-apigateway-lambda';
import { Construct } from 'constructs';
import { NagSuppressions } from 'cdk-nag';
import { WafwebaclToApiGateway } from '@aws-solutions-constructs/aws-wafwebacl-apigateway';
import { addCfnSuppressRules } from '../utils/cfn-nag-suppressions';
import { ApiDocumentation } from './rest-api-documentation/api-documentation';
import { CfnUserPoolUser } from 'aws-cdk-lib/aws-cognito';
import { PLACEHOLDER_EMAIL } from '../utils/constants';

export interface RestEndpointProps {
    /**
     * Lambda to serve `POST: /document` and `POST: /case`
     */
    postRequestLambda: lambda.Function;
    /**
     * Lambda to serve `GET: /case/{caseid}`, `GET: /cases` and `GET: /document/{caseid}/{docid}`
     */
    getRequestLambda: lambda.Function;
    /**
     * Lambda to serve redirect requests from `GET: /document/{caseid}/{docid}` to
     * generate presigned URLs securely
     */
    getDocumentLambda: lambda.Function;
    /**
     * Lambda to serve `GET: /inferences/{caseid}/{docid}` and `GET: /inferences/{caseid}/{docid}/{inferenceType}`
     */
    getInferencesLambda: lambda.Function;
    /**
     * Lambda to serve `POST: /redact/{caseid}/{docid}`
     */
    postRedactLambda: lambda.Function;

    /**
     * Default user email address used to create a cognito user in the user pool.
     */
    defaultUserEmail: string;

    /**
     * The trademark name of the solution
     */
    applicationTrademarkName: string;
}

export class RestEndpoint extends Construct {
    /**
     * Lambda REST endpoint created by the construct
     */
    readonly apiGateway: api.LambdaRestApi;

    /**
     * The root resource interface of the API Gateway
     */
    readonly apiRootResource: api.IResource;

    /**
     * Cognito UserPool for external users
     */
    readonly extUsrPool: cognito.UserPool;

    /**
     * Cognito UserPoolClient for client apps requesting sign-in.
     */
    readonly extUsrPoolClient: cognito.CfnUserPoolClient;

    /**
     * Cognito external authorizer for external users
     */
    readonly extUsrAuthorizer: api.CognitoUserPoolsAuthorizer;

    /**
     * local instance of the stack used to add suppressions
     */
    private readonly stack: cdk.Stack;

    constructor(scope: Construct, id: string, props: RestEndpointProps) {
        super(scope, id);
        this.stack = cdk.Stack.of(scope);

        const lambdaRestApi = new ApiGatewayToLambda(this, 'EndPoint', {
            existingLambdaObj: props.getRequestLambda,
            apiGatewayProps: {
                description: 'API endpoint to access the Document Understanding Services',
                restApiName: `${cdk.Aws.STACK_NAME}-RestAPI`,
                proxy: false
            } as LambdaRestApiProps
        });

        const requestValidator = new api.RequestValidator(this, 'RequestValidator', {
            restApi: lambdaRestApi.apiGateway,
            requestValidatorName: `${cdk.Aws.STACK_NAME}-api-request-validator`,
            validateRequestBody: true,
            validateRequestParameters: true
        });

        new WafwebaclToApiGateway(this, 'Endpoint', {
            existingApiGatewayInterface: lambdaRestApi.apiGateway
        });

        // Authorizers: internal only for MVP
        // Authorizers: internal, external and common (includes both internal and external) for next release
        this.extUsrPool = new cognito.UserPool(this, 'ExtUsrPool', {
            userPoolName: `${cdk.Aws.STACK_NAME}-ExtUsrPool`,
            selfSignUpEnabled: true,
            userVerification: {
                emailSubject: `Verify your email to continue using ${props.applicationTrademarkName}`,
                emailBody: `Thank you for creating your profile on ${props.applicationTrademarkName}. Your verification code is {####}`,
                emailStyle: cognito.VerificationEmailStyle.CODE,
                smsMessage: `Thank you for creating your profile on ${props.applicationTrademarkName}! Your verification code is {####}`
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
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            userInvitation: {
                emailSubject: `Invitation to join ${props.applicationTrademarkName} app!`,
                emailBody: `You have been invited to join ${props.applicationTrademarkName} app. Your temporary credentials are:</p> \
                    <p> \
                    Username: <strong>{username}</strong><br /> \
                    Password: <strong>{####}</strong> \
                    </p> \
                    <p>\
                    Please use this temporary password to sign in and change your password. \
                    Wait until the deployent has completed before accessing the website or api.  \
                    </p> `
            }
        });
        (this.extUsrPool.node.tryFindChild('Resource') as cognito.CfnUserPool).userPoolAddOns = {
            advancedSecurityMode: 'ENFORCED'
        };

        this.extUsrPoolClient = new cognito.CfnUserPoolClient(this, 'ClientApp', {
            userPoolId: this.extUsrPool.userPoolId,
            explicitAuthFlows: [
                'ALLOW_ADMIN_USER_PASSWORD_AUTH',
                'ALLOW_USER_PASSWORD_AUTH',
                'ALLOW_REFRESH_TOKEN_AUTH',
                'ALLOW_CUSTOM_AUTH',
                'ALLOW_USER_SRP_AUTH'
            ],
            accessTokenValidity: 5,
            idTokenValidity: 5,
            tokenValidityUnits: {
                accessToken: 'minutes',
                idToken: 'minutes'
            }
        });

        const externalUserAuth = new api.CognitoUserPoolsAuthorizer(this, 'ExtUsrAuthorizer', {
            cognitoUserPools: [this.extUsrPool],
            authorizerName: 'ExtUserAuthorizer'
        });

        // cognito user is created only if user provides their own email address for notifications
        const cognitoUserCondition = new cdk.CfnCondition(this, 'CognitoUserCondition', {
            expression: cdk.Fn.conditionNot(
                cdk.Fn.conditionOr(
                    cdk.Fn.conditionEquals(props.defaultUserEmail, PLACEHOLDER_EMAIL),
                    cdk.Fn.conditionEquals(props.defaultUserEmail, '')
                )
            )
        });
        const cognitoUser = new CfnUserPoolUser(this, 'DefaultUser', {
            desiredDeliveryMediums: ['EMAIL'],
            forceAliasCreation: false,
            userPoolId: this.extUsrPool.userPoolId,
            userAttributes: [
                {
                    name: 'email',
                    value: props.defaultUserEmail
                }
            ],
            username: cdk.Fn.select(0, cdk.Fn.split('@', props.defaultUserEmail))
        });
        cognitoUser.cfnOptions.condition = cognitoUserCondition;

        // mapping uncaught 5XX errors to 400 per AWS guidelines
        new api.GatewayResponse(this, 'InternalServerErrorDefaultResponse', {
            restApi: lambdaRestApi.apiGateway,
            type: api.ResponseType.DEFAULT_5XX,
            statusCode: '400',
            responseHeaders: {
                'gatewayresponse.header.Access-Control-Allow-Origin': "'*'",
                'gatewayresponse.header.Access-Control-Allow-Headers': "'*'"
            }
        });

        const postRequestLambdaIntegration = new api.LambdaIntegration(props.postRequestLambda, {
            passthroughBehavior: api.PassthroughBehavior.NEVER
        });

        const getRequestLambdaIntegration = new api.LambdaIntegration(props.getRequestLambda, {
            passthroughBehavior: api.PassthroughBehavior.NEVER
        });

        const getDocumentLambdaIntegration = new api.LambdaIntegration(props.getDocumentLambda, {
            passthroughBehavior: api.PassthroughBehavior.NEVER
        });

        const getInferenceLambdaIntegration = new api.LambdaIntegration(props.getInferencesLambda, {
            passthroughBehavior: api.PassthroughBehavior.NEVER
        });

        const postRedactLambdaIntegration = new api.LambdaIntegration(props.postRedactLambda, {
            passthroughBehavior: api.PassthroughBehavior.NEVER
        });

        const apiRoot = lambdaRestApi.apiGateway.root; // root resource

        // Paths for case management
        const caseResource = apiRoot.addResource('case');

        // case creation
        caseResource.addCorsPreflight({
            allowOrigins: ['*'],
            allowHeaders: ['*'],
            allowMethods: ['POST']
        });
        caseResource.addMethod('POST', postRequestLambdaIntegration, {
            operationName: 'CreateCase',
            authorizer: externalUserAuth,
            authorizationType: api.AuthorizationType.COGNITO,
            requestValidator: requestValidator,
            requestParameters: {
                'method.request.header.Authorization': true
            },
            requestModels: {
                'application/json': new Model(this, 'CreateCaseApiBodyModel', {
                    restApi: lambdaRestApi.apiGateway,
                    contentType: 'application/json',
                    description: 'Defines the required JSON structure of the POST request to create a case',
                    modelName: 'CreateCaseApiBodyModel',
                    schema: createCaseBodySchema
                })
            },
            methodResponses: [
                {
                    responseModels: {
                        'application/json': new Model(this, 'CreateCaseResponseModel', {
                            restApi: lambdaRestApi.apiGateway,
                            contentType: 'application/json',
                            description: 'Response model to describe response of create case',
                            modelName: 'CreateCaseResponseModel',
                            schema: createCaseResponseSchema
                        })
                    },
                    statusCode: '200'
                }
            ]
        });

        // getting details of a specific case
        const caseCaseIdResource = caseResource.addResource('{caseId}');
        caseCaseIdResource.addCorsPreflight({
            allowOrigins: ['*'],
            allowHeaders: ['*'],
            allowMethods: ['GET']
        });

        const getListCaseResponseModel = new Model(this, 'GetCaseResponseModel', {
            restApi: lambdaRestApi.apiGateway,
            contentType: 'application/json',
            description: 'Response to retrieve records for a CaseId',
            modelName: 'GetCaseResponseModel',
            schema: getCaseResponseSchema
        });

        caseCaseIdResource.addMethod('GET', getRequestLambdaIntegration, {
            operationName: 'GetCase',
            authorizationType: api.AuthorizationType.COGNITO,
            authorizer: externalUserAuth,
            requestParameters: {
                'method.request.header.Authorization': true
            },
            methodResponses: [
                {
                    responseModels: {
                        'application/json': getListCaseResponseModel
                    },
                    statusCode: '200'
                }
            ]
        });

        // getting all cases
        const casesResource = apiRoot.addResource('cases');
        casesResource.addCorsPreflight({
            allowOrigins: ['*'],
            allowHeaders: ['*'],
            allowMethods: ['GET']
        });
        casesResource.addMethod('GET', getRequestLambdaIntegration, {
            operationName: 'GetCases',
            authorizationType: api.AuthorizationType.COGNITO,
            authorizer: externalUserAuth,
            requestParameters: {
                'method.request.header.Authorization': true
            },
            methodResponses: [
                {
                    responseModels: {
                        'application/json': getListCaseResponseModel
                    },
                    statusCode: '200'
                }
            ]
        });

        // Paths for document upload
        const documentResource = apiRoot.addResource('document');

        // Upload a document to a case
        documentResource.addCorsPreflight({
            allowOrigins: ['*'],
            allowHeaders: ['*'],
            allowMethods: ['POST']
        });
        documentResource.addMethod('POST', postRequestLambdaIntegration, {
            operationName: 'UploadDocument',
            authorizer: externalUserAuth,
            authorizationType: api.AuthorizationType.COGNITO,
            requestValidator: requestValidator,
            requestParameters: {
                'method.request.header.Authorization': true
            },
            requestModels: {
                'application/json': new Model(this, 'UploadDocumentApiBodyModel', {
                    restApi: lambdaRestApi.apiGateway,
                    contentType: 'application/json',
                    description: 'Defines the required JSON structure of the POST request to upload documents to S3',
                    modelName: 'UploadDocumentApiBodyModel',
                    schema: uploadDocumentBodySchema
                })
            },
            methodResponses: [
                {
                    statusCode: '200'
                }
            ]
        });

        // Get a key to download a document from S3
        const documentCaseIdDocIdResource = documentResource.addResource('{caseId}').addResource('{documentId}');
        documentCaseIdDocIdResource.addCorsPreflight({
            allowOrigins: ['*'],
            allowHeaders: ['*'],
            allowMethods: ['GET']
        });
        documentCaseIdDocIdResource.addMethod('GET', getRequestLambdaIntegration, {
            operationName: 'GetDocumentUrl',
            authorizer: externalUserAuth,
            authorizationType: api.AuthorizationType.COGNITO,
            requestValidator: requestValidator,
            requestParameters: {
                'method.request.querystring.redacted': false,
                'method.request.header.Authorization': true
            },
            methodResponses: [
                {
                    statusCode: '200',
                    responseModels: {
                        'application/json': new Model(this, 'GetDocumentResponseModel', {
                            restApi: lambdaRestApi.apiGateway,
                            contentType: 'application/json',
                            description: 'Response to get location of a document',
                            modelName: 'GetDocumentResponseModel',
                            schema: getDocInfoResponseSchema
                        })
                    }
                }
            ]
        });

        // Path for downloading document using key as returned from GetDocumentUrl
        const documentDownloadResource = documentResource.addResource('download');
        documentDownloadResource.addCorsPreflight({
            allowOrigins: ['*'],
            allowHeaders: ['*'],
            allowMethods: ['GET']
        });
        documentDownloadResource.addMethod('GET', getDocumentLambdaIntegration, {
            operationName: 'DownloadDocument',
            authorizer: externalUserAuth,
            authorizationType: api.AuthorizationType.COGNITO,
            requestValidator: requestValidator,
            requestParameters: {
                'method.request.querystring.key': true,
                'method.request.header.Authorization': true
            },
            methodResponses: [
                {
                    statusCode: '200',
                    responseModels: {
                        'application/json': new Model(this, 'DownloadDocumentResponseModel', {
                            restApi: lambdaRestApi.apiGateway,
                            contentType: 'application/json',
                            description: 'Response to download a document',
                            modelName: 'DownloadDocumentResponseModel',
                            schema: downloadDocResponseSchema
                        })
                    }
                }
            ]
        });

        // getting all the available inference types for a given document in a case
        const inferencesResource = apiRoot
            .addResource('inferences')
            .addResource('{caseId}')
            .addResource('{documentId}');
        inferencesResource.addCorsPreflight({
            allowOrigins: ['*'],
            allowHeaders: ['*'],
            allowMethods: ['GET']
        });
        inferencesResource.addMethod('GET', getInferenceLambdaIntegration, {
            operationName: 'GetInferences',
            authorizer: externalUserAuth,
            authorizationType: api.AuthorizationType.COGNITO,
            requestParameters: {
                'method.request.header.Authorization': true
            }
        });

        // getting the specified inference
        const inferenceResource = inferencesResource.addResource('{inferenceType}');
        inferenceResource.addCorsPreflight({
            allowOrigins: ['*'],
            allowHeaders: ['*'],
            allowMethods: ['GET']
        });
        inferenceResource.addMethod('GET', getInferenceLambdaIntegration, {
            operationName: 'GetInference',
            authorizer: externalUserAuth,
            authorizationType: api.AuthorizationType.COGNITO,
            requestParameters: {
                'method.request.header.Authorization': true
            },
            methodResponses: [
                {
                    statusCode: '200'
                }
            ]
        });

        // path for document redaction
        const redactResource = apiRoot.addResource('redact').addResource('{caseId}').addResource('{documentId}');
        redactResource.addCorsPreflight({
            allowOrigins: ['*'],
            allowHeaders: ['*'],
            allowMethods: ['POST']
        });
        redactResource.addMethod('POST', postRedactLambdaIntegration, {
            operationName: 'RedactDocument',
            authorizer: externalUserAuth,
            authorizationType: api.AuthorizationType.COGNITO,
            requestValidator: requestValidator,
            requestParameters: {
                'method.request.header.Authorization': true
            },
            requestModels: {
                'application/json': new Model(this, 'RedactionApiRequestBodyModel', {
                    restApi: lambdaRestApi.apiGateway,
                    contentType: 'application/json',
                    description: 'Defines the required JSON structure for the redaction request body',
                    modelName: 'RedactionApiRequestBodyModel',
                    schema: redactRequestBodySchema
                })
            },
            methodResponses: [
                {
                    statusCode: '201'
                }
            ]
        });

        const apiDocs = new ApiDocumentation(this, 'ApiDocumentation', {
            restApiId: lambdaRestApi.apiGateway.restApiId
        });
        apiDocs.node.addDependency(lambdaRestApi);

        this.apiGateway = lambdaRestApi.apiGateway;
        this.apiRootResource = apiRoot;
        this.extUsrAuthorizer = externalUserAuth;

        const _usrPoolReason = 'The role information is not available when creating the user pool';
        const extUsrCfnSmsRole = this.extUsrPool.node
            .tryFindChild('smsRole')
            ?.node.tryFindChild('Resource') as iam.CfnRole;

        const _mfaReason =
            'To enable MFA and what should be used as MFA varies on business case, hence disabling it for customers to take a decision';

        NagSuppressions.addResourceSuppressions(lambdaRestApi.apiGatewayCloudWatchRole!, [
            {
                id: 'AwsSolutions-IAM5',
                reason: 'Module under construction. To be removed in following commits',
                appliesTo: ['Resource::arn:<AWS::Partition>:logs:<AWS::Region>:<AWS::AccountId>:*']
            }
        ]);

        NagSuppressions.addResourceSuppressions(extUsrCfnSmsRole, [
            {
                id: 'AwsSolutions-IAM5',
                reason: _usrPoolReason,
                appliesTo: ['Resource::*']
            }
        ]);

        NagSuppressions.addResourceSuppressions(this.extUsrPool, [
            {
                id: 'AwsSolutions-COG2',
                reason: _mfaReason
            }
        ]);

        addCfnSuppressRules(extUsrCfnSmsRole, [
            {
                id: 'W11',
                reason: _usrPoolReason
            }
        ]);

        const resourcePathsToSuppress = [
            'case',
            'case/{caseId}',
            'cases',
            'document',
            'document/{caseId}/{documentId}',
            'document/download',
            'inferences/{caseId}/{documentId}',
            'inferences/{caseId}/{documentId}/{inferenceType}',
            'redact/{caseId}/{documentId}'
        ];

        resourcePathsToSuppress.forEach((_path) => {
            NagSuppressions.addResourceSuppressionsByPath(
                cdk.Stack.of(this),
                `${lambdaRestApi.apiGateway.root}/${_path}/OPTIONS/Resource`,
                [
                    {
                        id: 'AwsSolutions-APIG4',
                        reason: 'The OPTIONS method cannot use auth as the server has to respond to the OPTIONS request for cors reasons'
                    },
                    {
                        id: 'AwsSolutions-COG4',
                        reason: 'The OPTIONS method cannot use auth as the server has to respond to the OPTIONS request for cors reasons'
                    }
                ],
                false
            );
        });
    }
}
