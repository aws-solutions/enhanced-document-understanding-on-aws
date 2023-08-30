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
 **********************************************************************************************************************/
import { CfnDocumentationPartProps } from 'aws-cdk-lib/aws-apigateway';

export const apiRootDocumentationPart: Partial<CfnDocumentationPartProps> = {
    location: {
        type: 'API'
    },
    properties: JSON.stringify({
        info: {
            description: 'Enhanced Document Understanding on AWS API.',
            contact: {
                name: 'Amazon.com, Inc'
            }
        }
    })
};

// HTTP request headers for all requests is propagated along
export const authTokenHeader: Partial<CfnDocumentationPartProps> = {
    location: {
        type: 'REQUEST_HEADER',
        path: '/',
        name: 'Authorization',
        method: '*'
    },
    properties: JSON.stringify({
        description: 'Authorization header in the form of a Cognito id token string.'
    })
};

// Response headers for all succcess responses
export const contentTypeResponseHeader: Partial<CfnDocumentationPartProps> = {
    location: {
        type: 'RESPONSE_HEADER',
        path: '/',
        name: 'Content-Type',
        statusCode: '200'
    },
    properties: JSON.stringify({
        description: 'Content-Type header is `application/json` for default 200 responses'
    })
};

// generic success response
export const successResponse: Partial<CfnDocumentationPartProps> = {
    location: {
        type: 'RESPONSE',
        statusCode: '200'
    },
    properties: JSON.stringify({
        description: 'Successully invoked API endpoint'
    })
};

// caseId and docId path parameters as used by all endpoings
export const caseIdPathParam: Partial<CfnDocumentationPartProps> = {
    location: {
        type: 'PATH_PARAMETER',
        name: 'caseId'
    },
    properties: JSON.stringify({
        description: 'ID associated with a case.'
    })
};

export const docIdPathParam: Partial<CfnDocumentationPartProps> = {
    location: {
        type: 'PATH_PARAMETER',
        name: 'documentId'
    },
    properties: JSON.stringify({
        description: 'ID associated with a document.'
    })
};
