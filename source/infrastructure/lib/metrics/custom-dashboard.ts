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
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';
import { CaseStatus, CloudwatchNamespace, MetricNames, SupportedFileTypes, WorkflowAPIs } from '../utils/constants';

/**
 * The properties associated with Custom Dashboard
 */
export interface CustomDashboardProps {
    /**
     * The Api name for which widgets and metrics are to be created
     */
    apiName: string;

    /**
     * The user pool for which dashboard is to be created
     */
    userPoolId: string;

    /**
     * UUID generated in the parent stack that can be used to append to resource logical ids
     */
    genUUID: string;
}

/**
 * This construct creates a custom Dashboard in Amazon CloudWatch and adds widgets and defines metrics. It defines
 * widgets to display metrics that show sum of Documents uploaded, Document Types, and the different workflows
 * invoked to process documents
 */
export class CustomDashboard extends Construct {
    /**
     * The custom dashboard instance created for obervability
     */
    public readonly dashboard: cloudwatch.Dashboard;

    constructor(scope: Construct, id: string, props: CustomDashboardProps) {
        super(scope, id);

        this.dashboard = new cloudwatch.Dashboard(this, 'CustomDashboard', {
            dashboardName: `${cdk.Aws.STACK_NAME}-${cdk.Aws.REGION}-Dashboard`,
            periodOverride: cloudwatch.PeriodOverride.AUTO,
            start: 'start',
            end: 'end'
        });
        const metricsServiceName = `eDUS-${props.genUUID}`;

        (this.dashboard.node.defaultChild as cloudwatch.CfnDashboard).cfnOptions.deletionPolicy =
            cdk.CfnDeletionPolicy.DELETE;

        this.dashboard.addWidgets(
            new cloudwatch.GraphWidget({
                title: 'REST Endpoint Stats',
                left: [
                    new cloudwatch.Metric({
                        metricName: 'Count',
                        namespace: 'AWS/ApiGateway',
                        dimensionsMap: { 'ApiName': props.apiName },
                        statistic: cloudwatch.Stats.SAMPLE_COUNT,
                        label: 'Count',
                        period: cdk.Duration.hours(1)
                    }),
                    new cloudwatch.Metric({
                        metricName: 'Latency',
                        namespace: 'AWS/ApiGateway',
                        dimensionsMap: { 'ApiName': props.apiName },
                        statistic: cloudwatch.Stats.AVERAGE,
                        label: 'Average',
                        period: cdk.Duration.hours(1)
                    }),
                    new cloudwatch.Metric({
                        metricName: 'Latency',
                        namespace: 'AWS/ApiGateway',
                        dimensionsMap: { 'ApiName': props.apiName },
                        statistic: cloudwatch.Stats.MAXIMUM,
                        label: 'Max',
                        period: cdk.Duration.hours(1)
                    })
                ]
            }),
            new cloudwatch.GraphWidget({
                title: 'Cognito Sign-in',
                left: [
                    new cloudwatch.Metric({
                        metricName: 'SignInSuccesses',
                        namespace: 'AWS/Cognito',
                        label: 'Count',
                        statistic: cloudwatch.Stats.SAMPLE_COUNT,
                        period: cdk.Duration.hours(1),
                        dimensionsMap: {
                            'UserPool': props.userPoolId
                        }
                    }),
                    new cloudwatch.Metric({
                        metricName: 'SignInSuccesses',
                        namespace: 'AWS/Cognito',
                        label: 'Average',
                        statistic: cloudwatch.Stats.AVERAGE,
                        period: cdk.Duration.hours(1),
                        dimensionsMap: {
                            'UserPool': props.userPoolId
                        }
                    })
                ]
            }),
            new cloudwatch.GraphWidget({
                title: 'Case Processing Status',
                left: [
                    new cloudwatch.Metric({
                        color: cloudwatch.Color.BLUE,
                        namespace: CloudwatchNamespace.CASE,
                        metricName: MetricNames.CASE_PROCESSED_STATUS,
                        dimensionsMap: { 'CaseStatus': CaseStatus.INITIATE },
                        statistic: cloudwatch.Stats.SAMPLE_COUNT,
                        label: CaseStatus.INITIATE,
                        period: cdk.Duration.hours(1)
                    }),
                    new cloudwatch.Metric({
                        color: cloudwatch.Color.PURPLE,
                        namespace: CloudwatchNamespace.CASE,
                        metricName: MetricNames.CASE_PROCESSED_STATUS,
                        dimensionsMap: { 'CaseStatus': CaseStatus.IN_PROCESS, service: metricsServiceName },
                        statistic: cloudwatch.Stats.SAMPLE_COUNT,
                        label: CaseStatus.IN_PROCESS,
                        period: cdk.Duration.hours(1)
                    }),
                    new cloudwatch.Metric({
                        color: cloudwatch.Color.GREEN,
                        namespace: CloudwatchNamespace.CASE,
                        metricName: MetricNames.CASE_PROCESSED_STATUS,
                        dimensionsMap: { 'CaseStatus': CaseStatus.SUCCESS, service: metricsServiceName },
                        statistic: cloudwatch.Stats.SAMPLE_COUNT,
                        label: CaseStatus.SUCCESS,
                        period: cdk.Duration.hours(1)
                    }),
                    new cloudwatch.Metric({
                        color: cloudwatch.Color.RED,
                        namespace: CloudwatchNamespace.CASE,
                        metricName: MetricNames.CASE_PROCESSED_STATUS,
                        dimensionsMap: { 'CaseStatus': CaseStatus.FAILURE, service: metricsServiceName },
                        statistic: cloudwatch.Stats.SAMPLE_COUNT,
                        label: CaseStatus.FAILURE,
                        period: cdk.Duration.hours(1)
                    })
                ]
            }),
            new cloudwatch.GraphWidget({
                title: 'Document Upload Count',
                left: [
                    new cloudwatch.Metric({
                        color: cloudwatch.Color.PURPLE,
                        namespace: CloudwatchNamespace.DOCUMENTS,
                        metricName: MetricNames.DOCUMENTS,
                        dimensionsMap: { 'Documents': 'Upload', service: metricsServiceName },
                        statistic: cloudwatch.Stats.SAMPLE_COUNT,
                        label: 'Document Upload Count',
                        period: cdk.Duration.hours(1)
                    })
                ]
            }),
            new cloudwatch.GraphWidget({
                title: 'File Types Uploaded',
                left: [
                    new cloudwatch.Metric({
                        color: cloudwatch.Color.ORANGE,
                        namespace: CloudwatchNamespace.FILE_TYPES,
                        metricName: MetricNames.FILE_TYPES,
                        dimensionsMap: { 'FileTypesUploaded': SupportedFileTypes.PDF, service: metricsServiceName },
                        statistic: cloudwatch.Stats.SAMPLE_COUNT,
                        label: SupportedFileTypes.PDF,
                        period: cdk.Duration.hours(1)
                    }),
                    new cloudwatch.Metric({
                        color: cloudwatch.Color.PURPLE,
                        namespace: CloudwatchNamespace.FILE_TYPES,
                        metricName: MetricNames.FILE_TYPES,
                        dimensionsMap: {
                            'FileTypesUploaded': SupportedFileTypes.JPG_JPEG,
                            service: metricsServiceName
                        },
                        label: SupportedFileTypes.JPG_JPEG,
                        statistic: cloudwatch.Stats.SAMPLE_COUNT,
                        period: cdk.Duration.hours(1)
                    }),
                    new cloudwatch.Metric({
                        color: cloudwatch.Color.BLUE,
                        namespace: CloudwatchNamespace.FILE_TYPES,
                        metricName: MetricNames.FILE_TYPES,
                        dimensionsMap: { 'FileTypesUploaded': SupportedFileTypes.PNG, service: metricsServiceName },
                        statistic: cloudwatch.Stats.SAMPLE_COUNT,
                        label: SupportedFileTypes.PNG,
                        period: cdk.Duration.hours(1)
                    })
                ]
            }),
            new cloudwatch.GraphWidget({
                title: 'Textract Workflows Processed',
                left: [
                    new cloudwatch.Metric({
                        color: cloudwatch.Color.PINK,
                        namespace: CloudwatchNamespace.WORKFLOW_TYPES,
                        metricName: MetricNames.TEXTRACT,
                        dimensionsMap: {
                            'TextractAPI': WorkflowAPIs.TEXTRACT_ANALYZE_DOCUMENT_SYNC,
                            service: metricsServiceName
                        },
                        label: WorkflowAPIs.TEXTRACT_ANALYZE_DOCUMENT_SYNC,
                        statistic: cloudwatch.Stats.SAMPLE_COUNT,
                        period: cdk.Duration.hours(1)
                    }),
                    new cloudwatch.Metric({
                        color: cloudwatch.Color.ORANGE,
                        namespace: CloudwatchNamespace.WORKFLOW_TYPES,
                        metricName: MetricNames.TEXTRACT,
                        dimensionsMap: {
                            'TextractAPI': WorkflowAPIs.TEXTRACT_ANALYZE_EXPENSE_SYNC,
                            service: metricsServiceName
                        },
                        label: WorkflowAPIs.TEXTRACT_ANALYZE_EXPENSE_SYNC,
                        statistic: cloudwatch.Stats.SAMPLE_COUNT,
                        period: cdk.Duration.hours(1)
                    }),
                    new cloudwatch.Metric({
                        color: cloudwatch.Color.BLUE,
                        namespace: CloudwatchNamespace.WORKFLOW_TYPES,
                        metricName: MetricNames.TEXTRACT,
                        dimensionsMap: {
                            'TextractAPI': WorkflowAPIs.TEXTRACT_ANALYZE_ID_SYNC,
                            service: metricsServiceName
                        },
                        label: WorkflowAPIs.TEXTRACT_ANALYZE_ID_SYNC,
                        statistic: cloudwatch.Stats.SAMPLE_COUNT,
                        period: cdk.Duration.hours(1)
                    }),
                    new cloudwatch.Metric({
                        color: cloudwatch.Color.PURPLE,
                        namespace: CloudwatchNamespace.WORKFLOW_TYPES,
                        label: WorkflowAPIs.TEXTRACT_DETECT_TEXT_SYNC,
                        metricName: MetricNames.TEXTRACT,
                        dimensionsMap: {
                            'TextractAPI': WorkflowAPIs.TEXTRACT_DETECT_TEXT_SYNC,
                            service: metricsServiceName
                        },
                        statistic: cloudwatch.Stats.SAMPLE_COUNT,
                        period: cdk.Duration.hours(1)
                    }),
                    new cloudwatch.Metric({
                        color: cloudwatch.Color.RED,
                        namespace: CloudwatchNamespace.WORKFLOW_TYPES,
                        metricName: MetricNames.TEXTRACT,
                        dimensionsMap: {
                            'TextractAPI': WorkflowAPIs.TEXTRACT_SYNC_FAILURES,
                            service: metricsServiceName
                        },
                        label: WorkflowAPIs.TEXTRACT_SYNC_FAILURES,
                        statistic: cloudwatch.Stats.SAMPLE_COUNT,
                        period: cdk.Duration.hours(1)
                    })
                ]
            }),
            new cloudwatch.GraphWidget({
                title: 'Redaction Workflows Processed',
                left: [
                    new cloudwatch.Metric({
                        color: cloudwatch.Color.GREY,
                        namespace: CloudwatchNamespace.WORKFLOW_TYPES,
                        metricName: MetricNames.REDACTION,
                        dimensionsMap: { 'RedactionAPI': WorkflowAPIs.REDACT_DOCUMENT, service: metricsServiceName },
                        label: WorkflowAPIs.REDACT_DOCUMENT,
                        statistic: cloudwatch.Stats.SAMPLE_COUNT,
                        period: cdk.Duration.hours(1)
                    }),
                    new cloudwatch.Metric({
                        color: cloudwatch.Color.RED,
                        namespace: CloudwatchNamespace.WORKFLOW_TYPES,
                        dimensionsMap: { 'RedactionAPI': WorkflowAPIs.REDACTION_FAILURES, service: metricsServiceName },
                        metricName: MetricNames.REDACTION,
                        label: WorkflowAPIs.REDACTION_FAILURES,
                        statistic: cloudwatch.Stats.SAMPLE_COUNT,
                        period: cdk.Duration.hours(1)
                    })
                ]
            }),
            new cloudwatch.GraphWidget({
                title: 'Comprehend Workflows Processed',
                left: [
                    new cloudwatch.Metric({
                        color: cloudwatch.Color.BLUE,
                        namespace: CloudwatchNamespace.WORKFLOW_TYPES,
                        metricName: MetricNames.COMPREHEND,
                        dimensionsMap: {
                            'ComprehendAPI': WorkflowAPIs.COMPREHEND_DETECT_ENTITIES_SYNC,
                            service: metricsServiceName
                        },
                        label: WorkflowAPIs.COMPREHEND_DETECT_ENTITIES_SYNC,
                        statistic: cloudwatch.Stats.SAMPLE_COUNT,
                        period: cdk.Duration.hours(1)
                    }),
                    new cloudwatch.Metric({
                        color: cloudwatch.Color.RED,
                        namespace: CloudwatchNamespace.WORKFLOW_TYPES,
                        metricName: MetricNames.COMPREHEND,
                        dimensionsMap: {
                            'ComprehendAPI': WorkflowAPIs.COMPREHEND_SYNC_FAILURES,
                            service: metricsServiceName
                        },
                        label: WorkflowAPIs.COMPREHEND_SYNC_FAILURES,
                        statistic: cloudwatch.Stats.SAMPLE_COUNT,
                        period: cdk.Duration.hours(1)
                    }),
                    new cloudwatch.Metric({
                        color: cloudwatch.Color.PURPLE,
                        namespace: CloudwatchNamespace.WORKFLOW_TYPES,
                        metricName: MetricNames.COMPREHEND,
                        dimensionsMap: {
                            'ComprehendAPI': WorkflowAPIs.COMPREHEND_DETECT_PII_SYNC,
                            service: metricsServiceName
                        },
                        label: WorkflowAPIs.COMPREHEND_DETECT_PII_SYNC,
                        statistic: cloudwatch.Stats.SAMPLE_COUNT,
                        period: cdk.Duration.hours(1)
                    }),
                    new cloudwatch.Metric({
                        color: cloudwatch.Color.BROWN,
                        namespace: CloudwatchNamespace.WORKFLOW_TYPES,
                        metricName: MetricNames.COMPREHEND,
                        dimensionsMap: {
                            'ComprehendAPI': WorkflowAPIs.COMPREHEND_DETECT_MEDICAL_SYNC,
                            service: metricsServiceName
                        },
                        label: WorkflowAPIs.COMPREHEND_DETECT_MEDICAL_SYNC,
                        statistic: cloudwatch.Stats.SAMPLE_COUNT,
                        period: cdk.Duration.hours(1)
                    })
                ]
            })
        );
    }
}
