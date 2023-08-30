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

import {
    DEFAULT_WORKFLOW_CONFIG_NAME,
    EventSources,
    KENDRA_INDEX_ID_ENV_VAR,
    PLACEHOLDER_EMAIL,
    USER_POOL_ID_ENV_VAR,
    REST_API_NAME_ENV_VAR,
    WorkflowStatus,
    STACK_UUID_ENV_VAR
} from './utils/constants';

import { CfnParameter } from 'aws-cdk-lib';
import { Rule } from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';
import { RequestProcessor } from './api/request-processor';
import { ApplicationSetup } from './application-setup';
import { NotificationManager } from './notifications/notification-manager';
import { SampleDocuments } from './samples/copy-samples';
import { IndexedStorage } from './search/indexed-storage';
import { UIInfrastructure } from './ui-infrastructure';
import { extractWorkflowConfigNames, generateSourceCodeMapping } from './utils/common-utils';
import { EntityDetectionWorkflow } from './workflow/entity-detection/entity-detection-workflow';
import { RedactionWorkflow } from './workflow/redaction/redaction-workflow';
import { TextractWorkflow } from './workflow/textract/textract-workflow';
import { UIAssets } from '../lib/s3web/ui-asset';

export interface DusStackProps extends cdk.StackProps {
    /**
     * The ID associated with the solution
     */
    solutionID: string;
    /**
     * The version of the solution being deployed
     */
    solutionVersion: string;
    /**
     * registered trademark name of the solution
     */
    solutionName: string;
    /**
     * The namespace used by the solution by event orchestration
     */
    appNamespace: string;
    /**
     * The trademark name of the solution
     */
    applicationTrademarkName: string;
}

/**
 * The main stack creating the infrastructure
 */
export class DusStack extends cdk.Stack {
    public readonly requestProcessor: RequestProcessor;
    public readonly textractWorkflow: TextractWorkflow;
    public readonly redactionWorkflow: RedactionWorkflow;
    public readonly entityDetectionWorkflow: EntityDetectionWorkflow;
    public readonly indexedStorage: IndexedStorage;
    public readonly sampleDocuments: SampleDocuments;
    public readonly uiInfrastructure: UIInfrastructure;

