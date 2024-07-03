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

import { Template } from 'aws-cdk-lib/assertions';

import { OpenSearchCaseStorage } from '../../lib/search/open-search-case-storage';

describe('When OpenSearchCaseStorage construct is created', () => {
    let template: Template;
    let jsonTemplate: { [key: string]: any };
    let openSearchCaseStorage: OpenSearchCaseStorage;


    beforeAll(() => {
        const stack = new cdk.Stack();
        openSearchCaseStorage = new OpenSearchCaseStorage(stack, 'OpenSearchCaseSearch', {});
        template = Template.fromStack(openSearchCaseStorage);
        jsonTemplate = template.toJSON();
    });

    it('should have open search collection created, with correct prop', () => {
        template.resourceCountIs('AWS::OpenSearchServerless::Collection', 1);

        template.hasResourceProperties('AWS::OpenSearchServerless::Collection',  {
            "Name": "opens-edu",
            "Type": "SEARCH"
        });
    });

    it('should have open search vpc endpoint created, with correct prop', () => {
        template.resourceCountIs('AWS::OpenSearchServerless::VpcEndpoint', 1);

        template.hasResourceProperties('AWS::OpenSearchServerless::VpcEndpoint',  {
            "Name": "opens-edu-vpc-endpoint",
            "SecurityGroupIds": [
                {
                    "Ref": "SecurityGroupId"
                }
            ],
            "SubnetIds": {
                "Ref": "SubnetIds"
            },
            "VpcId": {
                "Ref": "VpcId"
            }
        });
    });

    it('should have open search access policy created, with correct prop', () => {
        template.resourceCountIs('AWS::OpenSearchServerless::AccessPolicy', 2);

        template.hasResourceProperties('AWS::OpenSearchServerless::AccessPolicy',  {
            "Name": "opens-edu-lambda-read-policy",
            "Policy": {
                "Fn::Join": [
                    "",
                    [
                        "[{\"Rules\":[{\"ResourceType\":\"index\",\"Resource\":[\"index/opens-edu/*\"],\"Permission\":[\"aoss:ReadDocument\",\"aoss:CreateIndex\",\"aoss:DescribeIndex\"]},{\"ResourceType\":\"collection\",\"Resource\":[\"collection/opens-edu\"],\"Permission\":[\"aoss:DescribeCollectionItems\"]}],\"Principal\":[\"",
                        {
                            "Ref": "ReadRoleArn"
                        },
                        "\"]}]"
                    ]
                ]
            },
            "Type": "data"
        });

        template.hasResourceProperties('AWS::OpenSearchServerless::AccessPolicy',  {
            "Name": "opens-edu-lambda-write-policy",
            "Policy": {
                "Fn::Join": [
                    "",
                    [
                        "[{\"Rules\":[{\"ResourceType\":\"index\",\"Resource\":[\"index/opens-edu/*\"],\"Permission\":[\"aoss:ReadDocument\",\"aoss:WriteDocument\",\"aoss:CreateIndex\",\"aoss:UpdateIndex\",\"aoss:DescribeIndex\"]},{\"ResourceType\":\"collection\",\"Resource\":[\"collection/opens-edu\"],\"Permission\":[\"aoss:CreateCollectionItems\",\"aoss:UpdateCollectionItems\",\"aoss:DescribeCollectionItems\"]}],\"Principal\":[\"",
                        {
                            "Ref": "WriteRoleArn"
                        },
                        "\"]}]"
                    ]
                ]
            },
            "Type": "data"
        });
    });

    it('should have parameters for nested stack', () => {
        template.hasParameter('VpcId', {
            Type: 'String',
            ConstraintDescription: 'Please provide a valid vpc id',
            Description: 'The vpc id that OpenSearch serverless will be running in'
        });

        template.hasParameter('SubnetIds', {
            Type: 'List<AWS::EC2::Subnet::Id>',
            ConstraintDescription: 'Please provide valid subnet ids',
            Description: 'The subnet ids that OpenSearch serverless will be running in'
        });

        template.hasParameter('SecurityGroupId', {
            Type: 'String',
            ConstraintDescription: 'Please provide a valid security group id',
            Description: 'The security group id that OpenSearch serverless will be associated with'
        });

        template.hasParameter('WriteRoleArn', {
            Type: 'String',
            AllowedPattern: '^arn:(aws|aws-cn|aws-us-gov):iam::\\d{12}:role\\/\\S+$',
            ConstraintDescription: 'Please provide a valid IAM Role Arn',
            Description: 'The role Arn which will write to the Kendra Index'
        });

        template.hasParameter('ReadRoleArn', {
            Type: 'String',
            AllowedPattern: '^arn:(aws|aws-cn|aws-us-gov):iam::\\d{12}:role\\/\\S+$',
            ConstraintDescription: 'Please provide a valid IAM Role Arn',
            Description: 'The role Arn which will query the Kendra Index'
        });
    });
});
