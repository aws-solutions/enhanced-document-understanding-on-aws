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
