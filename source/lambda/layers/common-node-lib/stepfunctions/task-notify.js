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

const AWS = require('aws-sdk');
const UserAgentConfig = require('aws-node-user-agent-config');

let stepfunctions;

/**
 * Initialize AWS StepFunctions client for sending status
 *
 * @returns
 */
function _init_() {
    if (stepfunctions === undefined) {
        stepfunctions = new AWS.StepFunctions(UserAgentConfig.customAwsConfig());
    }

    return stepfunctions;
}

/**
 * Sends successful task status back to the step function
 *
 * @param {Object} output
 * @param {String} taskToken
 * @returns
 */
async function sendTaskSuccess(output, taskToken) {
    console.debug(`Sending successful output, task token is: ${taskToken}`);
    const _sfn = _init_();

    try {
        return await _sfn
            .sendTaskSuccess({
                output: JSON.stringify(output),
                taskToken: taskToken
            })
            .promise();
    } catch (error) {
        console.error('Sending success failed, hence now trying to send failure status');
        await sendTaskFailure(error, taskToken);
    }
}

/**
 * Sends failure task status back to the step function
 *
 * @param {Object} error
 * @param {String} taskToken
 * @returns
 */
async function sendTaskFailure(error, taskToken) {
    console.debug(`Sending failure output, task token is: ${taskToken}`);
    const _sfn = _init_();
    const MAX_ERROR_STR_LENGTH = 256;

    // prettier-ignore
    try {
        return await _sfn
            .sendTaskFailure({
                taskToken: taskToken,
                cause: error.message,
                error: JSON.stringify(error).substring(0, MAX_ERROR_STR_LENGTH)
            })
            .promise();
    } catch (error) {  // NOSONAR - javascript:S1117 - error local to function
        console.error('Sending failure status failed');
        throw error;
    }
}

/**
 * Sends heartbeat task status to the step function
 *
 * @param {String} taskToken
 * @returns
 */
async function sendTaskHeartbeat(taskToken) {
    console.debug(`Sending heart beat, task token is ${taskToken}`);
    const _sfn = _init_();

    try {
        return await _sfn
            .sendTaskHeartbeat({
                taskToken: taskToken
            })
            .promise();
    } catch (error) {
        console.error(`Error sending heart beat for task token: ${taskToken}`);
        throw error;
    }
}

module.exports = { sendTaskSuccess, sendTaskFailure, sendTaskHeartbeat };
