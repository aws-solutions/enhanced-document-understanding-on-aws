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

export const redactMethod: Partial<CfnDocumentationPartProps> = {
    location: {
        type: 'METHOD',
        path: '/redact/{caseId}/{documentId}',
        method: 'POST'
    },
    properties: JSON.stringify({
        description: [
            `This endpoint is used to redact specific entities from a document.
            The request body describes the requried structure. A successful request will 
            redact a document with a given ID, store it in the S3 bucket, and update the case records. `,
            'To download a redacted document, send a request to `GET:/document/{caseId}/{documentId}?redacted=true`'
        ].join('')
    })
};

export const redactSuccessResponse: Partial<CfnDocumentationPartProps> = {
    location: {
        type: 'RESPONSE',
        path: '/redact/{caseId}/{documentId}',
        statusCode: '201'
    },
    properties: JSON.stringify({
        description: 'Successully request to redact entities from a document'
    })
};
