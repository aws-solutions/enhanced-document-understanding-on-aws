#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';

import { Duration, NestedStack, NestedStackProps, Stack } from 'aws-cdk-lib';
import {
    COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME,
    EventSources,
    LAMBDA_TIMEOUT_MINS,
    WorkflowStageNames,
    WorkflowStatus,
    WorkflowType
} from '../../utils/constants';
import { StandardWorkflow, StandardWorkflowProps } from '../standard/standard-workflow';

import { EventPattern } from 'aws-cdk-lib/aws-events';
import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { NagSuppressions } from 'cdk-nag';
import { Construct } from 'constructs';
import { AppAssetBundler } from '../../utils/asset-bundling';
import { NestedStackParameters } from '../../utils/nested-stack-parameters';

export class EntityDetectionWorkflow extends NestedStack {
    public readonly workflowName: string;
    public readonly entityDetectionWorkflow: StandardWorkflow;
    public readonly stateMachine: StateMachine;
    public readonly nestedStackParams: NestedStackParameters;
    public readonly comprehendS3RoleArn: string;

    constructor(scope: Construct, id: string, props?: NestedStackProps) {
        super(scope, id, props);

        this.workflowName = 'EntityDetectionWorkflow';
        this.nestedStackParams = new NestedStackParameters(Stack.of(this));

        const syncLambdaFunctionProps: lambda.FunctionProps = {
            runtime: COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME,
            code: lambda.Code.fromAsset(
                '../lambda/entity-detection/',
                AppAssetBundler.assetOptionsFactory
                    .assetOptions(COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME)
                    .options('../lambda/entity-detection/')
            ),
            handler: 'entity-detection-sync.handler',
            timeout: Duration.minutes(LAMBDA_TIMEOUT_MINS),
            environment: {
                UUID: this.nestedStackParams.genUUID.valueAsString
            }
        };

        const workflowProps: StandardWorkflowProps = {
            workflowName: this.workflowName,
            workflowType: WorkflowType.SYNC_ONLY,
            appNamespace: this.nestedStackParams.appNamespace.valueAsString,
            syncLambdaFunctionProps: syncLambdaFunctionProps,
            orchestratorBusArn: this.nestedStackParams.orchestratorBusArn.valueAsString,
            genUUID: this.nestedStackParams.genUUID.valueAsString,
            uploadBucketArn: this.nestedStackParams.uploadBucketArn.valueAsString,
            inferenceBucketArn: this.nestedStackParams.syncInferenceS3BucketArn.valueAsString,
            caseTableArn: this.nestedStackParams.syncCaseTableArn.valueAsString,
            eventPatternCallback: this.EntityDetectionEventPatternCallback
        };

        this.entityDetectionWorkflow = new StandardWorkflow(this, this.workflowName, workflowProps);

        if (this.entityDetectionWorkflow.syncRequestTask) {
            const entityDetectionSyncPolicy = new iam.Policy(this, 'EntityDetectionSyncPolicy', {
                statements: [
                    new iam.PolicyStatement({
                        actions: [
                            'comprehend:DetectEntities',
                            'comprehend:DetectPiiEntities',
                            'comprehendmedical:DetectEntitiesV2'
                        ],
                        resources: ['*']
                    })
                ]
            });
            entityDetectionSyncPolicy.attachToRole(this.entityDetectionWorkflow.syncRequestTask?.lambda.role!);

            NagSuppressions.addResourceSuppressions(entityDetectionSyncPolicy, [
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'There are no resource level permissions for the comprehend actions specified',
                    appliesTo: ['Resource::*']
                }
            ]);
        }
    }

    EntityDetectionEventPatternCallback = (): EventPattern => {
        // the stepfunction must watch the 'stage' field in the event payload from the workflow-orchestrator
        // createEventForStepFunction function
        const eventPattern = {
            source: [`${EventSources.WORKFLOW_ORCHESTRATOR}.${this.nestedStackParams.appNamespace.valueAsString}`],
            detail: {
                case: {
                    stage: [WorkflowStageNames.ENTITY, WorkflowStageNames.MEDICAL_ENTITY, WorkflowStageNames.PII],
                    status: [WorkflowStatus.INITIATE]
                }
            }
        } as EventPattern;
        return eventPattern;
    };
}
