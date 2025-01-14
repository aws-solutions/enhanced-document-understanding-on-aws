// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
