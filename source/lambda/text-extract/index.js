// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const TEXTRACT_WORKFLOW_STAGE = 'DOCUMENT_TEXTRACT';
const { runSyncTextractJob, startSyncTextDetectionJob } = require('./utils/sync');
const {
    extractS3UriComponents,
    supportedImageTypes,
    documentTypes,
    docTypeMapping,
    getTextractApiType
} = require('./utils/generic');

module.exports = {
    TEXTRACT_WORKFLOW_STAGE,
    runSyncTextractJob,
    startSyncTextDetectionJob,
    extractS3UriComponents,
    supportedImageTypes,
    documentTypes,
    docTypeMapping,
    getTextractApiType
};
