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

import { Template } from 'aws-cdk-lib/assertions';
import { writeFileSync } from 'fs';

const AWS_PARTITION = process.env.AWS_PARTITION || 'aws';
const AWS_URL_SUFFIX = process.env.AWS_URL_SUFFIX || 'amazonaws.com';

// ref: https://github.com/nathanagez/aws-cdk-state-machine-asl
export const extractStateMachineAsls = (stack: cdk.Stack) => {
    // default empty resource object
    const { Resources: resources = {} } = Template.fromStack(stack).toJSON();

    const stateMachineResources = Object.keys(resources)
        .filter((resourceKey) => {
            const resource = resources[resourceKey];
            return resource && resource.Type === 'AWS::StepFunctions::StateMachine';
        })
        .map((resource) => resources[resource]);

    return stateMachineResources.map((resource) => {
        const definitionString = resource.Properties.DefinitionString;
        const [delimiter, values] = definitionString['Fn::Join'];
        const resolvedExpressions = resolveExpressions(values);
        return resolvedExpressions.join(delimiter);
    });
};

export const extractAndSaveAsls = (stack: cdk.Stack, filepath?: string) => {
    const stateMachineAsls = extractStateMachineAsls(stack);
    const outputFile = filepath ? filepath : './extractedAsls.json';

    try {
        writeFileSync(outputFile, JSON.stringify(stateMachineAsls, null, 2), 'utf-8');
        return stateMachineAsls;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const resolveExpressions = (expressions: any) => {
    const resolvers = [
        {
            name: 'Ref',
            resolve: ref
        },
        {
            name: 'Fn::GetAtt',
            resolve: fnGetAtt
        }
    ];
    return expressions.map((expression: any) => {
        if (typeof expression === 'string') return expression;

        for (const resolver of resolvers) {
            if (Object.prototype.hasOwnProperty.call(expression, resolver.name)) {
                return resolver.resolve(expression[resolver.name]);
            }
        }
        return expression;
    });
};

const fnGetAtt = (expression: any) => {
    return expression[1] && expression[1] === 'Arn' ? defaultArn() : expression.join('', expression);
};

const defaultArn = (): string => {
    return 'arn:aws:iam::123456789012:role:DummyRole';
};

const ref = (value: any) => {
    switch (value) {
        case 'AWS::Partition':
            return AWS_PARTITION;
        case 'AWS::URLSuffix':
            return AWS_URL_SUFFIX;
        default:
            return value; // unresolved
    }
};
