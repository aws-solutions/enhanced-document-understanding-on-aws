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
