// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const SharedLib = require('common-node-lib');

exports.configJSON = {
    'Name': 'default',
    'WorkflowSequence': [
        SharedLib.WorkflowStageNames.TEXTRACT,
        SharedLib.WorkflowStageNames.PII,
        SharedLib.WorkflowStageNames.ENTITY,
        SharedLib.WorkflowStageNames.REDACTION
    ],
    'MinRequiredDocuments': [
        {
            'DocumentType': 'Passport',
            'FileTypes': ['.pdf', '.png', '.jpeg', '.jpg'],
            'MaxSize': '5',
            'WorkflowsToProcess': [SharedLib.WorkflowStageNames.TEXTRACT, SharedLib.WorkflowStageNames.REDACTION],
            'NumDocuments': '1'
        },
        {
            'DocumentType': 'BankAccount',
            'FileTypes': ['.pdf', '.png', '.jpeg', '.jpg'],
            'WorkflowsToProcess': [
                SharedLib.WorkflowStageNames.TEXTRACT,
                SharedLib.WorkflowStageNames.PII,
                SharedLib.WorkflowStageNames.REDACTION
            ],
            'NumDocuments': '1'
        },
        {
            'DocumentType': 'Paystub',
            'FileTypes': ['.pdf', '.png', '.jpeg', '.jpg'],
            'WorkflowsToProcess': [
                SharedLib.WorkflowStageNames.TEXTRACT,
                SharedLib.WorkflowStageNames.PII,
                SharedLib.WorkflowStageNames.REDACTION
            ],
            'NumDocuments': '1'
        }
    ]
};

exports.workflowConfigName = 'fake-config';

exports.dynamoDBConfigResponse = {
    Key: {
        WorkflowConfigName: {
            S: this.workflowConfigName
        }
    },
    Item: {
        Name: {
            S: 'default'
        },
        WorkflowSequence: {
            L: [
                { S: SharedLib.WorkflowStageNames.TEXTRACT },
                { S: SharedLib.WorkflowStageNames.PII },
                { S: SharedLib.WorkflowStageNames.ENTITY },
                { S: SharedLib.WorkflowStageNames.REDACTION }
            ]
        },
        MinRequiredDocuments: {
            L: [
                {
                    M: {
                        DocumentType: {
                            S: 'Passport'
                        },
                        FileTypes: {
                            L: [{ S: '.pdf' }, { S: '.png' }, { S: '.jpeg' }, { S: '.jpg' }]
                        },
                        MaxSize: {
                            S: '5'
                        },
                        WorkflowsToProcess: {
                            L: [
                                { S: SharedLib.WorkflowStageNames.TEXTRACT },
                                { S: SharedLib.WorkflowStageNames.REDACTION }
                            ]
                        },
                        NumDocuments: { S: '1' }
                    }
                },
                {
                    M: {
                        DocumentType: {
                            S: 'BankAccount'
                        },
                        FileTypes: {
                            L: [{ S: '.pdf' }, { S: '.png' }, { S: '.jpeg' }, { S: '.jpg' }]
                        },
                        WorkflowsToProcess: {
                            L: [
                                { S: SharedLib.WorkflowStageNames.TEXTRACT },
                                { S: SharedLib.WorkflowStageNames.PII },
                                { S: SharedLib.WorkflowStageNames.REDACTION }
                            ]
                        },
                        NumDocuments: { S: '1' }
                    }
                },
                {
                    M: {
                        DocumentType: {
                            S: 'Paystub'
                        },
                        FileTypes: {
                            L: [{ S: '.pdf' }, { S: '.png' }, { S: '.jpeg' }, { S: '.jpg' }]
                        },
                        WorkflowsToProcess: {
                            L: [
                                { S: SharedLib.WorkflowStageNames.TEXTRACT },
                                { S: SharedLib.WorkflowStageNames.PII },
                                { S: SharedLib.WorkflowStageNames.REDACTION }
                            ]
                        },
                        NumDocuments: { S: '1' }
                    }
                }
            ]
        }
    },
    ConsumedCapacity: {
        TableName: process.env.WORKFLOW_CONFIG_TABLE_NAME
    }
};

exports.dynamoDbQueryResponse = {
    'Items': [],
    'Count': 0,
    'ScannedCount': 0
}
