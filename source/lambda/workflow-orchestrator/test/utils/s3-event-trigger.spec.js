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
 **********************************************************************************************************************/

'use strict';

const S3Trigger = require('../../utils/s3-event-trigger');
const ConfigLoader = require('../../config/ddb-loader');
const { configJSON } = require('../../test/config/config-data');
const SharedLib = require('common-node-lib');
const { CloudWatchContext } = require('../../../layers/common-node-lib/metrics/cloudwatch');

describe('When an event corresponds to document upload from user', () => {
    beforeEach(() => {
        process.env.S3_UPLOAD_PREFIX = 'initial';
    });

    it('succeeds when parsing filekey', () => {
        const filekey = 'initial/fake-caseId/docId.txt';

        expect(S3Trigger.parseFileKey(filekey)).toEqual({
            caseId: 'fake-caseId',
            uploadPrefix: 'initial',
            fileName: 'docId.txt'
        });
    });
    it('succeeds when filekey contains initial', () => {
        const filekey = 'initial/fake-caseId/docId.txt';
        expect(S3Trigger.isInitialUploadEvent(filekey)).toBe(true);
    });

    it('succeeds when env is set correctly', () => {
        const filekey = 'fake-caseId/output/docId.txt';
        expect(S3Trigger.isInitialUploadEvent(filekey)).toBe(false);
    });

    it('Throws error if filekey is invalid', () => {
        const filekey = 'fake-invalid-filekey.txt';
        try {
            S3Trigger.isInitialUploadEvent(filekey);
        } catch (error) {
            expect(error.message).toBe('Invalid filekey');
        }
    });

    afterEach(() => {
        delete process.env.S3_UPLOAD_PREFIX;
    });
});

describe('When parsing the workflow config', () => {
    beforeEach(() => {
        process.env.S3_UPLOAD_PREFIX = 'initial';
    });
    it('Should correctly return the required property from the MinRequiredDocuments list', () => {
        expect(S3Trigger.getPropertyFromDocConfigs(configJSON.MinRequiredDocuments, 'DocumentType')).toEqual([
            'Passport',
            'BankAccount'
        ]);
        expect(S3Trigger.getPropertyFromDocConfigs(configJSON.MinRequiredDocuments, 'WorkflowsToProcess')).toEqual([
            [SharedLib.WorkflowStageNames.TEXTRACT, SharedLib.WorkflowStageNames.REDACTION],
            [
                SharedLib.WorkflowStageNames.TEXTRACT,
                SharedLib.WorkflowStageNames.PII,
                SharedLib.WorkflowStageNames.REDACTION
            ]
        ]);
        expect(S3Trigger.getPropertyFromDocConfigs(configJSON.MinRequiredDocuments, 'MaxSize')).toEqual([
            '5',
            undefined
        ]);
        expect(S3Trigger.getPropertyFromDocConfigs(configJSON.MinRequiredDocuments, 'FileTypes')).toEqual([
            ['.pdf', '.png', '.jpeg', '.jpg'],
            ['.pdf', '.png', '.jpeg', '.jpg']
        ]);
    });
    afterEach(() => {
        delete process.env.S3_UPLOAD_PREFIX;
    });
});

