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

export const searchMethod: Partial<CfnDocumentationPartProps> = {
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

export const searchQueryPathParam: Partial<CfnDocumentationPartProps> = {
    location: {
        type: 'PATH_PARAMETER',
        path: '/search/kendra/{query}',
        name: 'query'
    },
    properties: JSON.stringify({
        description: 'The string to search for in the AWS Kendra Index.'
    })
};
