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
