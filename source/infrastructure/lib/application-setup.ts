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
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';

import { CustomDashboard, CustomDashboardProps } from './metrics/custom-dashboard';

import { NagSuppressions } from 'cdk-nag';
import { Construct } from 'constructs';
import { CustomInfraSetup } from './utils/custom-infra-setup';
import { SolutionHelper } from './utils/solution-helper';
import { WorkflowConfig } from './workflow/workflow-config';

/**
 * The interface which defines the configuration that should be stored in SSM parameter store
 */
export interface WebConfigProps {
    /**
     * The REST Api endpoint as deployed by infrastructure
     */
    apiEndpoint: string;

    /**
     * The UserPoolId of the Cognito user pool created by infrastructure during deployment
     */
    userPoolId: string;

    /**
     * The UserPoolClientId of the Cognito user pool created by the infrastructure during deployment
     */
    userPoolClientId: string;

    /**
     * Condition that indicates if Kendra index was deployed
     */
    deployKendraIndexCondition: cdk.CfnCondition;


    /**
     * Condition that indicates if OpenSearch serverless collection was deployed
     */
    deployOpenSearchCondition: cdk.CfnCondition;

    /**
     * Name of the selected workflow config that will be used to write into the ssm param store
     */
    workflowConfigName: cdk.CfnParameter;
}

export interface ApplicationProps {
    /**
     * The app Namespace for the AWS solution
     */
    appNamespace: string;

    /**
     * The solution id for the AWS solution
     */
    solutionID: string;

    /**
     * The version of the AWS solution being deployed
     */
    solutionVersion: string;
}

/**
 * This Construct setups the pre-requisites required for the entire application to work
 */
export class ApplicationSetup extends Construct {
    /**
     * The instance of Construct passed to it the constructor to be used when infrastructure provisioning is
     * done outside the constructor through methods
     */
    private scope: Construct;

    /**
     * The event bus that is the central orchestrator of all events in this application
     */
    public readonly orchestratorBus: events.EventBus;

    /**
     * The namespace that applies to this application deployment. The namespace is further used to define
     * event patterns and rules for filtering events and defining target consumers
     */
    public readonly appNamespace: string;

    /**
     * The bucket used to log s3 activity
     */
    public readonly accessLoggingBucket: s3.Bucket;

    /**
     * The bucket that contains configuration for application setup
     */
    public readonly appSetupS3Bucket: s3.Bucket;

    /**
     * The custom resource lambda function
     */
    public readonly customResourceLambda: lambda.Function;

    /**
     * Construct that creates ddb table and custom resource to write the copies data from the workflow
     * config files into the config ddb table.
     */
    public readonly workflowConfig: WorkflowConfig;

    /**
     * The table containing definitions on different workflow options. During deployment one of these
     * can be set as the active workflow
     */
    public readonly workflowConfigtable: dynamodb.Table;

    /**
     * The custom resource that generates the UUID to be used by different CloudFormation resources
     * to generate unique identifiers
     */
    public readonly generateUUID: cdk.CustomResource;

    /**
     * The condition to decide what partition is the solution being deployed in
     */
    public readonly deploymentPartition: cdk.CfnCondition;

    /**
     * This instance is created only after 'createWebConfigStorage' is called. This instance refers
     * to the CustomResource that writes the web configuration required for the UI project in to
     * SSM Parameter Store.
     */
    private webConfigResource: cdk.CustomResource;

    /**
     * This Construct refers to the Anonymous Metrics Solution Helper which is used to send metrics
     * at cloudformation events of create, update and delete
     */
    public solutionHelper: Construct;

    /**
     * The scheduled anonymous metrics lambda function
     */
    public readonly anonymousMetricsLambda: lambda.Function;

    constructor(scope: Construct, id: string, props: ApplicationProps) {
        super(scope, id);
        this.scope = scope;

        this.appNamespace = props.appNamespace;

        this.accessLoggingBucket = new s3.Bucket(this, 'AccessLog', {
            versioned: false, // NOSONAR - bucket versioning is recommended in the IG, but is not enforced
            encryption: s3.BucketEncryption.S3_MANAGED,
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            enforceSSL: true
        });

        // defining  the central orchestration bus for events in the entire application
        this.orchestratorBus = new events.EventBus(this, 'EventOrchestrator');

        this.appSetupS3Bucket = new s3.Bucket(this, 'AppConfig', {
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            enforceSSL: true,
            versioned: false, // NOSONAR - bucket versioning is recommended in the IG, but is not enforced
            serverAccessLogsBucket: this.accessLoggingBucket,
            serverAccessLogsPrefix: 'AppConfig/'
        });

        const customInfraSetup = new CustomInfraSetup(this, 'InfraSetup', {
            solutionID: props.solutionID,
            solutionVersion: props.solutionVersion
        });
        this.anonymousMetricsLambda = customInfraSetup.anonymousMetricsLambda;
        this.customResourceLambda = customInfraSetup.customResourceLambda;

        this.workflowConfig = new WorkflowConfig(this, 'Workflow', {
            customResource: this.customResourceLambda
        });

        this.workflowConfigtable = this.workflowConfig.workflowConfigTable;

        this.generateUUID = new cdk.CustomResource(this, 'GenUUID', {
            resourceType: 'Custom::GenUUID',
            serviceToken: this.customResourceLambda.functionArn,
            properties: {
                Resource: 'GEN_UUID'
            }
        });

        this.deploymentPartition = new cdk.CfnCondition(this, 'DeploymentPartition', {
            expression: cdk.Fn.conditionEquals(cdk.Aws.PARTITION, 'aws-us-gov')
        });

        NagSuppressions.addResourceSuppressions(this.accessLoggingBucket, [
            {
                id: 'AwsSolutions-S1',
                reason: 'This S3 bucket is used as the access logging bucket for another bucket'
            }
        ]);
    }

