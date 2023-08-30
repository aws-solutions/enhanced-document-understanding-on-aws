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

let SNS_TOPIC_ARN;

/**
 * Check the Lambda environment variables for SNS. It sets:
 *
 * `SNS_TOPIC_ARN`: This value sets the name of the topic that the notification is published to
 * If not set, it will throw an error.
 *
 */
exports.checkSNSEnvSetup = async () => {
    if (process.env.SNS_TOPIC_ARN) {
        SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
        console.debug(`SNS_TOPIC_ARN is: ${SNS_TOPIC_ARN}`);
    } else {
        throw new Error('SNS_TOPIC_ARN Lambda Environment variable not set.');
    }
};

/**
 * Method to send the SNS notification.
 * This method should be called after the @checkSNSEnvSetup method has been called.
 *
 * @param {*} message
 * @param {*} subject
 * @param {*} topicArn
 *
 * @returns
 */
exports.sendSNSNotification = async (message, subject = 'Document Processing Update', topicArn = SNS_TOPIC_ARN) => {
    if (!SNS_TOPIC_ARN) {
        await this.checkSNSEnvSetup();
    }
    const sns = new AWS.SNS(UserAgentConfig.customAwsConfig());

    const params = {
        Message: message,
        Subject: subject,
        TopicArn: topicArn
    };
    return sns.publish(params).promise();
};
