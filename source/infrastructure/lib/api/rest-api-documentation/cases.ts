// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CfnDocumentationPartProps } from 'aws-cdk-lib/aws-apigateway';

// Resources for the case API
export const casesResource: Partial<CfnDocumentationPartProps> = {
    location: {
        type: 'RESOURCE',
        path: '/cases'
    },
    properties: JSON.stringify({
        description: 'Cases is used to retrieve all records accessible to an authenticated user'
    })
};
