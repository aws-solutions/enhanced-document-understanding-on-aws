// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { JsonSchema, JsonSchemaType } from 'aws-cdk-lib/aws-apigateway';

export const createCaseResponseSchema: JsonSchema = {
    type: JsonSchemaType.OBJECT,
    properties: {
        ddbResponse: {
            type: JsonSchemaType.OBJECT,
            description: 'Record written into ddb',
            properties: {
                CASE_ID: {
                    type: JsonSchemaType.STRING
                },
                DOCUMENT_ID: {
                    type: JsonSchemaType.STRING
                },
                USER_ID: {
                    type: JsonSchemaType.STRING
                },
                CASE_NAME: {
                    type: JsonSchemaType.STRING
                },
                CREATION_TIMESTAMP: {
                    type: JsonSchemaType.STRING
                },
                STATUS: {
                    type: JsonSchemaType.STRING
                }
            }
        },
        caseId: {
            type: JsonSchemaType.STRING,
            description: 'ID of the case that was created'
        }
    }
};

export const getCaseResponseSchema: JsonSchema = {
    type: JsonSchemaType.OBJECT,
    properties: {
        Items: {
            type: JsonSchemaType.ARRAY,
            description: 'Array of DynamoDB records that have the given caseId',
            items: {
                type: JsonSchemaType.OBJECT,
                description: 'Record written into ddb',
                properties: {
                    CASE_ID: {
                        type: JsonSchemaType.STRING
                    },
                    DOCUMENT_ID: {
                        type: JsonSchemaType.STRING
                    },
                    USER_ID: {
                        type: JsonSchemaType.STRING
                    },
                    CASE_NAME: {
                        type: JsonSchemaType.STRING
                    },
                    CREATION_TIMESTAMP: {
                        type: JsonSchemaType.STRING
                    },
                    STATUS: {
                        type: JsonSchemaType.STRING
                    }
                }
            }
        },
        Count: {
            type: JsonSchemaType.INTEGER,
            description: 'Number of records with the given CaseId'
        }
    }
};
