// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CfnDocumentationPartProps } from 'aws-cdk-lib/aws-apigateway';

export const kendraSearchMethod: Partial<CfnDocumentationPartProps> = {
    location: {
        type: 'METHOD',
        path: '/search/kendra/{query}',
        method: 'GET'
    },
    properties: JSON.stringify({
        description: `This endpoint is used to do a NLP based search, with AWS Kendra, across documents that have been uploaded. 
        The search is restricted only to documents to which the user has access`
    })
};

export const kendraSearchQueryPathParam: Partial<CfnDocumentationPartProps> = {
    location: {
        type: 'PATH_PARAMETER',
        path: '/search/kendra/{query}',
        name: 'query'
    },
    properties: JSON.stringify({
        description: 'The string to search for in the AWS Kendra Index.'
    })
};

export const openSearchMethod: Partial<CfnDocumentationPartProps> = {
    location: {
        type: 'METHOD',
        path: '/search/opensearch/{query}',
        method: 'GET'
    },
    properties: JSON.stringify({
        description: `This endpoint lets you execute a search request to search your cluster for data, across documents 
        that have been uploaded. The search is restricted only to documents to which the user has access`
    })
};

export const openSearchQueryPathParam: Partial<CfnDocumentationPartProps> = {
    location: {
        type: 'PATH_PARAMETER',
        path: '/search/opensearch/{query}',
        name: 'query'
    },
    properties: JSON.stringify({
        description: 'The string to search for in the AWS OpenSearch Serverless Collection.'
    })
};
