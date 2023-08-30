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

'use strict';

const EnvSetup = require('./utils/env-setup');
const S3Trigger = require('./utils/s3-event-trigger');
const SfnTrigger = require('./utils/sfn-event-trigger');
const EventDispatcher = require('./utils/event-dispatcher');
const KendraUpload = require('./utils/kendra-upload');
const SharedLib = require('common-node-lib');

exports.handler = async (event, context) => {
    console.debug(JSON.stringify(event));
    EnvSetup.checkAllEnvSetup();

    // if we have triggered this lambda from a stepfunction failure, we have special handling
    if (
        event.source === `${SharedLib.EventSources.WORKFLOW_STEPFUNCTION}.${process.env.APP_NAMESPACE}` &&
        event['detail-type'] === SharedLib.WorkflowEventDetailTypes.PROCESSING_FAILURE
    ) {
        await this.handleFailure(event);
        return;
    }

    const newEvent = await this.generateNextStageEventDetail(event);

    // If all required docs not uploaded `generateNextStageEventDetail` returns false
    // hence exit
    if (!newEvent) {
        console.debug('Exiting workflow orchestrator');
        return;
    }
    let eventDetailType = SharedLib.WorkflowEventDetailTypes.TRIGGER_WORKFLOW; // used when we will be triggering more stages
    if (newEvent.case.status === SharedLib.WorkflowStatus.COMPLETE) {
        eventDetailType = SharedLib.WorkflowEventDetailTypes.PROCESSING_COMPLETE;

        try {
            // Upload documents to Kendra index if configured.
            if (process.env.KENDRA_INDEX_ID) {
                EnvSetup.checkKendraRoleArnEnvSetup(); // env setup
                const requestAccountId = SharedLib.getAccountIdFromLambdaContext(context);
                await KendraUpload.uploadToKendraIndex(
                    process.env.KENDRA_INDEX_ID,
                    process.env.KENDRA_ROLE_ARN,
                    newEvent,
                    requestAccountId
                ); // doesn't return
            } else {
                console.log('KENDRA_INDEX_ID is not found for this deployment.');
            }
        } catch (error) {
            console.error(`Failed to upload documents to Kendra index with error: ${error}`);
            throw error;
        }

        try {
            // publishing cw metrics and case status to indicate success
            const metricsPromise = Promise.resolve(SharedLib.CaseStatus.SUCCESS);
            const cloudWatch = new SharedLib.CloudWatchMetrics(SharedLib.CloudwatchNamespace.CASE);
            metricsPromise.then((caseStatus) => {
                cloudWatch.publishMetrics(caseStatus);
            });
        } catch (error) {
            console.error(`Failed to publish CloudWatch metrics with error: ${error}`);
        }

        await SharedLib.updateCaseStatus(event.detail.case.id, SharedLib.CaseStatus.SUCCESS);
    }

    return await EventDispatcher.publishEvent(newEvent, eventDetailType); // NOSONAR - false positive. Await required in lambda
};

/**
 * Generates the event which will be published to the orchestrator bus and trigger the next "stage" (i.e. workflow).
 * Depending on the source of the incoming event which triggered this lambda, this is handled differently.
 * An event coming from s3 indicates this is the start of processing as we have been triggered by a document upload.
 * If this is triggered from an event coming from this apps workflow-stepfunction, the next event generated will either
 * trigger the next stage to be executed, or signal termination of the processing for this case.
 *
 * @param {*} event Event which triggered this lambda. Should come from the orchestrator bus.
 * @returns an event to be published on the orchestrator bus which will trigger the next stage of processing
 */
exports.generateNextStageEventDetail = async (event) => {
    // only occurs when a document is uploaded to s3
    if (event.source == 'aws.s3') {
        // Send cloudwatch metrics and update ddb table status for in-process
        const response = await S3Trigger.generateSfnEventDetail(event);
        const caseId = S3Trigger.parseFileKey(event.detail.object.key).caseId;
        if (response) {
            const cloudWatch = new SharedLib.CloudWatchMetrics(SharedLib.CloudwatchNamespace.CASE);
            await cloudWatch.publishMetrics(SharedLib.CaseStatus.IN_PROCESS);
            await SharedLib.updateCaseStatus(caseId, SharedLib.CaseStatus.IN_PROCESS);
        } else {
            // the case is not yet ready for processing (e.g. missing required required documents)
            await SharedLib.updateCaseStatus(caseId, SharedLib.CaseStatus.INITIATE);
        }
        return response; // NOSONAR - false positive. Await required in lambda
    } else if (event.source === `${SharedLib.EventSources.WORKFLOW_STEPFUNCTION}.${process.env.APP_NAMESPACE}`) {
        return SfnTrigger.generateSfnEventDetail(event);
    }
};

/**
 * Handles failure events from the stepfunction. Will mark the case as failed in the case table, and publishes a failure metric to cloudwatch metrics.
 * @param {*} event Expected to come from EventBridge on the orchestrator bus, as published by the step function failure fragment
 */
exports.handleFailure = async (event) => {
    const cloudWatch = new SharedLib.CloudWatchMetrics(SharedLib.CloudwatchNamespace.CASE);
    await cloudWatch.publishMetrics(SharedLib.CaseStatus.FAILURE);
    await SharedLib.updateCaseStatus(event.detail.detail.case.id, SharedLib.CaseStatus.FAILURE);
};
