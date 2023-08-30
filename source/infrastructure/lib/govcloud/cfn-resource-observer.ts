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
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NagSuppressions } from 'cdk-nag';
import { IConstruct } from 'constructs';
import { LambdaRuntimeCommandFactory } from '../utils/lambda-runtimes';

export interface CfnResourceObserver {
    /**
     * Listener method to add condition on resource for govcloud
     *
     * @param cfnResource - the resource in context to be modified
     * @param condition - the condition to be checked for specific properties on the resource
     */
    addConditionOnResource(resource: IConstruct, condition: cdk.CfnCondition): void;
}

/**
 * Observer to add conditions for runtime configurations for govcloud
 */
export class LambdaRuntimeResourceObserver implements CfnResourceObserver {
    /**
     * Stores the LambdaRuntimeCommandFactory once per stack with stack name as key. Each
     * LambdaRuntimeCommandFactory accepts the govcloud condition to be referenced for adding the
     * necessary `If` conditions to the resources in a stack (root or nested)
     */
    private stackCommandFactoryMap: Map<string, LambdaRuntimeCommandFactory>;

    constructor() {
        this.stackCommandFactoryMap = new Map<string, LambdaRuntimeCommandFactory>();
    }

    addConditionOnResource(resource: IConstruct, condition: cdk.CfnCondition): void {
        if (resource instanceof lambda.Function) {
            const stackName = cdk.Stack.of(resource).artifactId;

            // for lambda functions get the LambdaRuntimeFactory for each stack. This factory
            // provides appropriate runtime command to add necessary condition. If the factory
            // one does not exist it will create one and register it in the Map.
            let lambdaRuntimeCommandFactory = this.stackCommandFactoryMap.get(stackName);
            if (!lambdaRuntimeCommandFactory) {
                lambdaRuntimeCommandFactory = new LambdaRuntimeCommandFactory(condition);
                this.stackCommandFactoryMap.set(stackName, lambdaRuntimeCommandFactory);
            }

            const cfnLambda = resource.node.defaultChild as lambda.CfnFunction;
            cfnLambda.runtime = lambdaRuntimeCommandFactory
                .getRuntimeCommand(resource.runtime.family!)
                .getLambdaRuntime();

            NagSuppressions.addResourceSuppressions(cfnLambda, [
                {
                    id: 'CdkNagValidationFailure',
                    reason: 'The CloudFormation Conditions are added as CDK Aspects and hence causing validation error during synthesis'
                }
            ]);
        }
    }
}

/**
 * Observer to not deploy s3 backed CloudFront UI if it is in govcloud
 */
export class S3WebResourceObserver implements CfnResourceObserver {
    addConditionOnResource(resource: IConstruct, condition: cdk.CfnCondition): void {
        if (resource instanceof cdk.CfnStack && resource.logicalId.includes('S3UI')) {
            // if its a stack that uses s3 with cloudfront, do not deploy the stack if it is in govcloud
            const existingCondition = resource.cfnOptions.condition;
            if (existingCondition) {
                resource.cfnOptions.condition = new cdk.CfnCondition(cdk.Stack.of(resource), 'DeployS3Web', {
                    expression: cdk.Fn.conditionAnd(existingCondition, cdk.Fn.conditionNot(condition))
                });
            } else {
                resource.cfnOptions.condition = condition;
            }
        }
    }
}

/**
 * Observer for API Gateway endpoint type resource to change endpoint type
 */
export class ApiGatewayEndpointTypeResourceObserver implements CfnResourceObserver {
    addConditionOnResource(resource: IConstruct, stackCfnCondition: cdk.CfnCondition): void {
        if (resource instanceof api.CfnRestApi) {
            if (resource.endpointConfiguration!.hasOwnProperty('types')) {
                const endpointConfiguration: any = resource.endpointConfiguration;
                if (endpointConfiguration.types.includes(api.EndpointType.EDGE)) {
                    resource.endpointConfiguration = {
                        types: [
                            cdk.Fn.conditionIf(
                                stackCfnCondition.logicalId,
                                api.EndpointType.REGIONAL,
                                api.EndpointType.EDGE
                            ).toString()
                        ]
                    };
                }
            }
        }
    }
}

/**
 * Observer to overwrite the advanced security mode for cognito user pool conditionally when deploying it in govcloud
 */
export class CognitoUserPoolAdvancedSecurityModeObserver implements CfnResourceObserver {
    addConditionOnResource(resource: IConstruct, stackCfnCondition: cdk.CfnCondition): void {
        if (
            resource instanceof cognito.CfnUserPool &&
            resource.userPoolAddOns &&
            resource.userPoolAddOns.hasOwnProperty('advancedSecurityMode')
        ) {
            let userPoolAddOns: any = resource.userPoolAddOns;
            if (
                userPoolAddOns.advancedSecurityMode === cognito.AdvancedSecurityMode.ENFORCED ||
                userPoolAddOns.advancedSecurityMode === cognito.AdvancedSecurityMode.AUDIT
            ) {
                const existingSecurityMode = userPoolAddOns.advancedSecurityMode;
                resource.addDeletionOverride('UserPoolAddOns');
                resource.addPropertyOverride(
                    'UserPoolAddOns',
                    cdk.Fn.conditionIf(stackCfnCondition.logicalId, cdk.Aws.NO_VALUE, {
                        AdvancedSecurityMode: existingSecurityMode
                    }).toString()
                );
            }
        }
    }
}
