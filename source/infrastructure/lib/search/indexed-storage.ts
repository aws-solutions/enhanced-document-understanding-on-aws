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

import { Construct } from 'constructs';

import { NagSuppressions } from 'cdk-nag';
import { KendraCaseStorage } from './kendra-case-storage';
import { OpenSearchCaseStorage } from './open-search-case-storage';
import { IndexedStorageParams } from './indexed-storage-params';

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

    /**
     * ID of the security group that workflow orchestrator runs in, in order to access the OpenSearch serverless collections.
     */
    securityGroupId: string;

    /**
     * ID of the vpc that workflow orchestrator runs in.
     */
    vpcId: string;

    /**
     * IDs of the private subnets that workflow orchestrator runs in.
     */
    privateSubnetIds: string[];

    /**
     * Parameters for Kendra and OpenSearch
     */

    indexStorageParameters: IndexedStorageParams;
}

/**
 * A construct that provisions indexed storage options using Kendra
 */
export class IndexedStorage extends Construct {
    /**
     * OpenSearch serverless creation
     */
    public readonly openSearchCaseStorage: OpenSearchCaseStorage;

    /**
     * Kendra index creation
     */
    public readonly kendraCaseSearch: KendraCaseStorage;

    constructor(scope: Construct, id: string, props: IndexedStorageProps) {
        super(scope, id);

        this.openSearchCaseStorage = new OpenSearchCaseStorage(this, 'openSearchCaseSearch', {
            parameters: {
                VpcId: props.vpcId,
                SubnetIds: props.privateSubnetIds.join(','),
                SecurityGroupId: props.securityGroupId,
                WriteRoleArn: props.roleArn,
                ReadRoleArn: props.searchLambda.role!.roleArn
            }
        });

        this.openSearchCaseStorage.nestedStackResource!.cfnOptions.condition =
            props.indexStorageParameters.deployOpenSearchIndexCondition;

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

        this.kendraCaseSearch.nestedStackResource!.cfnOptions.condition =
            props.indexStorageParameters.deployKendraIndexCondition;

        const searchLambdaIntegration = new api.LambdaIntegration(props.searchLambda, {
            passthroughBehavior: api.PassthroughBehavior.NEVER
        });

        const searchResource = props.apiRootResource.addResource('search');

        const kendraSearchResource = searchResource.addResource('kendra').addResource('{query}');
        kendraSearchResource.addCorsPreflight({
            allowOrigins: ['*'],
            allowHeaders: [
                'Content-Type, Access-Control-Allow-Headers, X-Requested-With, Authorization',
                'Access-Control-Allow-Origin'
            ],
            allowMethods: ['GET']
        });

        const openSearchResource = searchResource.addResource('opensearch').addResource('{query}');
        openSearchResource.addCorsPreflight({
            allowOrigins: ['*'],
            allowHeaders: ['*'],
            allowMethods: ['GET']
        });

        kendraSearchResource.addMethod('GET', searchLambdaIntegration, {
            authorizer: props.extUsrAuthorizer,
            authorizationType: api.AuthorizationType.COGNITO
        });
        openSearchResource.addMethod('GET', searchLambdaIntegration, {
            authorizer: props.extUsrAuthorizer,
            authorizationType: api.AuthorizationType.COGNITO
        });

        props.searchLambda.addEnvironment(
            'KENDRA_INDEX_ID',
            cdk.Fn.conditionIf(
                props.indexStorageParameters.deployKendraIndexCondition.logicalId,
                this.kendraCaseSearch.kendraCaseSearchIndex.attrId,
                cdk.Aws.NO_VALUE
            ).toString()
        );
        props.searchLambda.addEnvironment(
            'OS_COLLECTION_ENDPOINT',
            cdk.Fn.conditionIf(
                props.indexStorageParameters.deployOpenSearchIndexCondition.logicalId,
                this.openSearchCaseStorage.collection.attrCollectionEndpoint,
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

        NagSuppressions.addResourceSuppressionsByPath(
            cdk.Stack.of(this),
            `${props.apiRootResource}/search/opensearch/{query}/OPTIONS/Resource`,
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

    public updateLambdaEnvironmentVariables(
        lambda: lambda.Function,
        deployKendraIndexCondition: cdk.CfnCondition,
        deployOpenSearchIndexCondition: cdk.CfnCondition
    ) {
        lambda.addEnvironment(
            'KENDRA_INDEX_ID',
            cdk.Fn.conditionIf(
                deployKendraIndexCondition.logicalId,
                this.kendraCaseSearch.kendraCaseSearchIndex.attrId,
                cdk.Aws.NO_VALUE
            ).toString()
        );
        lambda.addEnvironment(
            'KENDRA_ROLE_ARN',
            cdk.Fn.conditionIf(
                deployKendraIndexCondition.logicalId,
                this.kendraCaseSearch.kendraRoleArn,
                cdk.Aws.NO_VALUE
            ).toString()
        );
        lambda.addEnvironment(
            'OS_COLLECTION_ENDPOINT',
            cdk.Fn.conditionIf(
                deployOpenSearchIndexCondition.logicalId,
                this.openSearchCaseStorage.collection.attrCollectionEndpoint,
                cdk.Aws.NO_VALUE
            ).toString()
        );
    }
}
