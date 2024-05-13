#!/usr/bin/env node
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
import * as api from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';

import { Construct, IConstruct } from 'constructs';

import { NagSuppressions } from 'cdk-nag';
import { KendraCaseStorage } from './kendra-case-storage';

/**
 * The parameters to select Indexed Storage options
 */
export class IndexedStorageParams {
    public readonly deployKendraIndex: cdk.CfnParameter;

    constructor(stack: IConstruct) {
        this.deployKendraIndex = new cdk.CfnParameter(stack, 'DeployKendraIndex', {
            type: 'String',
            allowedValues: ['Yes', 'No'],
            allowedPattern: '^(Yes|No)$',
            description:
                'Please select if you would like to deploy Amazon Kendra Index. For more details, refer to the implementation guide for this solution',
            constraintDescription: 'Please select either Yes or No',
            default: 'No'
        });
    }
}

export interface IndexedStorageProps {
    /**
     * The 8-character UUID to add to resource names to ensure they are unique across deployments
     */
    genUUID: string;

    /**
     * The role Arn that can write to the indexed storages (Kendra Index)
     */
    roleArn: string;

    /**
     * The lambda function Arn that can query the indexed storages (Kendra Index)
     */
    searchLambda: lambda.Function;

    /**
     * The root resource of the API Gateway, received from request processor
     */
    apiRootResource: api.IResource;

    /**
     * Cognito external authorizer for external users
     */
    extUsrAuthorizer: api.CognitoUserPoolsAuthorizer;

    /**
     * Cognito external user pool id used to create ACL for kendra index
     */
    extUserPoolId: string;

    /**
     * Document Bucket Name to be used to add policy to allow Kendra Index to access the bucket
     */
    documentBucketName: string;
}

/**
 * A construct that provisions indexed storage options using Kendra
 */
export class IndexedStorage extends Construct {
    /**
     * Kendra index creation
     */
    public readonly kendraCaseSearch: KendraCaseStorage;

    /**
     * Condition that indicates if Kendra index should be created
     */
    public readonly deployKendraIndexCondition: cdk.CfnCondition;

    /**
     * The value that indicates if Kendra index should be created
     */
    public readonly isKendraDeployed: string;

    constructor(scope: Construct, id: string, props: IndexedStorageProps) {
        super(scope, id);

        const parameters = new IndexedStorageParams(cdk.Stack.of(this));

        this.kendraCaseSearch = new KendraCaseStorage(this, 'KendraCaseSearch', {
            parameters: {
                QueryCapacityUnits: '0',
                StorageCapacityUnits: '0',
                RoleArn: props.roleArn,
                QueryLambdaRoleArn: props.searchLambda.role!.roleArn,
                DocumentBucketName: props.documentBucketName,
                ExtUserPoolId: props.extUserPoolId
            },
            description: 'Nested Stack that creates the Kendra Index'
        });

        this.deployKendraIndexCondition = new cdk.CfnCondition(this, 'DeployKendraIndexCondition', {
            expression: cdk.Fn.conditionEquals(parameters.deployKendraIndex, 'Yes')
        });
        this.kendraCaseSearch.nestedStackResource!.cfnOptions.condition = this.deployKendraIndexCondition;

        const kendraSearchLambdaIntegration = new api.LambdaIntegration(props.searchLambda, {
            passthroughBehavior: api.PassthroughBehavior.NEVER
        });

        const kendraSearchResource = props.apiRootResource
            .addResource('search')
            .addResource('kendra')
            .addResource('{query}');
        kendraSearchResource.addCorsPreflight({
            allowOrigins: ['*'],
            allowHeaders: [
                'Content-Type, Access-Control-Allow-Headers, X-Requested-With, Authorization',
                'Access-Control-Allow-Origin'
            ],
            allowMethods: ['GET']
        });

        kendraSearchResource.addMethod('GET', kendraSearchLambdaIntegration, {
            authorizer: props.extUsrAuthorizer,
            authorizationType: api.AuthorizationType.COGNITO
        });

        this.isKendraDeployed = parameters.deployKendraIndex.valueAsString;

        props.searchLambda.addEnvironment(
            'KENDRA_INDEX_ID',
            cdk.Fn.conditionIf(
                this.deployKendraIndexCondition.logicalId,
                this.kendraCaseSearch.kendraCaseSearchIndex.attrId,
                cdk.Aws.NO_VALUE
            ).toString()
        );

        NagSuppressions.addResourceSuppressionsByPath(
            cdk.Stack.of(this),
            `${props.apiRootResource}/search/kendra/{query}/OPTIONS/Resource`,
            [
                {
                    id: 'AwsSolutions-APIG4',
                    reason: 'The OPTIONS method cannot use auth as the server has to respond to the OPTIONS request for cors reasons'
                },
                {
                    id: 'AwsSolutions-COG4',
                    reason: 'The OPTIONS method cannot use auth as the server has to respond to the OPTIONS request for cors reasons'
                }
            ],
            false
        );
    }

    public updateLambdaEnvironmentVariables(lambda: lambda.Function) {
        lambda.addEnvironment(
            'KENDRA_INDEX_ID',
            cdk.Fn.conditionIf(
                this.deployKendraIndexCondition.logicalId,
                this.kendraCaseSearch.kendraCaseSearchIndex.attrId,
                cdk.Aws.NO_VALUE
            ).toString()
        );
        lambda.addEnvironment(
            'KENDRA_ROLE_ARN',
            cdk.Fn.conditionIf(
                this.deployKendraIndexCondition.logicalId,
                this.kendraCaseSearch.kendraRoleArn,
                cdk.Aws.NO_VALUE
            ).toString()
        );
    }
}
