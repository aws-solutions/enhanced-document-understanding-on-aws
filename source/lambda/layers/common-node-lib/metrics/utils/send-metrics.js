// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const AWS = require('aws-sdk');
const UserAgentConfig = require('aws-node-user-agent-config');

/**
 * Makes the call to cloudwatch for the provided params to send the metrics
 *
 * @param {Object} params Contains the parameters to be passed on to the cloudwatch metrics call.
 */
exports.sendCloudWatchMetrics = async (namespace, params) => {
    console.log(`Publishing cw metrics with params: ${JSON.stringify(params)}`);
    try {
        const cloudWatchClient = new AWS.CloudWatch(UserAgentConfig.customAwsConfig());
        const data = await cloudWatchClient.putMetricData(params).promise();
        console.log(`Published cw metrics to ${namespace}.`);
        return data;
    } catch (error) {
        console.error(`Failed to publish cw metrics with params: ${JSON.stringify(params)}. Error: ${error.message}`);
        return null;
    }
};