    /**
     * This method creates a Condition, if a custom dashboard should be created, provisions a custom CloudWatch Dashboard
     * and adds the condition as a Resource Condition to the CloudWatch Dashboard.
     *
     * @param props - The props required to create a custom dashboard
     */
    public addCustomDashboard(props: CustomDashboardProps) {
        const deployCustomDashboardCondition = new cdk.CfnCondition(cdk.Stack.of(this), 'DeployCustomDashboard', {
            expression: cdk.Fn.conditionEquals(cdk.Fn.findInMap('FeaturesToDeploy', 'Deploy', 'CustomDashboard'), 'Yes')
        });

        const customDashboard = new CustomDashboard(this, 'Ops', props);

        (customDashboard.dashboard.node.defaultChild as cdk.CfnResource).cfnOptions.condition =
            deployCustomDashboardCondition;
    }

    /**
     * This method adds The scheduled anonymous metrics lambda function to the solution.
     *
     * @param solutionId - The solution id for the AWS solution
     * @param solutionVersion - The solution version for the AWS solution
     * @param deployKendraIndex - The value that specifies whether Kendra index was deployed or not
     * @param workflowConfigName - The name of the workflow configuration file
     */
    public addAnonymousMetricsCustomLambda(
        solutionId: string,
        solutionVersion: string,
        deployKendraIndex: string,
        workflowConfigName: string
    ) {
        this.solutionHelper = new SolutionHelper(this, 'SolutionHelper', {
            customResource: this.customResourceLambda,
            solutionID: solutionId,
            version: solutionVersion,
            deployKendraIndex: deployKendraIndex,
            workflowConfigName: workflowConfigName
        });
    }

    /**
     * Method that provisions a custom resource. This custom resource will store the WebConfig in
     * SSM Parameter store. This method will also add permissions to allow the lambda to write to
     * SSM Parameter Store. This method will write the SSM Parameter Key as output and export the
     * value for the front-end stack to use it directly.
     *
     * @param props
     */
    public createWebConfigStorage(props: WebConfigProps): string {
        const ssmKey: string = `/${cdk.Aws.STACK_NAME}/${this.appNamespace}/webconfig`;

        // prettier-ignore
        this.webConfigResource = new cdk.CustomResource(this.scope, 'WebConfig', { // NOSONAR typescript:S1848. Not valid for CDK
            resourceType: 'Custom::WriteWebConfig',
            serviceToken: this.customResourceLambda.functionArn,
            properties: {
                Resource: 'WEBCONFIG',
                API_ENDPOINT: props.apiEndpoint,
                USER_POOL_ID: props.userPoolId,
                USER_POOL_CLIENT_ID: props.userPoolClientId,
                SSM_KEY: ssmKey,
                KENDRA_STACK_DEPLOYED: cdk.Fn.conditionIf(
                    props.deployKendraIndexCondition.logicalId,
                    'Yes',
                    'No'
                ).toString(),
                OPEN_SEARCH_STACK_DEPLOYED: cdk.Fn.conditionIf(
                    props.deployOpenSearchCondition.logicalId,
                    'Yes',
                    'No'
                ).toString(),
                WORKFLOW_CONFIG_DDB_TABLE_NAME: this.workflowConfigtable.tableName,
                WORKFLOW_CONFIG_NAME: props.workflowConfigName.valueAsString
            }
        });
        const lambdaSSMPolicy = new iam.Policy(this, 'WriteToSSM', {
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['ssm:PutParameter', 'ssm:DeleteParameter', 'ssm:GetParameter'],
                    resources: [
                        `arn:${cdk.Aws.PARTITION}:ssm:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:parameter${ssmKey}`
                    ]
                })
            ]
        });

        lambdaSSMPolicy.attachToRole(this.customResourceLambda.role!);
        this.webConfigResource.node.tryFindChild('Default')!.node.addDependency(lambdaSSMPolicy);

        // prettier-ignore
        new cdk.CfnOutput(cdk.Stack.of(this), 'WebConfigKey', { // NOSONAR typescript:S1848. Not valid for CDK
            value: ssmKey,
            exportName: 'WebConfig'
        });

        return ssmKey;
    }

    /**
     * This getter method returns the instance of CustomResource that writes web config to SSM Parameter Store.
     */
    public get webConfigCustomResource(): cdk.CustomResource {
        return this.webConfigResource;
    }
}
