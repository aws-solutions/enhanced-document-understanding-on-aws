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

/**
 * Validates the input parameters.
 *
 * @param {Object} casePayload  An object containing the payload for the current case.
 */
exports.validateInputParams = (casePayload) => {
    if (casePayload.case.documentList.length <= 0) {
        throw new Error(`No documents found for the case: ${casePayload.case.id}`);
    }
};

/**
 * Validates the workFlow configurations.
 *
 * @param {Array.<string>} workFlows the workflows that case run against.
 */
exports.validateWorkFlows = (workFlows) => {
    if (workFlows === undefined || workFlows.length === 0) {
        throw new Error('Workflow is not configured, aborting OpenSearch upload.');
    }

    if (!workFlows.includes(SharedLib.WorkflowStageNames.TEXTRACT)) {
        throw new Error('Workflow should at least runs Textract, aborting OpenSearch upload.');
    }
};

/**
 * Combines textract results for a doc into a single string to be indexed by kendra
 *
 * @param {Array[Object]} textractResponse an array of the textract response objects for each page
 * @returns {String} text extracted from textract response as a single string
 */
exports.combineTextractLines = (textractResponse) => {
    let text = '';
    for (let page of textractResponse) {
        page.Blocks.forEach((block) => {
            if (block.BlockType === SharedLib.TextractBlockTypes.LINE) {
                text = text.concat(block.Text, ' ');
            }
        });
    }
    return text;
};

/**
 * Parse the caseId from the event to return the userId.
 * The userId for a case was created from the cognito authorization token
 * when a case is created.
 * @param {Object} event
 * @returns {string} userId
 */
exports.getUserIdFromEvent = (event) => {
    const caseId = event.case.id;
    console.log(`CaseId: ${caseId}`);
    return caseId.split(':')[0];
};
