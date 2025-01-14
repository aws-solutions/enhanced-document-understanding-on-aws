// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { CustomDashboard } from '../../lib/metrics/custom-dashboard';
import { COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME } from '../../lib/utils/constants';

describe('When a CloudWatch Dashboard Construct is created', () => {
    let template: Template;

    beforeAll(() => {
        const stack = new cdk.Stack();
        const dashboard = new CustomDashboard(stack, 'Ops', {
            apiName: new apigateway.LambdaRestApi(stack, 'Api', {
                handler: new lambda.Function(stack, 'Function', {
                    code: lambda.Code.fromAsset('../infrastructure/test/mock-lambda-func/python-lambda'),
                    handler: 'function.handler',
                    runtime: COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME
                })
            }).restApiName,
            userPoolId: 'fakeUserPoolId',
            genUUID: 'fake-uuid'
        });

        template = Template.fromStack(stack);
    });

    it('should create the widget and metrics', () => {
        template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
            'DashboardBody': Match.anyValue(),
            'DashboardName': {
                'Fn::Join': [
                    '',
                    [
                        {
                            Ref: 'AWS::StackName'
                        },
                        '-',
                        {
                            Ref: 'AWS::Region'
                        },
                        '-Dashboard'
                    ]
                ]
            }
        });
    });

    it('should have a deletion policy as "Delete:', () => {
        template.hasResource('AWS::CloudWatch::Dashboard', {
            DeletionPolicy: 'Delete',
            Properties: Match.anyValue()
        });
    });
});
