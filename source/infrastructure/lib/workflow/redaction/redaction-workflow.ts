// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';

import { Duration, NestedStack, NestedStackProps, Stack } from 'aws-cdk-lib';
import {
    COMMERCIAL_REGION_LAMBDA_JAVA_RUNTIME,
    EventSources,
    JAVA_LAMBDA_MEMORY,
    LAMBDA_TIMEOUT_MINS,
    S3_REDACTED_PREFIX,
    S3_UPLOAD_PREFIX,
    WorkflowStageNames,
    WorkflowStatus,
    WorkflowType
} from '../../utils/constants';

import { EventPattern } from 'aws-cdk-lib/aws-events';
import { NagSuppressions } from 'cdk-nag';
import { Construct } from 'constructs';
import { AppAssetBundler } from '../../utils/asset-bundling';
import { NestedStackParameters } from '../../utils/nested-stack-parameters';
import { StandardWorkflow } from '../standard/standard-workflow';

export class RedactionWorkflow extends NestedStack {
    public readonly workflowName: string;
    public readonly redactionWorkflow: StandardWorkflow;
    public readonly nestedStackParams: NestedStackParameters;

    constructor(scope: Construct, id: string, props?: NestedStackProps) {
        super(scope, id, props);

        this.workflowName = 'RedactionWorkflow';
        this.nestedStackParams = new NestedStackParameters(Stack.of(this));

        const syncLambdaFunctionProps: lambda.FunctionProps = {
            runtime: COMMERCIAL_REGION_LAMBDA_JAVA_RUNTIME,
            handler: 'com.builder.lambda.RedactionSfnHandler',
            code: lambda.Code.fromAsset(
                '../lambda/redact-content',
                AppAssetBundler.assetOptionsFactory
                    .assetOptions(COMMERCIAL_REGION_LAMBDA_JAVA_RUNTIME)
                    .options('../lambda/redact-content/')
            ),
            timeout: Duration.minutes(LAMBDA_TIMEOUT_MINS),
            memorySize: JAVA_LAMBDA_MEMORY,
            environment: {
                UUID: this.nestedStackParams.genUUID.valueAsString
            }
        };

        const standardWorkflowProps = {
            syncLambdaFunctionProps: syncLambdaFunctionProps,
            workflowType: WorkflowType.SYNC_ONLY,
            workflowName: this.workflowName,
            appNamespace: this.nestedStackParams.appNamespace.valueAsString,
            orchestratorBusArn: this.nestedStackParams.orchestratorBusArn.valueAsString,
            genUUID: this.nestedStackParams.genUUID.valueAsString,
            inferenceBucketArn: this.nestedStackParams.syncInferenceS3BucketArn.valueAsString,
            caseTableArn: this.nestedStackParams.syncCaseTableArn.valueAsString,
            uploadBucketArn: this.nestedStackParams.uploadBucketArn.valueAsString,
            eventPatternCallback: this.RedactionEventPatternCallback
        };

        // create the redaction workflow
        this.redactionWorkflow = new StandardWorkflow(this, this.workflowName, standardWorkflowProps);

        // Grant r/w permissions and pass name of bucket/needed prefixes to lambda since redaction writes to the S3 bucket unlike other sync workflows
        if (this.redactionWorkflow.syncRequestTask) {
            this.redactionWorkflow.uploadDocBucket!.grantReadWrite(this.redactionWorkflow.syncRequestTask.lambda);
            this.redactionWorkflow.syncRequestTask.lambda.addEnvironment(
                'DOCUMENT_BUCKET_NAME',
                this.redactionWorkflow.uploadDocBucket!.bucketName
            );
            this.redactionWorkflow.syncRequestTask.lambda.addEnvironment('S3_UPLOAD_PREFIX', S3_UPLOAD_PREFIX);
            this.redactionWorkflow.syncRequestTask.lambda.addEnvironment('S3_REDACTED_PREFIX', S3_REDACTED_PREFIX);

            NagSuppressions.addResourceSuppressions(
                this.redactionWorkflow.syncRequestTask?.lambda.role!.node.tryFindChild('DefaultPolicy') as iam.Policy,
                [
                    {
                        id: 'AwsSolutions-IAM5',
                        reason: 'The lambda requires access to the s3 bucket to read and write',
                        appliesTo: [
                            'Action::s3:Abort*',
                            'Action::s3:DeleteObject*',
                            'Action::s3:GetBucket*',
                            'Action::s3:GetObject*',
                            'Action::s3:List*',
                            'Resource::<UploadBucketArn>/*'
                        ]
                    }
                ]
            );
        }
    }

    RedactionEventPatternCallback = (): EventPattern => {
        // the stepfunction must watch the 'stage' field in the event payload from the workflow-orchestrator
        // createEventForStepFunction function
        const eventPattern = {
            source: [`${EventSources.WORKFLOW_ORCHESTRATOR}.${this.nestedStackParams.appNamespace.valueAsString}`],
            detail: {
                case: {
                    stage: [WorkflowStageNames.REDACTION],
                    status: [WorkflowStatus.INITIATE]
                }
            }
        } as EventPattern;
        return eventPattern;
    };
}
