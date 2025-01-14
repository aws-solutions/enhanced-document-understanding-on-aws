// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as constants from '../../utils/constants';
import * as defaults from '@aws-solutions-constructs/core';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as task from 'aws-cdk-lib/aws-stepfunctions-tasks';

import { DeadLetterQueue, Queue, QueueProps } from 'aws-cdk-lib/aws-sqs';
import {
    INextable,
    IntegrationPattern,
    JsonPath,
    State,
    StateMachine,
    StateMachineFragment,
    TaskInput,
    Timeout
} from 'aws-cdk-lib/aws-stepfunctions';

import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import { NagSuppressions } from 'cdk-nag';
import { SqsEventSourceProps } from 'aws-cdk-lib/aws-lambda-event-sources';
import { SqsToLambda } from '@aws-solutions-constructs/aws-sqs-lambda';

export interface StepFunctionCallbackProps {
    /**
     * Existing instance of Lambda Function object, providing both this and `lambdaFunctionProps`
     * will cause an error.
     *
     * @default - None
     */
    readonly existingLambdaObj?: lambda.Function;
    /**
     * User provided props to override the default props for the Lambda function.
     *
     * @default - Default properties are used.
     */
    readonly lambdaFunctionProps?: lambda.FunctionProps;
    /**
     * Existing instance of SQS queue object, Providing both this and queueProps will cause an error.
     *
     * @default - Default props are used
     */
    readonly existingQueueObj?: Queue;
    /**
     * Optional user-provided props to override the default props for the SQS queue.
     *
     * @default - Default props are used
     */
    readonly queueProps?: QueueProps;
    /**
     * Optional user provided properties for the dead letter queue
     *
     * @default - Default props are used
     */
    readonly deadLetterQueueProps?: QueueProps;
    /**
     * Whether to deploy a secondary queue to be used as a dead letter queue.
     *
     * @default - true.
     */
    readonly deployDeadLetterQueue?: boolean;
    /**
     * The number of times a message can be unsuccessfully dequeued before being moved to the dead-letter queue.
     *
     * @default - required field if deployDeadLetterQueue=true.
     */
    readonly maxReceiveCount?: number;
    /**
     * Optional user provided properties for Sqs event source
     *
     * @default - Default props are used
     */
    readonly sqsEventSourceProps?: SqsEventSourceProps;
    /**
     * Optional user provided properties to create an SQS based stepfunction task
     *
     * @default - None
     */
    readonly sqsSendMessageProps?: Partial<task.SqsSendMessageProps>;
    /**
     * Optional user provided state machine that the lambda function can sendTaskResponse. This role policy of
     * the lambda function will be restricted to be able to send the response token only to the provided state
     * machine. If the parameter is not supplied, the lambda role policy for sending the task token response
     * will contain '*' in the resources section
     *
     * @default - None
     */
    readonly stateMachine?: StateMachine;
}

export class StepFunctionCallback extends StateMachineFragment {
    /**
     * Creates a step function task that sends messages to a sqs queue, which is received by
     * a LambdaFunction, which sends a tasktoken as for a callback
     */
    public readonly sqsQueue: Queue;
    public readonly deadLetterQueue: DeadLetterQueue | undefined;
    public readonly startState: State;
    public readonly endStates: INextable[];
    public readonly lambda: lambda.Function;

