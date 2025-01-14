// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CfnDocumentationPartProps } from 'aws-cdk-lib/aws-apigateway';

export const getInferenceByTypeMethod: Partial<CfnDocumentationPartProps> = {
    location: {
        type: 'METHOD',
        path: '/inferences/{caseId}/{documentId}/{inferenceType}',
        method: 'GET'
    },
    properties: JSON.stringify({
        description:
            'This endpoint is used to retrieve inference for a document within a case. The `inferenceType` path parameter is the file name of the inference results object that was stored in the S3 inference bucket.'
    })
};

export const listInferencesMethod: Partial<CfnDocumentationPartProps> = {
    location: {
        type: 'METHOD',
        path: '/inferences/{caseId}/{documentId}',
        method: 'GET'
    },
    properties: JSON.stringify({
        description: 'This endpoint is used to list the inference results available for a document.'
    })
};
