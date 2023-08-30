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

// Resources for the case API
export const caseResource: Partial<CfnDocumentationPartProps> = {
    location: {
        type: 'RESOURCE',
        path: '/case'
    },
    properties: JSON.stringify({
        description: 'Create a new case or retrieve a case by its id. The case id is returned in the response body.'
    })
};

export const createCaseMethod: Partial<CfnDocumentationPartProps> = {
    location: {
        type: 'METHOD',
        path: '/case',
        method: 'POST'
    },
    properties: JSON.stringify({
        description: 'This endpoint is used to create new cases and retrieve an existing case details.'
    })
};

// Request body parameters for the case API
export const createCaseBody: Partial<CfnDocumentationPartProps> = {
    location: {
        type: 'REQUEST_BODY',
        path: '/case',
        method: 'POST'
    },
    properties: JSON.stringify({
        description: 'To create a new case the case name must be included in the request'
    })
};

// success responses - RESPONSE_BODY api entity works for this
export const createCaseSuccess: Partial<CfnDocumentationPartProps> = {
    location: {
        type: 'RESPONSE_BODY',
        path: '/case',
        method: 'POST',
        statusCode: '200'
    },
    properties: JSON.stringify({
        description:
            'A case has been successfully created. The response includes the generated `CaseId` along with the record database entry.'
    })
};

// success responses - RESPONSE_BODY api entity works for this
export const getCaseSuccess: Partial<CfnDocumentationPartProps> = {
    location: {
        type: 'RESPONSE_BODY',
        path: '/case',
        method: 'GET',
        statusCode: '200'
    },
    properties: JSON.stringify({
        description: 'Retrieve records for items with a given CaseId.'
    })
};

// error responses
export const createCaseError: Partial<CfnDocumentationPartProps> = {
    location: {
        type: 'RESPONSE_BODY',
        path: '/case',
        method: 'POST',
        statusCode: '500'
    },
    properties: JSON.stringify({
        description: 'Error in creating case.'
    })
};
