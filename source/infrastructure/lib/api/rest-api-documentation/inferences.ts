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
