// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
