// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
