// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';

import { Capture, Template } from 'aws-cdk-lib/assertions';

import { ApiDocumentation } from '../../../lib/api/rest-api-documentation/api-documentation';

describe('When CaseManager construct is created', () => {
    let template: Template;
    let apiDocs: ApiDocumentation;
    beforeAll(() => {
        const stack = new cdk.Stack();

        const mockRestApiId = 'fake-rest-api-id';
        apiDocs = new ApiDocumentation(stack, 'TestableApiDocs', {
            restApiId: mockRestApiId
        });
        template = Template.fromStack(stack);
    });

    it('Should create the required number of DocumentationParts', () => {
        template.resourceCountIs('AWS::ApiGateway::DocumentationPart', 18);
    });

    it('Should create a DocumentationVersion', () => {
        template.resourceCountIs('AWS::ApiGateway::DocumentationVersion', 1);
    });

    it('Should have documentation parts for the required paths', () => {
        const restApiIdCapture = new Capture();
        template.hasResourceProperties('AWS::ApiGateway::DocumentationPart', {
            Location: {
                Method: '*',
                Name: 'Authorization',
                Path: '/',
                Type: 'REQUEST_HEADER'
            },
            Properties: JSON.stringify({
                description: 'Authorization header in the form of a Cognito id token string.'
            }),
            RestApiId: restApiIdCapture
        });

        expect(restApiIdCapture.asString()).toEqual('fake-rest-api-id');
    });
});
