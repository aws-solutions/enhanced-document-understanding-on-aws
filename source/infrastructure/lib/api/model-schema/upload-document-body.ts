// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
