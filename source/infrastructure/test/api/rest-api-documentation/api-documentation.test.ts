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
        template.resourceCountIs('AWS::ApiGateway::DocumentationPart', 16);
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
