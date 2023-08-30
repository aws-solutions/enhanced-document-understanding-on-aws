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
 *********************************************************************************************************************/

import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3_asset from 'aws-cdk-lib/aws-s3-assets';
import * as path from 'path';

import { Construct } from 'constructs';
import { getResourceProperties } from '../utils/common-utils';

/**
 * Construct to build and copy the Sample Documents in the repo from asset buckets to destination bucket using a custom resource
 */
export class SampleDocuments extends cdk.NestedStack {
    /**
     * The bucket in which the assets will be maintained
     */
    public appConfigBucket: s3.Bucket;

    constructor(scope: Construct, id: string, props: cdk.NestedStackProps) {
        super(scope, id, props);

        const appConfigBucket = new cdk.CfnParameter(cdk.Stack.of(this), 'SamplesSourceBucketName', {
            type: 'String',
            description: 'Name of the S3 bucket to used as destination bucket for copying samples.',
            minLength: 3,
            maxLength: 63,
            allowedPattern: '^[a-z0-9-_]+$'
        }).valueAsString;

        const samplesCustomResourceLambdaArn = new cdk.CfnParameter(
            cdk.Stack.of(this),
            'SamplesCustomResourceLambdaArn',
            {
                type: 'String',
                allowedPattern: '^arn:(aws|aws-cn|aws-us-gov):lambda:\\S+:\\d{12}:function:\\S+$',
                description: 'Arn of the Lambda function to use for custom resource implementation.'
            }
        ).valueAsString;

        const destinationBucketName = s3.Bucket.fromBucketName(
            this,
            'DestinationBucketName',
            appConfigBucket
        ).bucketName;

        const sampleDocumentAssets = new s3_asset.Asset(this, 'SampleDocuments', {
            path: path.join(__dirname, '../../../sample-documents/')
        });

        new cdk.CustomResource(this, 'CopySamples', {
            resourceType: 'Custom::CopySamples',
            serviceToken: samplesCustomResourceLambdaArn,
            properties: {
                ...getResourceProperties(this, sampleDocumentAssets),
                Resource: 'COPY_SAMPLE_DOCUMENTS',
                DESTINATION_BUCKET_NAME: destinationBucketName,
                DESTINATION_PREFIX: 'sample-documents'
            }
        });
    }
}
