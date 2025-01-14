// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CfnDocumentationPartProps } from 'aws-cdk-lib/aws-apigateway';

// query params for for fetching records of documents
export const getDocQueryParam: Partial<CfnDocumentationPartProps> = {
    location: {
        type: 'QUERY_PARAMETER',
        path: '/document/{caseId}/{documentId}',
        method: 'GET',
        name: 'redacted'
    },
    properties: JSON.stringify({
        description: 'Boolean value to specify whether to return redacted or unredacted version of document.'
    })
};

export const downloadDocQueryParam: Partial<CfnDocumentationPartProps> = {
    location: {
        type: 'QUERY_PARAMETER',
        path: '/document/download',
        method: 'GET',
        name: 'key'
    },
    properties: JSON.stringify({
        description: 'S3 key of the document to download. Will only work if request is sent by an authorized user.'
    })
};

export const downloadResourceDescription: Partial<CfnDocumentationPartProps> = {
    location: {
        type: 'METHOD',
        path: '/document/download',
        method: 'POST'
    },
    properties: JSON.stringify({
        description:
            'This endpoint is used to download a document using a S3 signed url. All requests are validated and only documents that a user has permissions to access are returned.'
    })
};