    constructor(scope: Construct, id: string, props: StepFunctionCallbackProps) {
        super(scope, id);

        // define the sqs to lambda construct
        const _sqsLambda = new SqsToLambda(this, 'Task', {
            lambdaFunctionProps: props.lambdaFunctionProps,
            existingLambdaObj: props.existingLambdaObj,
            queueProps: props.queueProps,
            existingQueueObj: props.existingQueueObj,
            deadLetterQueueProps: props.deadLetterQueueProps,
            maxReceiveCount: props.maxReceiveCount,
            sqsEventSourceProps: props.sqsEventSourceProps
        });

        const _defaultSqsSendMessageProps: task.SqsSendMessageProps = {
            queue: _sqsLambda.sqsQueue,
            messageBody: TaskInput.fromObject({
                'input': JsonPath.stringAt('$'),
                'taskToken': JsonPath.taskToken
            }),
            integrationPattern: IntegrationPattern.WAIT_FOR_TASK_TOKEN,
            resultPath: '$',
            heartbeatTimeout: Timeout.duration(Duration.minutes(constants.SFN_TASK_TIMEOUT_MINS)),
            taskTimeout: Timeout.duration(Duration.minutes(constants.SFN_TASK_TIMEOUT_MINS))
        };

        const _sqsSendMessageProps =
            props.sqsSendMessageProps !== undefined
                ? defaults.overrideProps(
                      _defaultSqsSendMessageProps,
                      props.sqsSendMessageProps as task.SqsSendMessageProps
                  )
                : _defaultSqsSendMessageProps;

        const _queueTask = new task.SqsSendMessage(this, `${id}SendMessage`, _sqsSendMessageProps);

        _queueTask.addRetry({
            backoffRate: 2,
            maxAttempts: 6,
            interval: Duration.seconds(3)
        });
        // NOTE: if we fail after rerties, the calling stepfunction (at the workflow level) will catch the error and fail from there

        this.startState = _queueTask;
        this.endStates = [_queueTask];
        this.sqsQueue = _sqsLambda.sqsQueue;
        this.lambda = _sqsLambda.lambdaFunction;
        this.deadLetterQueue = _sqsLambda.deadLetterQueue;

        // attach IAM role to let lamda call stepfunction state machine if available
        // if statemachine not provided then lambda defaults to '*' permissions.

        if (props.stateMachine !== undefined) {
            // role cannot be undefined or null
            props.stateMachine.grantTaskResponse(this.lambda.role!);
        } else {
            const _lambdaStateMachineTaskPolicy = new iam.Policy(this, 'LambdaStateMachineTask', {
                statements: [
                    new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        actions: ['states:SendTaskSuccess', 'states:SendTaskFailure', 'states:SendTaskHeartbeat'],
                        resources: ['*']
                    })
                ]
            });
            _lambdaStateMachineTaskPolicy.attachToRole(_sqsLambda.lambdaFunction.role!);

            //add cfn nag suppression
            (_lambdaStateMachineTaskPolicy.node.defaultChild as iam.CfnPolicy).addMetadata('cfn_nag', {
                rules_to_suppress: [
                    {
                        id: 'W12',
                        reason: 'State machine resource not available, hence defaulting to "*"'
                    }
                ]
            });

            NagSuppressions.addResourceSuppressions(_lambdaStateMachineTaskPolicy, [
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'State machine resource not available, hence defaulting to "*"',
                    appliesTo: ['Resource::*']
                }
            ]);
        }

        if (this.deadLetterQueue) {
            NagSuppressions.addResourceSuppressions(this.deadLetterQueue.queue, [
                {
                    id: 'AwsSolutions-SQS3',
                    reason: 'Resource is a DLQ'
                }
            ]);
        }

        NagSuppressions.addResourceSuppressions(this.lambda.role!, [
            {
                id: 'AwsSolutions-IAM5',
                reason: 'The ARN of the callback is not avilable at the moment of assigning this policy',
                appliesTo: [
                    'Resource::arn:<AWS::Partition>:logs:<AWS::Region>:<AWS::AccountId>:log-group:/aws/lambda/*'
                ]
            }
        ]);

        NagSuppressions.addResourceSuppressions(this.lambda.role!.node.tryFindChild('DefaultPolicy') as iam.Policy, [
            {
                id: 'AwsSolutions-IAM5',
                reason: 'The ARN of the callback is not available at the moment of assigning this policy',
                appliesTo: ['Resource::*']
            }
        ]);
    }
}
