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

import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as os from 'os';
import * as path from 'path';
import * as aslExtractor from '../cdk-to-asl';

import { Construct } from 'constructs';
import fs from 'fs';
import { COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME } from '../../../lib/utils/constants';

export class StepStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const helloFunction = new lambda.Function(this, 'MyLambdaFunction', {
            code: lambda.Code.fromInline(`
          exports.handler = (event, context, callback) => {
              callback(null, "Hello World!");
          };
      `),
            runtime: COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME,
            handler: 'index.handler',
            timeout: cdk.Duration.seconds(3)
        });

        new sfn.StateMachine(this, 'MyStateMachine', {
            definition: new tasks.LambdaInvoke(this, 'MyLambdaTask', {
                lambdaFunction: helloFunction
            }).next(new sfn.Succeed(this, 'GreetedWorld'))
        });
    }
}

describe('When extracting the ASL extraction from a stack', () => {
    let stack: cdk.Stack;

    const writeFileSpy = jest.spyOn(fs, 'writeFileSync');
    beforeAll(() => {
        const app = new cdk.App();
        stack = new StepStack(app, 'TestStack');
    });

    it('It should be able to extract the ASL definition', () => {
        const extractedAsls = aslExtractor.extractStateMachineAsls(stack);

        const expectedAslDefinition = {
            'StartAt': 'MyLambdaTask',
            'States': {
                'MyLambdaTask': {
                    'Next': 'GreetedWorld',
                    'Retry': [
                        {
                            'ErrorEquals': [
                                'Lambda.ClientExecutionTimeoutException',
                                'Lambda.ServiceException',
                                'Lambda.AWSLambdaException',
                                'Lambda.SdkClientException'
                            ],
                            'IntervalSeconds': 2,
                            'MaxAttempts': 6,
                            'BackoffRate': 2
                        }
                    ],
                    'Type': 'Task',
                    'Resource': 'arn:aws:states:::lambda:invoke',
                    'Parameters': { 'FunctionName': 'arn:aws:iam::123456789012:role:DummyRole', 'Payload.$': '$' }
                },
                'GreetedWorld': { 'Type': 'Succeed' }
            }
        };

        expect(extractedAsls.length).toEqual(1);
        expect(extractedAsls[0]).toEqual(JSON.stringify(expectedAslDefinition));
    });

    it('It should be able to save the extracted the ASL list', () => {
        const tmpOutputFile = path.join(os.tmpdir(), 'tmpExtractedAsl.json');
        const extractedAsls = aslExtractor.extractAndSaveAsls(stack, tmpOutputFile);

        expect(extractedAsls.length).toEqual(1);
        expect(writeFileSpy).toBeCalled();
    });

    it('It should throw error if file fails to be written', () => {
        const tmpOutputFile = path.join(os.tmpdir(), 'tmpExtractedAsl.json');

        writeFileSpy.mockImplementation(() => {
            throw new Error('Custom error');
        });

        try {
            aslExtractor.extractAndSaveAsls(stack, tmpOutputFile);
        } catch (error) {
            expect((error as Error).message).toEqual('Custom error');
        }
    });

    afterAll(() => {
        writeFileSpy.mockRestore();
        console.debug('done');
    });
});
