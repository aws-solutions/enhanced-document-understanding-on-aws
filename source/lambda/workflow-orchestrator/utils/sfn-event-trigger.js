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
 * Creates a new SfnEvent to trigger the next workflow. Only returns the 'detail' portion
 * of the event. The `EventDispatcher.publishEvent` uses `putEvents` api to set event source.
 * @param {*} event
 * @returns
 */
exports.generateSfnEventDetail = (event) => {
    console.log('Creating next event');
    const nextStatus = this.selectNextStatus({
        stage: event.detail.case.stage,
        workflows: event.detail.case.workflows
    });

    console.log(`nextStatus: ${nextStatus}`);

    const nextStage =
        nextStatus == SharedLib.WorkflowStatus.INITIATE
            ? this.selectNextStage({
                  stage: event.detail.case.stage,
                  workflows: event.detail.case.workflows
              })
            : event.detail.case.stage;

    console.log(`nextStage: ${nextStage}`);

    event.detail.case.status = nextStatus;
    event.detail.case.stage = nextStage;
    return event.detail;
};

/**
 * Given the current status and workflows required for a case it selects
 * the next status. If current status equals last element of workflows list
 * then status is set to 'complete', otherwise it is set to 'initiate'
 * @param {Object} params
 * @param {string} params.stage Current stage
 * @param {string[]} params.workflows list of required workflows for case
 * @returns {string} nextStatus
 */
exports.selectNextStatus = (params) => {
    const stage = params.stage;
    const workflows = params.workflows;
    const curStageIndex = workflows.findIndex((s) => stage.toLowerCase() === s.toLowerCase());
    if (curStageIndex === workflows.length - 1) {
        return SharedLib.WorkflowStatus.COMPLETE;
    } else {
        return SharedLib.WorkflowStatus.INITIATE;
    }
};

/**
 * Selects the next stage
 * @param {Object} params
 * @param {string} params.stage Current stage
 * @param {string[]} params.workflows list of required workflows for case
 * @returns {string} nextStage
 */
exports.selectNextStage = (params) => {
    const stage = params.stage;
    const workflows = params.workflows;
    const curStageIndex = workflows.findIndex((s) => stage.toLowerCase() === s.toLowerCase());
    try {
        return workflows[curStageIndex + 1];
    } catch (error) {
        console.error('The next stage index out of bounds of workflows list.');
        throw error;
    }
};
