// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { JsonSchema, JsonSchemaType } from 'aws-cdk-lib/aws-apigateway';

export const getDocInfoResponseSchema: JsonSchema = {
    type: JsonSchemaType.OBJECT,
    description:
        'Location of the document that is requested to be downloaded. This is used by a lambda function to create an authenticated signed-url',
    properties: {
        DocId: {
            type: JsonSchemaType.STRING,
            description: 'ID of the requested document'
        },
        Bucket: {
            type: JsonSchemaType.STRING,
            description: 'S3 bucket name'
        },
        key: {
            type: JsonSchemaType.STRING,
            description: 'Location of the requested document'
        },
        FileName: {
            type: JsonSchemaType.STRING,
            description: 'Filename'
        }
    }
};

export const downloadDocResponseSchema: JsonSchema = {
    type: JsonSchemaType.OBJECT,
    description: 'Object containing the presigned url to download a requested document',
    properties: {
        downloadUrl: {
            type: JsonSchemaType.STRING,
            description: 'Presigned URL to download file'
        }
    }
};
