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
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as s3_asset from 'aws-cdk-lib/aws-s3-assets';

import { Construct } from 'constructs';
import { NagSuppressions } from 'cdk-nag';
import { getResourceProperties } from '../utils/common-utils';

export interface WorkflowConfigProps {
    /**
     * The custom resource function that would copy the JSON file to the Dynamodb table
     */
    customResource: lambda.Function;
}

/**
 * This construct creates the Dynamodb table containing workflow configuration
 */
export class WorkflowConfig extends Construct {
    /**
     * The table containing the configuration
     */
    public readonly workflowConfigTable: dynamodb.Table;

    /**
     * Custom resource responsible for populating the Config DDB Table
     */
    public readonly copyConfigToDdbResource: cdk.CustomResource;

    constructor(scope: Construct, id: string, props: WorkflowConfigProps) {
        super(scope, id);

        this.workflowConfigTable = new dynamodb.Table(this, 'Config', {
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            partitionKey: {
                name: 'Name',
                type: dynamodb.AttributeType.STRING
            }
        });

        this.workflowConfigTable.grantReadWriteData(props.customResource);

        const workflowConfig = new s3_asset.Asset(this, 'Files', {
            path: path.join(__dirname, '../../../workflow-config/')
        });

        this.copyConfigToDdbResource = new cdk.CustomResource(this, 'CopyWorkflowConfig', {
            resourceType: 'Custom::CopyWorkflowConfig',
            serviceToken: props.customResource.functionArn,
            properties: {
                Resource: 'COPY_WORKFLOW_CONFIG',
                DDB_TABLE_NAME: this.workflowConfigTable.tableName,
                ...getResourceProperties(this, workflowConfig, props.customResource)
            }
        });

        NagSuppressions.addResourceSuppressions(this.workflowConfigTable, [
            {
                id: 'AwsSolutions-DDB3',
                reason: 'Point-in-time recovery is recommended, but AWS Solutions do not enforce it. Hence suppressed'
            }
        ]);
    }
}
