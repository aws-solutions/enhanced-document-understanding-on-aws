// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const SharedLib = require('common-node-lib');
const comprehendSync = require('./utils/sync');

exports.handler = async (event) => {
    console.debug('Entity Detection Sync - Lambda invoked. Now check for Lambda environment variables');
    this.checkEnvSetup();

    await SharedLib.processRecordsSync(event.Records, comprehendSync.runSyncEntityDetection);
};

exports.checkEnvSetup = () => {
    comprehendSync.checkComprehendSyncEnvSetup();
};
