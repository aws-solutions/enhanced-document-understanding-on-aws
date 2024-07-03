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

export const uploadDocumentBodySchema: JsonSchema = {
    type: JsonSchemaType.OBJECT,
    properties: {
        userId: {
            type: JsonSchemaType.STRING,
            description: 'The ID of the user to whom the document belongs',
            pattern: '^[a-zA-Z0-9_+:-]{1,}'
        },
        caseId: {
            type: JsonSchemaType.STRING,
            description: 'The ID of the case to whom the document belongs',
            pattern: '^[a-zA-Z0-9_+:-]{1,}'
        },
        caseName: {
            type: JsonSchemaType.STRING,
            description: 'The ID of the case to whom the document belongs',
            pattern: '\\w+',
            minLength: 3,
            maxLength: 50
        },
        fileName: {
            type: JsonSchemaType.STRING,
            description: 'The name of the file',
            pattern: '\\w+',
            minLength: 3,
            maxLength: 50
        },
        fileExtension: {
            type: JsonSchemaType.STRING,
            description: 'The extension of the file. Must begin with period',
            pattern: '^.(pdf|jpg|jpeg|png)$'
        },
        documentType: {
            type: JsonSchemaType.STRING,
            description: 'The type of document based on business rules, such as driving license, passport, etc',
            pattern: '\\w+'
        }
    },
    required: ['userId', 'caseId', 'caseName', 'fileName', 'fileExtension', 'documentType']
};
