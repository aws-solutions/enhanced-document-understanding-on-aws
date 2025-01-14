// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { JsonSchema, JsonSchemaType } from 'aws-cdk-lib/aws-apigateway';

export const redactRequestBodySchema: JsonSchema = {
    type: JsonSchemaType.OBJECT,
    anyOf: [
        // we need at least 1 of these top level properties to perform redaction
        { required: ['phrases'] },
        { required: ['entities'] }
    ],
    properties: {
        entities: {
            type: JsonSchemaType.OBJECT,
            description:
                'Keys of this object represent the names of the entity detection inference (e.g. entity-standard or entity-medical) for which we want to redact content',
            // if the entities property is present, we expect it to be fully formed, with at least 1 entity specified for redaction
            minProperties: 1,
            patternProperties: {
                '.*': {
                    type: JsonSchemaType.OBJECT,
                    description: "Keys of this object represent entity types to be redacted. E.g. 'DATE'",
                    minProperties: 1,
                    patternProperties: {
                        '.*': {
                            type: JsonSchemaType.OBJECT,
                            description:
                                "Specific entities to be redacted, where key is the entity text. E.g. 'December 25, 2025'",
                            minProperties: 1,
                            patternProperties: {
                                '.*': {
                                    type: JsonSchemaType.ARRAY,
                                    description:
                                        'Array of the page numbers for the given entity which we want to redact',
                                    minItems: 1,
                                    items: {
                                        type: JsonSchemaType.INTEGER
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        phrases: {
            type: JsonSchemaType.ARRAY,
            description: 'If included, redacts the given phrases (not related to entities) on pages specified.',
            minItems: 1,
            items: {
                type: JsonSchemaType.OBJECT,
                description: 'Each of these objects defines a generic text to be redacted on pages specified',
                required: ['text', 'pages'],
                properties: {
                    text: { type: JsonSchemaType.STRING, description: 'The specific text to be redacted' },
                    pages: {
                        type: JsonSchemaType.ARRAY,
                        description: 'Pages where this phrase will be redacted',
                        minItems: 1,
                        items: { type: JsonSchemaType.INTEGER }
                    }
                }
            }
        }
    }
};
