// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const ENTITY_DETECTION_STAGE_NAME = 'ENTITY-DETECTION';
const SharedLib = require('common-node-lib');
const { runSyncEntityDetection } = require('./util/sync');

module.exports = {
    SharedLib,
    ENTITY_DETECTION_STAGE_NAME,
    runSyncEntityDetection
};
