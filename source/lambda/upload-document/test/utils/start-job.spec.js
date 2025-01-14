// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';
const ConfigLoader = require('../../config/ddb-loader');
const { configJSON } = require('../../test/config/config-data');
const SharedLib = require('common-node-lib');

const StartJobInitializer = require('../../utils/start-job');
jest.mock('../../config/ddb-loader');

describe('Process next event for work flow orchestrator', () => {
    const dataRecord = {
        Key: {
            CASE_ID: {
                S: 'fake-case-id'
            }
        },
        Count: 1,
        Items: [
            {
                CASE_ID: {
                    'S': 'fake-case-id'
                },
                DOCUMENT_ID: {
                    S: 'fake-doc-id'
                },
                BUCKET_NAME: {
                    S: 'fake-bucket'
                },
                S3_KEY: {
                    S: 'initial/fake-case-id/fake-doc-id.txt'
                },
                UPLOADED_FILE_EXTENSION: {
                    S: 'txt'
                },
                UPLOADED_FILE_NAME: {
                    S: 'testFile'
                },
                DOCUMENT_TYPE: {
                    S: 'passport'
                },
                UPLOADED_FILE_EXTENSION: {
                    S: '.pdf'
                },
                UPLOADED_FILE_NAME: {
                    S: 'single-page-Insulin.pdf'
                }
            }
        ]
    };
    beforeEach(() => {
        process.env.CASE_DDB_TABLE_NAME = 'test-table';
        process.env.WORKFLOW_CONFIG_TABLE_NAME = 'test-table';

        process.env.UPLOAD_DOCS_BUCKET_NAME = 'testBucket';
        process.env.S3_UPLOAD_PREFIX = 'initial';
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';

        jest.spyOn(ConfigLoader, 'loadWorkflowConfig').mockImplementation(async (configName) => {
            return configJSON;
        });

        jest.spyOn(SharedLib, 'getCase').mockImplementation(async (params) => {
            return {
                Count: dataRecord.Count,
                Items: dataRecord.Items
            };
        });
    });

    it('should start a job', async () => {
        const expectedPayload = {
            document: {
                id: 'fake-doc-id',
                caseId: 'fake-case-id',
                piiFlag: false,
                runTextractAnalyzeAction: false,
                selfCertifiedDocType: 'passport',
                processingType: 'sync',
                s3Bucket: 'fake-bucket',
                s3Prefix: 'initial/fake-case-id/fake-doc-id.txt',
                documentWorkflow: [SharedLib.WorkflowStageNames.TEXTRACT, SharedLib.WorkflowStageNames.REDACTION],
                uploadedFileExtension: '.pdf',
                uploadedFileName: 'single-page-Insulin.pdf'
            },
            inferences: {}
        };

        const result = await StartJobInitializer.createEventForStepFunction({ caseId: 'fake-case-id' });
        expect(result.case.status).toEqual(SharedLib.WorkflowStatus.INITIATE);
    });

    it('successfully create an event to trigger stepFunction workflow', async () => {
        const expectedPayload = {
            case: {
                id: 'fake-case-id',
                status: 'initiate',
                stage: 'textract',
                workflows: [
                    SharedLib.WorkflowStageNames.TEXTRACT,
                    SharedLib.WorkflowStageNames.PII,
                    SharedLib.WorkflowStageNames.ENTITY,
                    SharedLib.WorkflowStageNames.REDACTION
                ],
                documentList: [
                    {
                        document: {
                            id: 'fake-doc-id',
                            caseId: 'fake-case-id',
                            piiFlag: false,
                            runTextractAnalyzeAction: false,
                            selfCertifiedDocType: 'passport',
                            processingType: 'sync',
                            s3Bucket: 'fake-bucket',
                            s3Prefix: 'initial/fake-case-id/fake-doc-id.txt',
                            documentWorkflow: [
                                SharedLib.WorkflowStageNames.TEXTRACT,
                                SharedLib.WorkflowStageNames.REDACTION
                            ],
                            uploadedFileExtension: '.pdf',
                            uploadedFileName: 'single-page-Insulin.pdf'
                        },
                        inferences: {}
                    }
                ]
            }
        };
        const params = {
            caseId: 'fake-case-id',
            configName: 'config0'
        };
        const eventPayload = await StartJobInitializer.createEventForStepFunction(params);

        expect(eventPayload).toEqual(expectedPayload);
    });

    afterEach(() => {
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.WORKFLOW_CONFIG_TABLE_NAME;
        jest.restoreAllMocks();
    });
});
