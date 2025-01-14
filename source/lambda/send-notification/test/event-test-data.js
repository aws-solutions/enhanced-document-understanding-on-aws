// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';
const { EventSources, WorkflowEventDetailTypes } = require('common-node-lib');

exports.expectedS3ResponseDocProcessFailed = {
    Body: 'Hello\n\nYour case with ID <<detail.case.id>> failed to process.\n\nThank You.'
};
exports.expectedS3ResponseDocProcessSuccess = {
    Body: 'Hello\n\nYour document <<documentName>> has been processed successfully.\n\nThank You.'
};
exports.expectedS3ResponseDocUploadFailed = {
    Body: 'Hello\n\nYour document <<documentName>> failed to upload. Please try again.\n\nThank You.'
};
exports.expectedS3ResponseDocUploadSuccess = {
    Body: 'Hello\n\nYour document <<documentName>> has been uploaded successfully.\n\nThank You.'
};

exports.exampleEventProcessingSuccess = {
    'id': 'fake-id',
    'detail-type': WorkflowEventDetailTypes.PROCESSING_COMPLETE,
    'source': 'aws.states',
    'account': '123456789012',
    'time': '2019-02-26T19:42:21Z',
    'region': 'us-east-1',
    'resources': ['arn:aws:states:us-east-1:000000000000:execution:fake-state-machine-name:fake-execution-name'],
    'taskToken': 'fake-token1',
    'detail': {
        'documentID': 'abc123',
        'documentName': 'My Passport',
        'stage': 'upload',
        'status': 'success'
    }
};

exports.exampleEventProcessingFailed = {
    'version': '0',
    'id': '1a552327-18ac-082b-e25a-4f3745ac1670',
    'detail-type': 'workflow_processing_failure',
    'source': 'app.idp',
    'account': '123456789012',
    'time': '2023-01-17T20:33:43Z',
    'region': 'us-east-1',
    'resources': ['statemachine', 'statemachine-execution'],
    'detail': {
        'version': '0',
        'id': '4a5e83da-2588-ae62-0214-a51ee022a226',
        'detail-type': WorkflowEventDetailTypes.PROCESSING_FAILURE,
        'source': `${EventSources.WORKFLOW_ORCHESTRATOR}.app.idp`,
        'account': '123456789012',
        'time': '2023-01-11T23:45:40Z',
        'region': 'us-east-1',
        'resources': [],
        'detail': {
            'case': {
                'id': 'fake-id',
                'status': 'failure',
                'stage': 'textract',
                'workflows': ['textract'],
                'documentList': [
                    {
                        'id': 'doc-f80d8e82-b17d-43e5-9a60-b3e9e6311d73',
                        'piiFlag': true,
                        'selfCertifiedDocType': 'passport',
                        'processingType': 'sync',
                        's3Prefix': 'prefix.jpg',
                        'documentWorkflow': ['textract']
                    }
                ]
            }
        },
        'error': {
            'Error': 'fake error',
            'Cause': 'fake cause'
        }
    }
};

exports.expectedProcessingFailedMessage = 'Hello\n\nYour case with ID "fake-id" failed to process.\n\nThank You.';
