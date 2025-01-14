// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const utils = require('./index');
const SharedLib = require('common-node-lib');
const { checkTextractSyncEnvSetup } = require('./utils/sync');

exports.handler = async (event, context) => {
    this.checkEnvSetup();

    const requestAccountId = SharedLib.getAccountIdFromLambdaContext(context);
    await SharedLib.processRecordsSync(event.Records, utils.runSyncTextractJob, requestAccountId);
};

exports.checkEnvSetup = () => {
    checkTextractSyncEnvSetup();
};