    constructor(scope: Construct, id: string, props: DusStackProps) {
        super(scope, id, props);

        new cdk.CfnMapping(this, 'Solution', {
            mapping: {
                Data: {
                    SendAnonymousUsageData: 'Yes',
                    ID: props.solutionID,
                    Version: props.solutionVersion,
                    SolutionName: props.solutionName,
                    AppNamespace: props.appNamespace
                }
            }
        });

        new cdk.CfnMapping(this, 'FeaturesToDeploy', {
            mapping: {
                Deploy: {
                    TextractWorkflow: 'Yes',
                    ComprehendWorkflow: 'Yes',
                    RedactionWorkflow: 'Yes',
                    CustomDashboard: 'Yes',
                    WebApp: 'Yes',
                    SampleDocuments: 'Yes'
                }
            }
        });

        const defaultUserEmail = new CfnParameter(this, 'DefaultUserEmail', {
            type: 'String',
            description: 'Optional email to create a Cognito user with access to the application, and to receive document processing notifications from the application.',
            allowedPattern: "^$|[A-Za-z0-9_!#$%&'*+/=?`{|}~^.-]+@[A-Za-z0-9.-]+$",
            constraintDescription: 'Please provide a valid email, or leave blank',
            default: PLACEHOLDER_EMAIL
        });

        // see names of supported configs in `./workflow-config/`
        const workflowConfigName = new CfnParameter(this, 'WorkflowConfigName', {
            type: 'String',
            description:
                'Name of the configuration that will define the workflow execution sequence and required documents',
            allowedValues: extractWorkflowConfigNames(),
            constraintDescription: 'Please provide a valid workflow config name',
            default: DEFAULT_WORKFLOW_CONFIG_NAME
        });

        const applicationSetup = new ApplicationSetup(this, 'Setup', {
            appNamespace: props.appNamespace,
            solutionID: props.solutionID,
            solutionVersion: props.solutionVersion
        });

        const appNamespace = cdk.Fn.findInMap('Solution', 'Data', 'AppNamespace');

        const notificationManager = new NotificationManager(this, 'NotificationManager', {
            orchestratorBus: applicationSetup.orchestratorBus,
            appConfigBucket: applicationSetup.appSetupS3Bucket,
            appNamespace: appNamespace,
            customResourceLambda: applicationSetup.customResourceLambda,
            subscriptionEmail: defaultUserEmail.valueAsString
        });

        const sampleDocsCondition = new cdk.CfnCondition(this, 'DeploySamples', {
            expression: cdk.Fn.conditionEquals(cdk.Fn.findInMap('FeaturesToDeploy', 'Deploy', 'SampleDocuments'), 'Yes')
        });

        this.sampleDocuments = new SampleDocuments(this, 'SampleDocuments', {
            parameters: {
                SamplesSourceBucketName: applicationSetup.appSetupS3Bucket.bucketName,
                SamplesCustomResourceLambdaArn: applicationSetup.customResourceLambda.functionArn
            },
            description: 'Nested stack that deploys sample documents'
        });

        (this.sampleDocuments.node.defaultChild as cdk.CfnResource).cfnOptions.condition = sampleDocsCondition;
        (this.sampleDocuments.node.defaultChild as cdk.CfnResource).addDependency(
            notificationManager.emailTemplatesCustomResource.node.defaultChild as cdk.CfnResource
        );

        this.requestProcessor = new RequestProcessor(this, 'RequestProcessor', {
            orchestratorBus: applicationSetup.orchestratorBus,
            appNamespace: appNamespace,
            s3LoggingBucket: applicationSetup.accessLoggingBucket,
            workflowConfigTable: applicationSetup.workflowConfigtable,
            genUUID: applicationSetup.generateUUID.getAttString('UUID'),
            workflowConfigName: workflowConfigName.valueAsString,
            defaultUserEmail: defaultUserEmail.valueAsString,
            applicationTrademarkName: props.applicationTrademarkName
        });

        this.indexedStorage = new IndexedStorage(this, 'IndexedStorage', {
            genUUID: applicationSetup.generateUUID.getAttString('UUID'),
            roleArn: this.requestProcessor.workflowOrchestratorFunc.role!.roleArn,
            searchLambda: this.requestProcessor.searchFunc,
            apiRootResource: this.requestProcessor.apiRootResource,
            extUsrAuthorizer: this.requestProcessor.extUsrAuthorizer,
            documentBucketName: this.requestProcessor.docUploadBucket[0].bucketName,
            extUserPoolId: this.requestProcessor.extUsrPool.userPoolId
        });

        applicationSetup.anonymousMetricsLambda.addEnvironment(
            REST_API_NAME_ENV_VAR,
            this.requestProcessor.apiGateway.restApiName
        );
        applicationSetup.anonymousMetricsLambda.addEnvironment(
            USER_POOL_ID_ENV_VAR,
            this.requestProcessor.extUsrPool.userPoolId
        );
        applicationSetup.anonymousMetricsLambda.addEnvironment(
            KENDRA_INDEX_ID_ENV_VAR,
            cdk.Fn.conditionIf(
                this.indexedStorage.deployKendraIndexCondition.logicalId,
                this.indexedStorage.kendraCaseSearch.kendraCaseSearchIndex.attrId,
                cdk.Aws.NO_VALUE
            ).toString()
        );
        applicationSetup.anonymousMetricsLambda.addEnvironment(
            STACK_UUID_ENV_VAR,
            applicationSetup.generateUUID.getAttString('UUID')
        );

        // this call is required to update lambda environment variables if Kendra is deployed
        this.indexedStorage.updateLambdaEnvironmentVariables(this.requestProcessor.workflowOrchestratorFunc);

        applicationSetup.addAnonymousMetricsCustomLambda(
            props.solutionID,
            props.solutionVersion,
            this.indexedStorage.isKendraDeployed,
            workflowConfigName.valueAsString
        );

        const textractWorkflowCondition = new cdk.CfnCondition(this, 'DeployTextractWorkflow', {
            expression: cdk.Fn.conditionEquals(
                cdk.Fn.findInMap('FeaturesToDeploy', 'Deploy', 'TextractWorkflow'),
                'Yes'
            )
        });

        const documentUploadBucketArn = this.requestProcessor.docUploadBucket[0].bucketArn;
        const inferenceBucketArn = this.requestProcessor.inferenceBucket[0].bucketArn;
        const caseTableArn = this.requestProcessor.caseTable.tableArn;

        this.textractWorkflow = new TextractWorkflow(this, 'Textract', {
            parameters: {
                SyncCaseTableArn: caseTableArn,
                SyncInferenceS3BucketArn: inferenceBucketArn,
                OrchestratorBusArn: applicationSetup.orchestratorBus.eventBusArn,
                AppNamespace: appNamespace,
                UploadBucketArn: documentUploadBucketArn,
                GenUUID: applicationSetup.generateUUID.getAttString('UUID')
            },
            description: 'Nested Stack that deploys components to interact with Amazon Textract for uploaded documents'
        });
        (this.textractWorkflow.node.defaultChild as cdk.CfnResource).cfnOptions.condition = textractWorkflowCondition;

        const redactionWorkflowCondition = new cdk.CfnCondition(this, 'DeployRedactionWorkflow', {
            expression: cdk.Fn.conditionEquals(
                cdk.Fn.findInMap('FeaturesToDeploy', 'Deploy', 'RedactionWorkflow'),
                'Yes'
            )
        });

        this.redactionWorkflow = new RedactionWorkflow(this, 'Redaction', {
            parameters: {
                SyncCaseTableArn: caseTableArn,
                SyncInferenceS3BucketArn: inferenceBucketArn,
                OrchestratorBusArn: applicationSetup.orchestratorBus.eventBusArn,
                AppNamespace: appNamespace,
                UploadBucketArn: documentUploadBucketArn,
                GenUUID: applicationSetup.generateUUID.getAttString('UUID')
            },
            description: 'Nested Stack that deploys components to redact content in uploaded documents'
        });

        (this.redactionWorkflow.node.defaultChild as cdk.CfnResource).cfnOptions.condition = redactionWorkflowCondition;

        const comprehendWorkflowCondition = new cdk.CfnCondition(this, 'DeployComprehendWorkflow', {
            expression: cdk.Fn.conditionEquals(
                cdk.Fn.findInMap('FeaturesToDeploy', 'Deploy', 'ComprehendWorkflow'),
                'Yes'
            )
        });

        this.entityDetectionWorkflow = new EntityDetectionWorkflow(this, 'EntityDetection', {
            parameters: {
                SyncCaseTableArn: caseTableArn,
                SyncInferenceS3BucketArn: inferenceBucketArn,
                OrchestratorBusArn: applicationSetup.orchestratorBus.eventBusArn,
                AppNamespace: appNamespace,
                UploadBucketArn: documentUploadBucketArn,
                GenUUID: applicationSetup.generateUUID.getAttString('UUID')
            },
            description:
                'Nested Stack that deploys components to interact with Amazon Comprehend and Amazon Comprehend Medical for uploaded documents'
        });
        (this.entityDetectionWorkflow.node.defaultChild as cdk.CfnResource).cfnOptions.condition =
            comprehendWorkflowCondition;

        this.requestProcessor.workflowOrchestratorFunc.addEnvironment('APP_NAMESPACE', appNamespace);

        // the workflow orchestrator must listen for success messages from workflow-stepfunction.<appNamespace>,
        // as this is where the individual workflows publish their result events.
        const rule = new Rule(this, 'SfnToOrchestratorRule', {
            eventPattern: {
                source: [`${EventSources.WORKFLOW_STEPFUNCTION}.${appNamespace}`],
                detail: {
                    case: {
                        status: [WorkflowStatus.SUCCESS]
                    }
                }
            },
            enabled: true,
            eventBus: applicationSetup.orchestratorBus
        });
        rule.addTarget(new cdk.aws_events_targets.LambdaFunction(this.requestProcessor.workflowOrchestratorFunc));

        applicationSetup.addCustomDashboard({
            apiName: this.requestProcessor.apiGateway.restApiName,
            userPoolId: this.requestProcessor.extUsrPool.userPoolId,
            genUUID: applicationSetup.generateUUID.getAttString('UUID')
        });

        const ssmKey = applicationSetup.createWebConfigStorage({
            apiEndpoint: this.requestProcessor.apiGateway.url,
            userPoolId: this.requestProcessor.extUsrPool.userPoolId,
            userPoolClientId: this.requestProcessor.extUserPoolClient.ref,
            deployKendraIndexCondition: this.indexedStorage.deployKendraIndexCondition,
            workflowConfigName: workflowConfigName
        });

        applicationSetup.webConfigCustomResource.node.defaultChild?.node.addDependency(
            applicationSetup.workflowConfig.copyConfigToDdbResource
        );

        this.uiInfrastructure = new UIInfrastructure(this, 'WebApp', {
            webRuntimeConfigKey: ssmKey,
            customInfra: applicationSetup.customResourceLambda,
            accessLoggingBucket: applicationSetup.accessLoggingBucket
        });
        this.uiInfrastructure.nestedUIStack.node.defaultChild?.node.addDependency(
            applicationSetup.webConfigCustomResource
        );
        this.uiInfrastructure.nestedUIStack.node.defaultChild?.node.addDependency(
            applicationSetup.accessLoggingBucket.node
                .tryFindChild('Policy')
                ?.node.tryFindChild('Resource') as cdk.CfnResource
        );

        if (process.env.DIST_OUTPUT_BUCKET) {
            generateSourceCodeMapping(this, props.solutionName, props.solutionVersion);
            generateSourceCodeMapping(this.sampleDocuments, props.solutionName, props.solutionVersion);
            generateSourceCodeMapping(this.uiInfrastructure.nestedUIStack, props.solutionName, props.solutionVersion);
        }

        const cloudfrontUrlOutput = new cdk.CfnOutput(cdk.Stack.of(this), 'CloudFrontWebUrl', {
            value: `https://${(this.uiInfrastructure.nestedUIStack as UIAssets).cloudFrontDistribution.domainName}`
        });
        cloudfrontUrlOutput.condition = this.uiInfrastructure.deployWebApp;
    }
}
