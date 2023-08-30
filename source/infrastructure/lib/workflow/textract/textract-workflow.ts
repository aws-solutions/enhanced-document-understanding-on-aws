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

import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';

import { Duration, NestedStack, NestedStackProps, Stack } from 'aws-cdk-lib';
import {
    COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME,
    EventSources,
    LAMBDA_TIMEOUT_MINS,
    S3_MULTI_PAGE_PDF_PREFIX,
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

export class TextractWorkflow extends NestedStack {
    public readonly workflowName: string;
    public readonly textractWorkflow: StandardWorkflow;
    public readonly stateMachine: StateMachine;
    public readonly nestedStackParams: NestedStackParameters;
    public readonly textractSNSRoleArn: string;

    constructor(scope: Construct, id: string, props?: NestedStackProps) {
        super(scope, id, props);

        this.workflowName = 'TextractWorkflow';
        this.nestedStackParams = new NestedStackParameters(Stack.of(this));

        const syncLambdaFunctionProps = {
            runtime: COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME,
            code: lambda.Code.fromAsset(
                '../lambda/text-extract/',
                AppAssetBundler.assetOptionsFactory
                    .assetOptions(COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME)
                    .options('../lambda/text-extract/')
            ),
            handler: 'textract-sync.handler',
            timeout: Duration.minutes(LAMBDA_TIMEOUT_MINS),
            environment: {
                // Must be a comma separated string to be parsed in the lambda
                // Following feature types are supported: `TABLES,FORMS,QUERIES,SIGNATURES`
                // QueriesConfig needs to be provided if using Queries
                DEFAULT_ANALYZE_DOC_FEATURE_TYPE: 'TABLES,FORMS,SIGNATURES',
                S3_MULTI_PAGE_PDF_PREFIX: S3_MULTI_PAGE_PDF_PREFIX,
                UUID: this.nestedStackParams.genUUID.valueAsString
            }
        };

        const textractSNSRole = new iam.Role(this, 'SnsPublishRole', {
            assumedBy: new iam.ServicePrincipal('textract.amazonaws.com')
        });
        this.textractSNSRoleArn = textractSNSRole.roleArn;

        const workflowProps: StandardWorkflowProps = {
            workflowName: this.workflowName,
            workflowType: WorkflowType.SYNC_ONLY,
            appNamespace: this.nestedStackParams.appNamespace.valueAsString,
            syncLambdaFunctionProps: syncLambdaFunctionProps,
            eventPatternCallback: this.textractSfnEventPatternCallback,
            inferenceBucketArn: this.nestedStackParams.syncInferenceS3BucketArn.valueAsString,
            caseTableArn: this.nestedStackParams.syncCaseTableArn.valueAsString,
            orchestratorBusArn: this.nestedStackParams.orchestratorBusArn.valueAsString,
            uploadBucketArn: this.nestedStackParams.uploadBucketArn.valueAsString,
            genUUID: this.nestedStackParams.genUUID.valueAsString
        };
        this.textractWorkflow = new StandardWorkflow(this, this.workflowName, workflowProps);

        // Grant necessary permissions and pass name of bucket to lambda for sync processing
        if (this.textractWorkflow.syncRequestTask) {
            this.textractWorkflow.uploadDocBucket!.grantRead(this.textractWorkflow.syncRequestTask.lambda);
            this.textractWorkflow.uploadDocBucket!.grantPut(
                this.textractWorkflow.syncRequestTask.lambda,
                `${S3_MULTI_PAGE_PDF_PREFIX}/*`
            );

            const textractSyncPolicy = new iam.Policy(this, 'TextractSyncPolicy', {
                statements: [
                    new iam.PolicyStatement({
                        actions: ['textract:DetectDocumentText', 'textract:AnalyzeDocument', 'textract:AnalyzeID'],
                        resources: ['*']
                    })
                ]
            });
            textractSyncPolicy.attachToRole(this.textractWorkflow.syncRequestTask?.lambda.role!);
            this.textractWorkflow.syncRequestTask.lambda.addEnvironment(
                'DOCUMENT_BUCKET_NAME',
                this.textractWorkflow.uploadDocBucket!.bucketName
            );

            NagSuppressions.addResourceSuppressions(textractSyncPolicy, [
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'Currently, Textract does not support resource level permissions',
                    appliesTo: ['Resource::*']
                }
            ]);
        }

        NagSuppressions.addResourceSuppressions(
            this.textractWorkflow.syncRequestTask?.lambda.role?.node.tryFindChild('DefaultPolicy') as iam.Policy,
            [
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'Giving the lambda role bucket read policy',
                    appliesTo: [
                        'Action::s3:GetBucket*',
                        'Action::s3:GetObject*',
                        'Action::s3:List*',
                        'Resource::<UploadBucketArn>/*',
                        `Resource::<UploadBucketArn>/${S3_MULTI_PAGE_PDF_PREFIX}/*`
                    ]
                }
            ]
        );
    }

    /**
     * This callback function will be used to create the event rule target
     * that will be used to trigger the Textract workflow step function.
     * The source is the orchestrator-lambda as it produces the events that
     * will be used to trigger the step functions.
     * @returns Returns the EventPattern object
     */
    textractSfnEventPatternCallback = (): EventPattern => {
        // the stepfunction must watch the 'stage' field in the event payload from the workflow-orchestrator
        // createEventForStepFunction function
        const eventPattern = {
            source: [`${EventSources.WORKFLOW_ORCHESTRATOR}.${this.nestedStackParams.appNamespace.valueAsString}`],
            detail: {
                case: { stage: [WorkflowStageNames.TEXTRACT], status: [WorkflowStatus.INITIATE] }
            }
        } as EventPattern;
        return eventPattern;
    };
}
