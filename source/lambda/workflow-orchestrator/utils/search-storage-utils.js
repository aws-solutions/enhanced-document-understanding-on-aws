// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
