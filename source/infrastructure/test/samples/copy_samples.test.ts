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

import { Match, Template } from 'aws-cdk-lib/assertions';
import { SampleDocuments } from '../../../infrastructure/lib/samples/copy-samples';

describe('When Deploying samples', () => {
    let template: Template;

    beforeAll(() => {
        template = buildStack();
    });

    it('should have a nested stack', () => {
        expect(template).not.toBe(undefined);
        template.resourceCountIs('Custom::CopySamples', 1);
    });

    it('should have 2 parameters', () => {
        template.hasParameter('SamplesSourceBucketName', {
            Type: 'String',
            Description: 'Name of the S3 bucket to used as destination bucket for copying samples.'
        });

        template.hasParameter('SamplesCustomResourceLambdaArn', {
            Type: 'String',
            AllowedPattern: '^arn:(aws|aws-cn|aws-us-gov):lambda:\\S+:\\d{12}:function:\\S+$',
            Description: 'Arn of the Lambda function to use for custom resource implementation.'
        });
    });

    it('should have update and delete policies', () => {
        template.hasResource('Custom::CopySamples', {
            Properties: Match.anyValue(),
            UpdateReplacePolicy: 'Delete',
            DeletionPolicy: 'Delete'
        });
    });
});

describe('When running as cdk synth locally outside the pipeline', () => {
    let oldEnv: string | undefined;
    let template: Template;

    beforeAll(() => {
        oldEnv = process.env.DIST_OUTPUT_BUCKET;
        delete process.env.DIST_OUTPUT_BUCKET;

        template = buildStack();
    });

    it('should create a custom resource to copy the templates', () => {
        template.resourceCountIs('Custom::CopySamples', 1);
        template.hasResource('Custom::CopySamples', {
            Properties: {
                ServiceToken: {
                    'Ref': 'SamplesCustomResourceLambdaArn'
                },
                Resource: 'COPY_SAMPLE_DOCUMENTS',
                SOURCE_BUCKET_NAME: {
                    'Fn::Sub': Match.anyValue()
                },
                SOURCE_PREFIX: Match.stringLikeRegexp('[.zip]$'),
                DESTINATION_BUCKET_NAME: {
                    'Ref': 'SamplesSourceBucketName'
                },
                DESTINATION_PREFIX: 'sample-documents'
            },
            'UpdateReplacePolicy': 'Delete',
            'DeletionPolicy': 'Delete'
        });
    });

    afterAll(() => {
        process.env.DIST_OUTPUT_BUCKET = oldEnv;
    });
});

describe('When building in standard pipelines', () => {
    let template: Template;

    beforeAll(() => {
        process.env.DIST_OUTPUT_BUCKET = 'fake-bucket';
        process.env.SOLUTION_NAME = 'fake-solution-name';
        process.env.Version = 'v9.9.9';
        template = buildStack();
    });

    it('should create a custom resource to copy the templates with appropriate SOURCE_BUCKET_NAME and SOURCE_PREFIX', () => {
        template.hasResourceProperties('Custom::CopySamples', {
            ServiceToken: {
                'Ref': 'SamplesCustomResourceLambdaArn'
            },
            SOURCE_BUCKET_NAME: {
                'Fn::Join': [
                    '-',
                    [
                        {
                            'Fn::FindInMap': ['SourceCode', 'General', 'S3Bucket']
                        },
                        {
                            'Ref': 'AWS::Region'
                        }
                    ]
                ]
            },
            SOURCE_PREFIX: {
                'Fn::Join': [
                    '',
                    [
                        {
                            'Fn::FindInMap': ['SourceCode', 'General', 'KeyPrefix']
                        },
                        Match.stringLikeRegexp('/asset[a-z0-9]*.zip')
                    ]
                ]
            },
            Resource: 'COPY_SAMPLE_DOCUMENTS',
            DESTINATION_BUCKET_NAME: {
                'Ref': 'SamplesSourceBucketName'
            },
            DESTINATION_PREFIX: 'sample-documents'
        });
    });

    afterAll(() => {
        delete process.env.DIST_OUTPUT_BUCKET;
        delete process.env.SOLUTION_NAME;
        delete process.env.Version;
    });
});

function buildStack() {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const nestedStack = new SampleDocuments(stack, 'SampleDocumentsStack', {
        parameters: {
            appConfigBucket: 'samplesBucket',
            CustomResourceLambdaArn: 'arn:aws:us-east-1:123456789012:function:fake-function'
        }
    });
    const template = Template.fromStack(nestedStack);
    return template;
}
