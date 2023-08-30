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
import { IConstruct } from 'constructs';
import { CfnResourceObserver } from '../govcloud/cfn-resource-observer';

/**
 * Aspect to generate conditions for GovCloud constraints. This aspect was created because of differences between
 * commercial and GovCloud partitions. Some of the key differences include, support of lambda runtime versions,
 * apigateway endpoints (global vs regional), absence of a cloudfront distribution in a govcloud partition.
 *
 * Applying the aspect helps modify the corresponding L1 construct of the resources during synthesis, without
 * modifying the original L2/L3 constructs defined in the respective stacks.
 */
export class AwsDeploymentPartitionAspects implements cdk.IAspect {
    /**
     * Map to store the govcloud condition check for each stack. The stack name is
     * the key to store the condition.
     */
    private stackCfnConditionMap: Map<string, cdk.CfnCondition>;

    /**
     * Map of observers to call when visiting a construct
     */
    private cfnObserverMap: Map<string, CfnResourceObserver[]>;

    constructor(cfnObserverMap: Map<string, CfnResourceObserver[]>) {
        this.stackCfnConditionMap = new Map<string, cdk.CfnCondition>();
        this.cfnObserverMap = cfnObserverMap;
    }

    public visit(node: IConstruct): void {
        const observers = this.cfnObserverMap.get(node.constructor.name);
        if (observers) {
            const stackName = this.checkOrCreateConditionForStack(cdk.Stack.of(node));
            observers.forEach((observer) => {
                observer.addConditionOnResource(node, this.stackCfnConditionMap.get(stackName)!);
            });
        }
    }

    /**
     * This function ensures that only one condition for govcloud is created at the stack level
     *
     * @param stack
     * @returns
     */
    private checkOrCreateConditionForStack(stack: cdk.Stack) {
        const stackName = stack.artifactId;

        // checks if the govcloud condition exists for the stack, if not then generate
        // the condition and register it in the Map with stack name as the key
        let partitionCfnCondition = this.stackCfnConditionMap.get(stackName);
        if (!partitionCfnCondition) {
            partitionCfnCondition = generateCfnConditionForPartition(stack);
            this.stackCfnConditionMap.set(stackName, partitionCfnCondition);
        }
        return stackName;
    }
}

function generateCfnConditionForPartition(node: IConstruct) {
    return new cdk.CfnCondition(cdk.Stack.of(node), 'isGovCloudPartition', {
        expression: cdk.Fn.conditionEquals(cdk.Aws.PARTITION, 'aws-us-gov')
    });
}
