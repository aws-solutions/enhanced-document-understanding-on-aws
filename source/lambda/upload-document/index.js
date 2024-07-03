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
'use strict';

const SharedLib = require('common-node-lib');
const CaseCreator = require('./utils/create-case');
const DocUploader = require('./utils/upload-document');
const StartJobInitializer =require('./utils/start-job');
const { checkAllEnvSetup } = require('./utils/env-setup');

exports.handler = async (event) => {
    try {
        checkAllEnvSetup();
    } catch (error) {
        return SharedLib.formatError(error);
    }

    if (event.httpMethod !== 'POST') {
        return SharedLib.formatError(new Error('Invalid request: Only HTTP POST requests are supported'));
    }

    try {
        const eventBody = JSON.parse(event.body);
        if (event.resource === '/case') {
            const userId = SharedLib.getUserIdFromEvent(event);
            const caseName = eventBody.caseName;
            const enableBackendUpload = eventBody.enableBackendUpload;

            const isValid = await CaseCreator.validateCaseName(userId, caseName);
            if (!isValid) {
                console.error(`CaseName: ${caseName} already exist in Table::${process.env.CASE_DDB_TABLE_NAME}`);
                return SharedLib.formatError(new Error(`CaseName: ${caseName} already exist`));
            }

            const response = await CaseCreator.createCase({
                userId: userId,
                caseName: caseName,
                enableBackendUpload: enableBackendUpload
            });
            return SharedLib.formatResponse(response);
        } else if (event.resource === '/document') {

            if(!SharedLib.validateUserToCaseAssociation(eventBody.caseId, event.requestContext)) {
                throw new Error('User is not associated with the case');
            }

            const response = await DocUploader.createUploadPostRequest({
                userId: eventBody.userId,
                caseId: eventBody.caseId,
                caseName: eventBody.caseName || eventBody.caseId,
                fileName: eventBody.fileName,
                fileExtension: eventBody.fileExtension,
                documentType: eventBody.documentType
            });

            // Send cloudwatch metrics for fileExtension and Document upload
            const cloudWatch = new SharedLib.CloudWatchMetrics(SharedLib.CloudwatchNamespace.FILE_TYPES);
            await cloudWatch.publishMetrics(eventBody.fileExtension.replace('.', ''));
            cloudWatch.setNamespace(SharedLib.CloudwatchNamespace.DOCUMENTS);
            await cloudWatch.publishMetrics();

            return SharedLib.formatResponse(response);
        } else if (event.resource === '/case/start-job') {

            if(!SharedLib.validateUserToCaseAssociation(eventBody.caseId, event.requestContext)) {
                throw new Error('User is not associated with the case');
            }

            try {
                let eventDetailType = SharedLib.WorkflowEventDetailTypes.TRIGGER_WORKFLOW; // used when we will be triggering more stages
                const stepFunctionEvent = await StartJobInitializer.createEventForStepFunction({ // NOSONAR - false positive. Await required in lambda
                    caseId: eventBody.caseId
                });
                const cloudWatch = new SharedLib.CloudWatchMetrics(SharedLib.CloudwatchNamespace.CASE);
                await cloudWatch.publishMetrics(SharedLib.CaseStatus.IN_PROCESS);
                await SharedLib.updateCaseStatus(eventBody.caseId, SharedLib.CaseStatus.IN_PROCESS);
                const response = await SharedLib.publishEvent(stepFunctionEvent, eventDetailType); // NOSONAR - false positive. Await required in lambda
                return SharedLib.formatResponse(response)
            } catch (error) {
                console.error(error);
                throw error;
            }
        }
    } catch (error) {
        console.error(`Error processing request for ${event.resource}. Error is: ${error.message}`);
        return SharedLib.formatError(error);
    }
};