describe('When a stepfunction workflow trigger event is successfully created', () => {
    let configLoaderSpy;
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

    const stubbedAnalyzeDocParams = {
        PiiFlag: true,
        RunTextractAnalyzeAction: true,
        AnalyzeDocFeatureType: ['TABLES', 'FORMS', 'SIGNATURES']
    };

    beforeEach(() => {
        process.env.CASE_DDB_TABLE_NAME = 'testTable';
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.WORKFLOW_CONFIG_TABLE_NAME = 'fake-workflow-config-table';

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

    it('should load the config successfully', async () => {
        const loadedConfig = await S3Trigger.loadConfig();
        expect(loadedConfig).toEqual(configJSON);
    });

    it('successfully formats the payload for a single document', async () => {
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

        const loadedConfig = await S3Trigger.loadConfig();
        const docPayload = await S3Trigger.createDocumentPayload(dataRecord.Items[0], loadedConfig);
        expect(JSON.stringify(docPayload)).toBe(JSON.stringify(expectedPayload));
    });

    it('successfully formats the payload for a single document with textract analyze action', async () => {
        const configJsonStubbed = JSON.parse(JSON.stringify(configJSON));
        configJsonStubbed.MinRequiredDocuments[0] = {
            ...configJsonStubbed.MinRequiredDocuments[0],
            ...stubbedAnalyzeDocParams
        };

        const expectedPayload = {
            document: {
                id: 'fake-doc-id',
                caseId: 'fake-case-id',
                piiFlag: true,
                runTextractAnalyzeAction: true,
                analyzeDocFeatureType: ['TABLES', 'FORMS', 'SIGNATURES'],

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

        console.log(`configJsonStubbed: ${configJsonStubbed}`);

        const docPayload = S3Trigger.createDocumentPayload(dataRecord.Items[0], configJsonStubbed);
        expect(docPayload).toEqual(expectedPayload);
    });

    it('successfully create an event to trigger stepFunction workflow', async () => {
        jest.spyOn(S3Trigger, 'loadConfig').mockImplementation(async (configName) => {
            const configJsonStubbed = JSON.parse(JSON.stringify(configJSON));
            configJsonStubbed.MinRequiredDocuments[0] = {
                ...configJsonStubbed.MinRequiredDocuments[0],
                ...stubbedAnalyzeDocParams
            };
            return configJsonStubbed;
        });

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
                            piiFlag: true,
                            runTextractAnalyzeAction: true,
                            analyzeDocFeatureType: ['TABLES', 'FORMS', 'SIGNATURES'],
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
        const eventPayload = await S3Trigger.createEventForStepFunction(params);

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

describe('When retrieving documents for a caseId from DDB table', () => {
    let getCaseSpy;
    const dataRecordSuccess = {
        Key: {
            CASE_ID: {
                S: 'fake-case-id'
            }
        },
        Count: 4,
        Items: [
            {
                DOCUMENT_ID: {
                    S: '0000'
                }
            },
            {
                UPLOADED_FILE_NAME: {
                    S: 'testFile'
                },
                DOCUMENT_TYPE: {
                    S: 'BankAccount'
                },
                DOCUMENT_ID: {
                    S: 'fake-id-1'
                }
            },
            {
                UPLOADED_FILE_NAME: {
                    S: 'testFile'
                },
                DOCUMENT_TYPE: {
                    S: 'BankAccount'
                },
                DOCUMENT_ID: {
                    S: 'fake-id-2'
                }
            },
            {
                UPLOADED_FILE_NAME: {
                    S: 'testFile'
                },
                DOCUMENT_TYPE: {
                    S: 'passport'
                },
                DOCUMENT_ID: {
                    S: 'fake-id-3'
                }
            }
        ]
    };

    const dataRecordFail = {
        Key: {
            CASE_ID: {
                S: 'fake-case-id'
            }
        },
        Count: 1,
        Items: [
            {
                UPLOADED_FILE_NAME: {
                    S: 'testFile'
                },
                DOCUMENT_TYPE: {
                    S: 'bankaccount'
                },
                DOCUMENT_ID: {
                    S: 'fake-id'
                }
            }
        ]
    };

    const dataRecordInvalidDocs = {
        Key: {
            CASE_ID: {
                S: 'fake-case-id'
            }
        },
        Count: 2,
        Items: [
            {
                UPLOADED_FILE_NAME: {
                    S: 'testFile'
                },
                DOCUMENT_TYPE: {
                    S: 'passport'
                },
                DOCUMENT_ID: {
                    S: 'fake-id'
                }
            },
            {
                UPLOADED_FILE_NAME: {
                    S: 'testFile'
                },
                DOCUMENT_TYPE: {
                    S: 'passport'
                },
                DOCUMENT_ID: {
                    S: 'fake-id'
                }
            }
        ]
    };

    beforeEach(() => {
        process.env.CASE_DDB_TABLE_NAME = 'fake_table';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.WORKFLOW_CONFIG_TABLE_NAME = 'fake-workflow-config-table';
        process.env.AWS_REGION = 'us-east-1';

        const loadWorkflowConfigSpy = jest
            .spyOn(ConfigLoader, 'loadWorkflowConfig')
            .mockImplementation(async (configName) => {
                return configJSON;
            });
    });

    it('Should successfully validate to true if all required docs have been uploaded', async () => {
        jest.spyOn(CloudWatchContext.prototype, 'publishMetricsData').mockImplementation(() => {
            console.log('a concrete strategy was called.');
        });

        process.env.CASE_DDB_TABLE_NAME = 'fake-table';
        getCaseSpy = jest.spyOn(SharedLib, 'getCase').mockImplementation(async (params) => {
            return {
                Count: dataRecordSuccess.Count,
                Items: dataRecordSuccess.Items
            };
        });

        const response = await S3Trigger.isCaseUploadComplete({
            caseId: 'fake-case-id',
            configName: 'configTest'
        });
        expect(response).toBe(true);
    });

    it('Should successfully validate to false if any required doc is missing', async () => {
        process.env.CASE_DDB_TABLE_NAME = 'fake-table';
        getCaseSpy = jest.spyOn(SharedLib, 'getCase').mockImplementation(async (params) => {
            return {
                Count: dataRecordFail.Count,
                Items: dataRecordFail.Items
            };
        });

        const response = await S3Trigger.isCaseUploadComplete({
            caseId: 'fake-case-id',
            configName: 'configTest'
        });
        expect(response).toBe(false);
    });

    it('Should successfully vaidate to false if incorrect document types are uploaded', async () => {
        process.env.CASE_DDB_TABLE_NAME = 'fake-table';
        getCaseSpy = jest.spyOn(SharedLib, 'getCase').mockImplementation(async (params) => {
            return {
                Count: dataRecordInvalidDocs.Count,
                Items: dataRecordInvalidDocs.Items
            };
        });

        try {
            await S3Trigger.isCaseUploadComplete({
                caseId: 'fake-case-id',
                configName: 'configTest'
            });
        } catch (error) {
            expect(error.message).toBe('Invalid document type');
        }
    });

    afterAll(() => {
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.WORKFLOW_CONFIG_TABLE_NAME;
        delete process.env.AWS_SDK_USER_AGENT;
        jest.restoreAllMocks();
    });
});
