// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const USER_AGENT =
    '^(AwsSolution)\\/SO(\\d+)([a-zA-Z]*)\\/v(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$';

const usrAgentRegex = new RegExp(USER_AGENT);

exports.customAwsConfig = function () {
    checkEnvSetup();

    return {
        ...JSON.parse(process.env.AWS_SDK_USER_AGENT),
        region: process.env.AWS_REGION,
        maxRetries: 5
    };
};

const checkEnvSetup = () => {
    if (!process.env.AWS_SDK_USER_AGENT) {
        throw new Error('User-agent for SDK not set as environment variables');
    }

    const jsonUsrAgent = JSON.parse(process.env.AWS_SDK_USER_AGENT);

    if (!jsonUsrAgent.hasOwnProperty('customUserAgent')) {
        throw new Error('The environment variable JSON string does not have key "customUserAgent"');
    }

    if (!usrAgentRegex.test(jsonUsrAgent.customUserAgent)) {
        throw new Error(
            'User-agent for SDK does not meet the required format. The format should be "AwsSolution/SO<id>/v<version number>", where id is the numeric id of the solution and version is the semver version number format'
        );
    }
};
