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

import { JsonSchema, JsonSchemaType } from 'aws-cdk-lib/aws-apigateway';

export const caseBodySchema: JsonSchema  = {
    type: JsonSchemaType.OBJECT,
    properties: {
        caseId: {
            type: JsonSchemaType.STRING,
            description: 'The ID of the case to whom the document belongs',
            pattern: '\\w+'
        }
    }, 
    required: ['caseId'] 
}

export const createCaseBodySchema: JsonSchema = {
    type: JsonSchemaType.OBJECT,
    properties: {
        caseName: {
            type: JsonSchemaType.STRING,
            description: 'The ID of the case to whom the document belongs',
            pattern: '\\w+',
            minLength: 3,
            maxLength: 50
        },
        enableBackendUpload: {
            type: JsonSchemaType.BOOLEAN,
            description: 'Enables bulk uplod process'
        }
    },
    required: ['caseName', 'enableBackendUpload']
};
