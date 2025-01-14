// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable no-unused-vars */

'use strict';

const AWSMock = require('aws-sdk-mock');
const {
    inputBodies,
    sqsMessages,
    syncTextractDetectTextSuccessResponse,
    syncTextractDocumentSuccessResponse,
    syncTextractIdSuccessResponse,
    syncTextractExpenseSuccessResponse
} = require('../event-test-data');
const syncUtils = require('../../utils/sync');
const utils = require('../../utils/generic');
const SharedLib = require('common-node-lib');
const PdfSplitter = require('../../utils/pdf-splitter');

jest.mock('common-node-lib');

describe('Text-extraction (textract Utils): Checking Env Setup', () => {
    beforeEach(() => {
        process.env.S3_MULTI_PAGE_PDF_PREFIX = 'fake-prefix';
    });

    it('Should succeed when env is correctly set', () => {
        expect(syncUtils.checkTextractSyncEnvSetup()).toBe(); // returns nothing
    });

    it('Should throw error when S3_MULTI_PAGE_PDF_PREFIX is not correctly set', () => {
        delete process.env.S3_MULTI_PAGE_PDF_PREFIX;
        expect(() => {
            syncUtils.checkTextractSyncEnvSetup();
        }).toThrow();
    });

    afterAll(() => {
        delete process.env.S3_MULTI_PAGE_PDF_PREFIX;
    });
});

describe('When creating a list of keys from the object key', () => {
    beforeAll(() => {
        process.env.DOCUMENT_BUCKET_NAME = 'test-bucket';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
    });

    beforeEach(() => {
        jest.spyOn(PdfSplitter, 'splitAndSavePdfPages').mockImplementation((params) => {
            expect(params.s3Key).toBeDefined();
            expect(params.fileExtension).toBeDefined();

            if (params.fileExtension === 'pdf') {
                return [
                    'fake-user-id:fake-case-id/initial/multi-page-pdf/fake-filename/0.pdf',
                    'fake-user-id:fake-case-id/initial/multi-page-pdf/fake-filename/1.pdf'
                ];
            } else {
                return [params.s3Key];
            }
        });
    });

    it('Should extract and return pages if input file is multipage pdf', async () => {
        expect(
            await syncUtils.createObjectKeyList({
                s3Key: 'fake-key.pdf',
                fileExtension: 'pdf'
            })
        ).toStrictEqual([
            'fake-user-id:fake-case-id/initial/multi-page-pdf/fake-filename/0.pdf',
            'fake-user-id:fake-case-id/initial/multi-page-pdf/fake-filename/1.pdf'
        ]);
    });

    it('Should extract and return pages if input file is not a pdf', async () => {
        expect(
            await syncUtils.createObjectKeyList({
                s3Key: 'fake-key.jpg',
                fileExtension: 'jpg'
            })
        ).toStrictEqual(['fake-key.jpg']);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        delete process.env.DOCUMENT_BUCKET_NAME;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.AWS_REGION;
    });
});

describe('Text-extraction Sync (textract Utils): When provided with correct inputs', () => {
    let mockGetTextractApiType,
        mockStartAnalyzeJob,
        mockSyncTextDetection,
        actualResponse,
        s3InferenceSpy,
        ddbInferenceSpy,
        consoleDebugSpy,
        publishDebugSpy;

    beforeAll(() => {
        // generates a fake response for each inference done for the given doc
        s3InferenceSpy = jest
            .spyOn(SharedLib, 'uploadDocumentInferences')
            .mockImplementation(async (documentDetail) => {
                let uploadedInferences = [];
                for (const inferenceType in documentDetail.inferences) {
                    uploadedInferences.push({
                        caseId: documentDetail.document.caseId,
                        documentId: documentDetail.document.id,
                        inferenceType: inferenceType,
                        s3Key: `${documentDetail.document.caseId}/${documentDetail.document.id}/${inferenceType}.json`
                    });
                }
                return uploadedInferences;
            });

        // generates a fake response for each inference passed to it
        ddbInferenceSpy = jest.spyOn(SharedLib, 'updateInferences').mockImplementation(async (inferencesToUpdate) => {
            let result = [];
            for (const _inference in inferencesToUpdate) {
                result.push('fake ddb response');
            }
            return result;
        });

        process.env.DEFAULT_ANALYZE_DOC_FEATURE_TYPE = 'TABLES';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.AWS_REGION = 'us-east-1';
        process.env.S3_INFERENCE_BUCKET_NAME = 'fake-bucket';
    });

    describe('isAnalyzeDocParamValid: should check if Textract.AnalyzeDocument can be executed', () => {
        it('should return false if analyzeDocFeatureType is undefined', () => {
            const docInfo = {
                s3Prefix: 'fake-prefix',
                analyzeDocFeatureType: null
            };
            expect(syncUtils.isAnalyzeDocParamValid(docInfo.analyzeDocFeatureType)).toBe(false);
        });

        it('should return false when analyzeDocFeatureType is not present', () => {
            const docInfo = {
                s3Prefix: 'fake-prefix'
            };
            expect(syncUtils.isAnalyzeDocParamValid(docInfo.analyzeDocFeatureType)).toBe(false);
        });

        it('should return true when analyzeDocFeatureType is valid without QUERIES', () => {
            const docInfo = {
                s3Prefix: 'fake-prefix',
                analyzeDocFeatureType: ['TABLES', 'FORMS', 'SIGNATURES']
            };
            expect(syncUtils.isAnalyzeDocParamValid(docInfo.analyzeDocFeatureType)).toBe(true);
        });

        it('should throw an error when analyzeDocFeatureType list contains invalid values', () => {
            const docInfo = {
                s3Prefix: 'fake-prefix',
                analyzeDocFeatureType: ['TABLES', 'FORMS', 'SIGNATURES', 'INVALID']
            };
            try {
                syncUtils.isAnalyzeDocParamValid(docInfo.analyzeDocFeatureType);
            } catch (error) {
                expect(error.message).toBeDefined();
            }
        });
    });

    describe('runSyncTextractJob: When provided with correct inputs', () => {
        const mockRequestAccountId = 'fake-account-id';

        it('should run runSyncTextractJob with analyzeDocument', async () => {
            const testCaseRecordIndex = 0;

            mockGetTextractApiType = jest.spyOn(utils, 'getTextractApiType');
            mockGetTextractApiType = mockGetTextractApiType.mockImplementation((_selfCertifiedDocType) => {
                return 'Other';
            });

            mockSyncTextDetection = jest
                .spyOn(syncUtils, 'startSyncTextDetectionJob')
                .mockImplementation((_taskToken, _bucket, _key) => {
                    return {
                        [SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT]: syncTextractDetectTextSuccessResponse
                    };
                });

            mockStartAnalyzeJob = jest
                .spyOn(syncUtils, 'startAnalyzeJob')
                .mockImplementation((_taskToken, _bucket, _key, _documentType, _featureTypes) => {
                    return {
                        [SharedLib.InferenceTypes.TEXTRACT_ANALYZE_DOCUMENT]: syncTextractDocumentSuccessResponse
                    };
                });

            // this first sqs record will trigger only textract-analyzeDoc
            actualResponse = await syncUtils.runSyncTextractJob(
                'taskToken1',
                sqsMessages.Records[testCaseRecordIndex],
                mockRequestAccountId
            );
            expect(actualResponse).toStrictEqual({
                'inferences': {
                    [SharedLib.InferenceTypes
                        .TEXTRACT_DETECT_TEXT]: `${inputBodies[testCaseRecordIndex].input.document.caseId}/${inputBodies[testCaseRecordIndex].input.document.id}/${SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT}.json`,
                    [SharedLib.InferenceTypes
                        .TEXTRACT_ANALYZE_DOCUMENT]: `${inputBodies[testCaseRecordIndex].input.document.caseId}/${inputBodies[testCaseRecordIndex].input.document.id}/${SharedLib.InferenceTypes.TEXTRACT_ANALYZE_DOCUMENT}.json`
                }
            });

            // checking that the correct data gets passed to the upload functions
            const expectedUploadPayload = {
                document: inputBodies[testCaseRecordIndex].input.document,
                inferences: {
                    [SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT]: [syncTextractDetectTextSuccessResponse],
                    [SharedLib.InferenceTypes.TEXTRACT_ANALYZE_DOCUMENT]: [syncTextractDocumentSuccessResponse]
                }
            };
            expect(s3InferenceSpy).toHaveBeenCalledWith(expectedUploadPayload, mockRequestAccountId);
            const expectedS3Response = [
                {
                    'caseId': inputBodies[testCaseRecordIndex].input.document.caseId,
                    'documentId': inputBodies[testCaseRecordIndex].input.document.id,
                    'inferenceType': SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT,
                    's3Key': `${inputBodies[testCaseRecordIndex].input.document.caseId}/${inputBodies[testCaseRecordIndex].input.document.id}/${SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT}.json`
                },
                {
                    'caseId': inputBodies[testCaseRecordIndex].input.document.caseId,
                    'documentId': inputBodies[testCaseRecordIndex].input.document.id,
                    'inferenceType': SharedLib.InferenceTypes.TEXTRACT_ANALYZE_DOCUMENT,
                    's3Key': `${inputBodies[testCaseRecordIndex].input.document.caseId}/${inputBodies[testCaseRecordIndex].input.document.id}/${SharedLib.InferenceTypes.TEXTRACT_ANALYZE_DOCUMENT}.json`
                }
            ];
            expect(ddbInferenceSpy).toHaveBeenCalledWith(expectedS3Response);
        });

        it('should run runSyncTextractJob with analyzeExpense', async () => {
            const testCaseRecordIndex = 1;
            mockGetTextractApiType = jest
                .spyOn(utils, 'getTextractApiType')
                .mockImplementation((_selfCertifiedDocType) => {
                    return 'Expense';
                });

            mockSyncTextDetection = jest
                .spyOn(syncUtils, 'startSyncTextDetectionJob')
                .mockImplementation((_taskToken, _bucket, _key) => {
                    return {
                        [SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT]: syncTextractDetectTextSuccessResponse
                    };
                });

            mockStartAnalyzeJob = jest
                .spyOn(syncUtils, 'startAnalyzeJob')
                .mockImplementation((_taskToken, _bucket, _key, _documentType, _featureTypes) => {
                    return {
                        [SharedLib.InferenceTypes.TEXTRACT_ANALYZE_EXPENSE]: syncTextractExpenseSuccessResponse
                    };
                });

            // this first sqs record will trigger only textract-analyzeDoc
            actualResponse = await syncUtils.runSyncTextractJob(
                'taskToken1',
                sqsMessages.Records[testCaseRecordIndex],
                mockRequestAccountId
            );
            expect(actualResponse).toStrictEqual({
                'inferences': {
                    [SharedLib.InferenceTypes
                        .TEXTRACT_DETECT_TEXT]: `${inputBodies[testCaseRecordIndex].input.document.caseId}/${inputBodies[testCaseRecordIndex].input.document.id}/${SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT}.json`,
                    [SharedLib.InferenceTypes
                        .TEXTRACT_ANALYZE_EXPENSE]: `${inputBodies[testCaseRecordIndex].input.document.caseId}/${inputBodies[testCaseRecordIndex].input.document.id}/${SharedLib.InferenceTypes.TEXTRACT_ANALYZE_EXPENSE}.json`
                }
            });

            // checking that the correct data gets passed to the upload functions
            const expectedUploadPayload = {
                document: inputBodies[testCaseRecordIndex].input.document,
                inferences: {
                    [SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT]: [syncTextractDetectTextSuccessResponse],
                    [SharedLib.InferenceTypes.TEXTRACT_ANALYZE_EXPENSE]: [syncTextractExpenseSuccessResponse]
                }
            };
            expect(s3InferenceSpy).toHaveBeenCalledWith(expectedUploadPayload, mockRequestAccountId);
            const expectedS3Response = [
                {
                    'caseId': inputBodies[testCaseRecordIndex].input.document.caseId,
                    'documentId': inputBodies[testCaseRecordIndex].input.document.id,
                    'inferenceType': SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT,
                    's3Key': `${inputBodies[testCaseRecordIndex].input.document.caseId}/${inputBodies[testCaseRecordIndex].input.document.id}/${SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT}.json`
                },
                {
                    'caseId': inputBodies[testCaseRecordIndex].input.document.caseId,
                    'documentId': inputBodies[testCaseRecordIndex].input.document.id,
                    'inferenceType': SharedLib.InferenceTypes.TEXTRACT_ANALYZE_EXPENSE,
                    's3Key': `${inputBodies[testCaseRecordIndex].input.document.caseId}/${inputBodies[testCaseRecordIndex].input.document.id}/${SharedLib.InferenceTypes.TEXTRACT_ANALYZE_EXPENSE}.json`
                }
            ];
            expect(ddbInferenceSpy).toHaveBeenCalledWith(expectedS3Response);
        });

        it('should run runSyncTextractJob with analyzeId', async () => {
            const testCaseRecordIndex = 2;
            mockGetTextractApiType = jest
                .spyOn(utils, 'getTextractApiType')
                .mockImplementation((_selfCertifiedDocType) => {
                    return 'Id';
                });

            mockSyncTextDetection = jest
                .spyOn(syncUtils, 'startSyncTextDetectionJob')
                .mockImplementation((_taskToken, _bucket, _key) => {
                    return {
                        [SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT]: syncTextractDetectTextSuccessResponse
                    };
                });

            mockStartAnalyzeJob = jest
                .spyOn(syncUtils, 'startAnalyzeJob')
                .mockImplementation((_taskToken, _bucket, _key, _documentType, _featureTypes) => {
                    return {
                        [SharedLib.InferenceTypes.TEXTRACT_ANALYZE_ID]: syncTextractIdSuccessResponse,
                        [SharedLib.InferenceTypes.TEXTRACT_ANALYZE_DOCUMENT]: syncTextractDocumentSuccessResponse
                    };
                });
            actualResponse = await syncUtils.runSyncTextractJob(
                'taskToken1',
                sqsMessages.Records[testCaseRecordIndex],
                mockRequestAccountId
            );
            expect(actualResponse).toStrictEqual({
                'inferences': {
                    [SharedLib.InferenceTypes
                        .TEXTRACT_DETECT_TEXT]: `${inputBodies[testCaseRecordIndex].input.document.caseId}/${inputBodies[testCaseRecordIndex].input.document.id}/${SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT}.json`,
                    [SharedLib.InferenceTypes
                        .TEXTRACT_ANALYZE_ID]: `${inputBodies[testCaseRecordIndex].input.document.caseId}/${inputBodies[testCaseRecordIndex].input.document.id}/${SharedLib.InferenceTypes.TEXTRACT_ANALYZE_ID}.json`,
                    [SharedLib.InferenceTypes
                        .TEXTRACT_ANALYZE_DOCUMENT]: `${inputBodies[testCaseRecordIndex].input.document.caseId}/${inputBodies[testCaseRecordIndex].input.document.id}/${SharedLib.InferenceTypes.TEXTRACT_ANALYZE_DOCUMENT}.json`
                }
            });

            // checking that the correct data gets passed to the upload functions
            const expectedUploadPayload = {
                document: inputBodies[testCaseRecordIndex].input.document,
                inferences: {
                    [SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT]: [syncTextractDetectTextSuccessResponse],
                    [SharedLib.InferenceTypes.TEXTRACT_ANALYZE_ID]: [syncTextractIdSuccessResponse],
                    [SharedLib.InferenceTypes.TEXTRACT_ANALYZE_DOCUMENT]: [syncTextractDocumentSuccessResponse]
                }
            };
            expect(s3InferenceSpy).toHaveBeenCalledWith(expectedUploadPayload, mockRequestAccountId);
            const expectedS3Response = [
                {
                    'caseId': inputBodies[testCaseRecordIndex].input.document.caseId,
                    'documentId': inputBodies[testCaseRecordIndex].input.document.id,
                    'inferenceType': SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT,
                    's3Key': `${inputBodies[testCaseRecordIndex].input.document.caseId}/${inputBodies[testCaseRecordIndex].input.document.id}/${SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT}.json`
                },
                {
                    'caseId': inputBodies[testCaseRecordIndex].input.document.caseId,
                    'documentId': inputBodies[testCaseRecordIndex].input.document.id,
                    'inferenceType': SharedLib.InferenceTypes.TEXTRACT_ANALYZE_ID,
                    's3Key': `${inputBodies[testCaseRecordIndex].input.document.caseId}/${inputBodies[testCaseRecordIndex].input.document.id}/${SharedLib.InferenceTypes.TEXTRACT_ANALYZE_ID}.json`
                },
                {
                    'caseId': inputBodies[testCaseRecordIndex].input.document.caseId,
                    'documentId': inputBodies[testCaseRecordIndex].input.document.id,
                    'inferenceType': SharedLib.InferenceTypes.TEXTRACT_ANALYZE_DOCUMENT,
                    's3Key': `${inputBodies[testCaseRecordIndex].input.document.caseId}/${inputBodies[testCaseRecordIndex].input.document.id}/${SharedLib.InferenceTypes.TEXTRACT_ANALYZE_DOCUMENT}.json`
                }
            ];
            expect(ddbInferenceSpy).toHaveBeenCalledWith(expectedS3Response);
        });

        it('should run runSyncTextractJob-detectText correctly', async () => {
            const testCaseRecordIndex = 3;
            mockSyncTextDetection = jest
                .spyOn(syncUtils, 'startSyncTextDetectionJob')
                .mockImplementation((_taskToken, _bucket, _key) => {
                    return {
                        'textract-detectText': syncTextractDetectTextSuccessResponse
                    };
                });
            actualResponse = await syncUtils.runSyncTextractJob(
                'taskToken1',
                sqsMessages.Records[testCaseRecordIndex],
                mockRequestAccountId
            );
            expect(actualResponse).toStrictEqual({
                'inferences': {
                    [SharedLib.InferenceTypes
                        .TEXTRACT_DETECT_TEXT]: `${inputBodies[testCaseRecordIndex].input.document.caseId}/${inputBodies[testCaseRecordIndex].input.document.id}/${SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT}.json`
                }
            });

            // checking that the correct data gets passed to the upload functions
            const expectedUploadPayload = {
                document: inputBodies[testCaseRecordIndex].input.document,
                inferences: {
                    [SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT]: [syncTextractDetectTextSuccessResponse]
                }
            };
            expect(s3InferenceSpy).toHaveBeenCalledWith(expectedUploadPayload, mockRequestAccountId);
            const expectedS3Response = [
                {
                    'caseId': inputBodies[testCaseRecordIndex].input.document.caseId,
                    'documentId': inputBodies[testCaseRecordIndex].input.document.id,
                    'inferenceType': SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT,
                    's3Key': `${inputBodies[testCaseRecordIndex].input.document.caseId}/${inputBodies[testCaseRecordIndex].input.document.id}/${SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT}.json`
                }
            ];
            expect(ddbInferenceSpy).toHaveBeenCalledWith(expectedS3Response);
        });

        it('should call upload and update of inferences when done a workflow', async () => {
            mockStartAnalyzeJob = jest
                .spyOn(syncUtils, 'startAnalyzeJob')
                .mockImplementation((_taskToken, _bucket, _key, _documentType, _featureTypes) => {
                    return {
                        [SharedLib.InferenceTypes.TEXTRACT_ANALYZE_DOCUMENT]: syncTextractDocumentSuccessResponse
                    };
                });

            const s3InferenceSpy = jest
                .spyOn(SharedLib, 'uploadDocumentInferences')
                .mockImplementation(async (_params) => {
                    return 'fake-payload';
                });

            const ddbInferenceSpy = jest.spyOn(SharedLib, 'updateInferences').mockImplementation(async (_params) => {
                return 'fake-payload';
            });

            await syncUtils.runSyncTextractJob('taskToken1', sqsMessages.Records[0]);

            expect(s3InferenceSpy).toHaveBeenCalled();
            expect(ddbInferenceSpy).toHaveBeenCalledWith('fake-payload');

            s3InferenceSpy.mockRestore();
            ddbInferenceSpy.mockRestore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        afterAll(() => {
            jest.restoreAllMocks();
        });
    });

    describe('startAnalyzeJob: When provided with correct inputs', () => {
        let mockAnalyzeDocument, mockAnalyzeExpense, mockAnalyzeId;

        beforeEach(() => {
            mockAnalyzeDocument = jest
                .spyOn(syncUtils, 'textractAnalyzeDocument')
                .mockImplementation((_taskToken, _bucket, _key, _featureTypes) => {
                    return syncTextractDocumentSuccessResponse;
                });

            mockAnalyzeExpense = jest
                .spyOn(syncUtils, 'textractAnalyzeExpense')
                .mockImplementation((_taskToken, _bucket, _key) => {
                    return syncTextractExpenseSuccessResponse;
                });

            mockAnalyzeId = jest
                .spyOn(syncUtils, 'textractAnalyzeID')
                .mockImplementation((_taskToken, _bucket, _key) => {
                    return syncTextractIdSuccessResponse;
                });
        });

        it('should run startAnalyzeJob with analyzeDocument with received FeatureTypes', async () => {
            actualResponse = await syncUtils.startAnalyzeJob('taskToken1', 'bucket-name', 'file1.png', 'Document', [
                'TABLES'
            ]);
            expect(actualResponse).toStrictEqual({
                [SharedLib.InferenceTypes.TEXTRACT_ANALYZE_DOCUMENT]: syncTextractDocumentSuccessResponse
            });
        });

        it('should run startAnalyzeJob with analyzeDocument with default FeatureTypes', async () => {
            // in this case, the workflow config for this doc had `{RunTextractAnalyzeAction:true}` but didn't
            // set the AnalyzeDocFeatureType hence `startAnalyzeJob` will use default FeatureTypes
            actualResponse = await syncUtils.startAnalyzeJob('taskToken1', 'bucket-name', 'file1.png', 'Document');

            mockAnalyzeDocument.mockImplementation((_taskToken, _bucket, _key, _featureTypes) => {
                expect(_featureTypes).toEqual(Object.keys(SharedLib.TextractDefaults.ANALYZE_DOC_FEATURE_TYPES));
                return syncTextractDocumentSuccessResponse;
            });

            expect(actualResponse).toStrictEqual({
                [SharedLib.InferenceTypes.TEXTRACT_ANALYZE_DOCUMENT]: syncTextractDocumentSuccessResponse
            });
        });

        it('should run startAnalyzeJob with analyzeExpense', async () => {
            actualResponse = await syncUtils.startAnalyzeJob('taskToken1', 'bucket-name', 'file2.png', 'Expense', null);
            expect(actualResponse).toStrictEqual({
                [SharedLib.InferenceTypes.TEXTRACT_ANALYZE_EXPENSE]: syncTextractExpenseSuccessResponse
            });
        });

        it('should run startAnalyzeJob with analyzeId', async () => {
            actualResponse = await syncUtils.startAnalyzeJob('taskToken1', 'bucket-name', 'file3.png', 'ID', null);
            expect(actualResponse).toStrictEqual({
                [SharedLib.InferenceTypes.TEXTRACT_ANALYZE_ID]: syncTextractIdSuccessResponse
            });
        });

        afterEach(() => {
            mockAnalyzeDocument.mockRestore();
            mockAnalyzeExpense.mockRestore();
            mockAnalyzeId.mockRestore();
        });
    });

    describe('textractAnalyzeDocument: When provided with correct inputs', () => {
        beforeAll(() => {
            publishDebugSpy = jest
                .spyOn(SharedLib.CloudWatchMetrics.prototype, 'publishMetrics')
                .mockImplementation(() => {});
        });
        it('receives Document type input', async () => {
            AWSMock.mock('Textract', 'analyzeDocument', async (params) => {
                expect(params.FeatureTypes).toEqual(['FORMS']);
                return syncTextractDocumentSuccessResponse;
            });

            actualResponse = await syncUtils.textractAnalyzeDocument('taskToken1', 'bucket-name', 'some-key', [
                'FORMS'
            ]);
            expect(actualResponse).toStrictEqual(syncTextractDocumentSuccessResponse);
            expect(publishDebugSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('textractAnalyzeExpense: When provided with correct inputs', () => {
        beforeAll(() => {
            publishDebugSpy = jest
                .spyOn(SharedLib.CloudWatchMetrics.prototype, 'publishMetrics')
                .mockImplementation(() => {});
        });

        it('receives Document type input', async () => {
            AWSMock.mock('Textract', 'analyzeExpense', (_params, callback) => {
                callback(null, syncTextractExpenseSuccessResponse);
            });

            actualResponse = await syncUtils.textractAnalyzeExpense('taskToken1', 'bucket-name', 'some-key');
            expect(actualResponse).toStrictEqual(syncTextractExpenseSuccessResponse);
            expect(publishDebugSpy).toHaveBeenCalledTimes(1);
        });

        it('receives Document type input', async () => {
            AWSMock.mock('Textract', 'analyzeExpense', (_params, callback) => {
                callback(null, syncTextractExpenseSuccessResponse);
            });

            actualResponse = await syncUtils.textractAnalyzeExpense('taskToken1', 'bucket-name', 'some-key');
            expect(actualResponse).toStrictEqual(syncTextractExpenseSuccessResponse);
            expect(publishDebugSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('textractAnalyzeID: When provided with correct inputs', () => {
        beforeAll(() => {
            publishDebugSpy = jest
                .spyOn(SharedLib.CloudWatchMetrics.prototype, 'publishMetrics')
                .mockImplementation(() => {});
        });

        it('receives Document type input', async () => {
            AWSMock.mock('Textract', 'analyzeID', (_params, callback) => {
                callback(null, syncTextractIdSuccessResponse);
            });

            actualResponse = await syncUtils.textractAnalyzeID('taskToken1', 'bucket-name', 'some-key');
            expect(actualResponse).toStrictEqual(syncTextractIdSuccessResponse);
            expect(publishDebugSpy).toHaveBeenCalledTimes(1);
        });

        it('receives Document type input', async () => {
            AWSMock.mock('Textract', 'analyzeID', (_params, callback) => {
                callback(null, syncTextractIdSuccessResponse);
            });

            actualResponse = await syncUtils.textractAnalyzeID('taskToken1', 'bucket-name', 'some-key');
            expect(actualResponse).toStrictEqual(syncTextractIdSuccessResponse);
            expect(publishDebugSpy).toHaveBeenCalledTimes(1);
        });

        afterAll(() => {
            jest.clearAllMocks();
        });
    });

    describe('startSyncTextDetectionJob: When provided with correct inputs', () => {
        beforeAll(() => {
            publishDebugSpy = jest
                .spyOn(SharedLib.CloudWatchMetrics.prototype, 'publishMetrics')
                .mockImplementation(() => {});
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('receives text detection job', async () => {
            AWSMock.mock('Textract', 'detectDocumentText', (_params, callback) => {
                callback(null, syncTextractDetectTextSuccessResponse);
            });

            actualResponse = await syncUtils.startSyncTextDetectionJob('taskToken1', 'bucket-name', 'some-key');
            expect(actualResponse).toStrictEqual({
                'textract-detectText': syncTextractDetectTextSuccessResponse
            });
            expect(publishDebugSpy).toHaveBeenCalledTimes(1);
        });

        it('receives text detection job', async () => {
            AWSMock.mock('Textract', 'detectDocumentText', (_params, callback) => {
                callback(null, syncTextractDetectTextSuccessResponse);
            });

            actualResponse = await syncUtils.startSyncTextDetectionJob('taskToken1', 'bucket-name', 'some-key');
            expect(actualResponse).toStrictEqual({
                'textract-detectText': syncTextractDetectTextSuccessResponse
            });
            expect(publishDebugSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('uploadSyncTextractInferences: When provided with correct inputs', () => {
        beforeAll(() => {
            s3InferenceSpy = jest.spyOn(SharedLib, 'uploadDocumentInferences').mockImplementation(async (_params) => {
                return [
                    { caseId: 'caseId', documentId: 'docId', inferenceType: 'fakeInference1', s3Key: 'fakePrefix1' },
                    { caseId: 'caseId', documentId: 'docId', inferenceType: 'fakeInference2', s3Key: 'fakePrefix2' }
                ];
            });

            ddbInferenceSpy = jest.spyOn(SharedLib, 'updateInferences').mockImplementation(async (_params) => {
                return ['fake ddb response1', 'fake ddb response 2'];
            });
        });

        it('receives text detection job', async () => {
            actualResponse = await syncUtils.uploadSyncTextractInferences('taskToken1', 'bucket-name', 'some-key');
            expect(actualResponse).toStrictEqual({
                'fakeInference1': 'fakePrefix1',
                'fakeInference2': 'fakePrefix2'
            });
        });

        afterAll(() => {
            jest.clearAllMocks();
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        mockGetTextractApiType.mockRestore();
        mockStartAnalyzeJob.mockRestore();
        mockSyncTextDetection.mockRestore();
        s3InferenceSpy.mockRestore();
        ddbInferenceSpy.mockRestore();
        AWSMock.restore();

        delete process.env.DEFAULT_ANALYZE_DOC_FEATURE_TYPE;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.AWS_REGION;
    });
});

describe('startAnalyzeJob: When provided with correct inputs', () => {
    let mockAnalyzeDocument, mockAnalyzeExpense, mockAnalyzeId, actualResponse;

    beforeEach(() => {
        mockAnalyzeDocument = jest
            .spyOn(syncUtils, 'textractAnalyzeDocument')
            .mockImplementation((_taskToken, _bucket, _key, _featureTypes) => {
                return syncTextractDocumentSuccessResponse;
            });

        mockAnalyzeExpense = jest
            .spyOn(syncUtils, 'textractAnalyzeExpense')
            .mockImplementation((_taskToken, _bucket, _key) => {
                return syncTextractExpenseSuccessResponse;
            });

        mockAnalyzeId = jest.spyOn(syncUtils, 'textractAnalyzeID').mockImplementation((_taskToken, _bucket, _key) => {
            return syncTextractIdSuccessResponse;
        });
    });

    it('should run startAnalyzeJob with analyzeDocument', async () => {
        actualResponse = await syncUtils.startAnalyzeJob('taskToken1', 'bucket-name', 'file1.png', 'Document', [
            'TABLES'
        ]);
        expect(actualResponse).toStrictEqual({
            [SharedLib.InferenceTypes.TEXTRACT_ANALYZE_DOCUMENT]: syncTextractDocumentSuccessResponse
        });
    });

    it('should run startAnalyzeJob with analyzeExpense', async () => {
        actualResponse = await syncUtils.startAnalyzeJob('taskToken1', 'bucket-name', 'file2.png', 'Expense', null);
        expect(actualResponse).toStrictEqual({
            [SharedLib.InferenceTypes.TEXTRACT_ANALYZE_EXPENSE]: syncTextractExpenseSuccessResponse
        });
    });

    it('should run startAnalyzeJob with analyzeId', async () => {
        actualResponse = await syncUtils.startAnalyzeJob('taskToken1', 'bucket-name', 'file3.png', 'ID', null);
        expect(actualResponse).toStrictEqual({
            [SharedLib.InferenceTypes.TEXTRACT_ANALYZE_ID]: syncTextractIdSuccessResponse
        });
    });

    afterEach(() => {
        mockAnalyzeDocument.mockRestore();
        mockAnalyzeExpense.mockRestore();
        mockAnalyzeId.mockRestore();
    });
});

describe('When calling textract APIs with correct inputs', () => {
    let actualResponse, consoleDebugSpy, publishDebugSpy;
    beforeAll(() => {
        process.env.DOCUMENT_BUCKET_NAME = 'test-bucket';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.AWS_REGION = 'us-east-1';

        publishDebugSpy = jest
            .spyOn(SharedLib.CloudWatchMetrics.prototype, 'publishMetrics')
            .mockImplementation(() => {});
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('textractAnalyzeDocument: Textract service API should be called', async () => {
        AWSMock.mock('Textract', 'analyzeDocument', async (params) => {
            return syncTextractDocumentSuccessResponse;
        });

        actualResponse = await syncUtils.textractAnalyzeDocument('taskToken1', 'bucket-name', 'some-key', ['FORMS']);
        expect(actualResponse).toStrictEqual(syncTextractDocumentSuccessResponse);
        expect(publishDebugSpy).toHaveBeenCalledTimes(1);
    });

    it('textractAnalyzeExpense: Textract service API should be called', async () => {
        AWSMock.mock('Textract', 'analyzeExpense', async (params) => {
            return syncTextractExpenseSuccessResponse;
        });

        actualResponse = await syncUtils.textractAnalyzeExpense('taskToken1', 'bucket-name', 'some-key');
        expect(actualResponse).toStrictEqual(syncTextractExpenseSuccessResponse);
        expect(publishDebugSpy).toHaveBeenCalledTimes(1);
    });

    it('textractAnalyzeID: Textract service API should be called', async () => {
        AWSMock.mock('Textract', 'analyzeID', async (params) => {
            return syncTextractIdSuccessResponse;
        });

        actualResponse = await syncUtils.textractAnalyzeID('taskToken1', 'bucket-name', 'some-key');
        expect(actualResponse).toStrictEqual(syncTextractIdSuccessResponse);
        expect(publishDebugSpy).toHaveBeenCalledTimes(1);
    });

    it('startSyncTextDetectionJob: receives text detection job', async () => {
        AWSMock.mock('Textract', 'detectDocumentText', (params, callback) => {
            callback(null, syncTextractDetectTextSuccessResponse);
        });

        actualResponse = await syncUtils.startSyncTextDetectionJob('taskToken1', 'bucket-name', 'some-key');
        expect(actualResponse).toStrictEqual({
            'textract-detectText': syncTextractDetectTextSuccessResponse
        });
        expect(publishDebugSpy).toHaveBeenCalledTimes(1);
    });

    afterAll(() => {
        AWSMock.restore();
        publishDebugSpy.mockRestore();
        delete process.env.DOCUMENT_BUCKET_NAME;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.AWS_REGION;
    });
});

describe('Text-extraction Sync (textract Utils): When provided with incorrect inputs', () => {
    let mockGetTextractApiType, mockStartAnalyzeJob, mockSyncTextDetection, consoleDebugSpy;

    beforeAll(() => {
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.AWS_REGION = 'us-east-1';
        process.env.DEFAULT_ANALYZE_DOC_FEATURE_TYPE = 'TABLES';
    });

    afterAll(() => {
        jest.clearAllMocks();
        AWSMock.restore();
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.DEFAULT_ANALYZE_DOC_FEATURE_TYPE;
    });

    describe('runSyncTextractJob: When provided with incorrect inputs', () => {
        it('throws an error in runSyncTextractJob due to unsupported file extension', async () => {
            await expect(syncUtils.runSyncTextractJob('fakeToken', sqsMessages.Records[4])).rejects.toThrow(
                `Unsupported file type: xls. Supported file types are: ${utils.supportedImageTypes.join(', ')}`
            );
        });

        it('throws an error in runSyncTextractJob for startSyncTextDetectionJob failure', async () => {
            mockGetTextractApiType = jest.spyOn(utils, 'getTextractApiType');
            mockGetTextractApiType = mockGetTextractApiType.mockImplementation((selfCertifiedDocType) => {
                return 'Other';
            });

            mockSyncTextDetection = jest
                .spyOn(syncUtils, 'startSyncTextDetectionJob')
                .mockImplementation((taskToken, bucket, key) => {
                    throw new Error('An error occurred.');
                });

            mockStartAnalyzeJob = jest
                .spyOn(syncUtils, 'startAnalyzeJob')
                .mockImplementation((taskToken, bucket, key, documentType, featureTypes) => {
                    return {
                        [SharedLib.InferenceTypes.TEXTRACT_ANALYZE_DOCUMENT]: syncTextractDocumentSuccessResponse
                    };
                });

            await expect(syncUtils.runSyncTextractJob('taskToken1', sqsMessages.Records[0])).rejects.toThrow(
                'An error occurred.'
            );
        });

        it('throws an error in runSyncTextractJob', async () => {
            mockGetTextractApiType = jest.spyOn(utils, 'getTextractApiType');
            mockGetTextractApiType = mockGetTextractApiType.mockImplementation((selfCertifiedDocType) => {
                return 'Other';
            });

            mockSyncTextDetection = jest
                .spyOn(syncUtils, 'startSyncTextDetectionJob')
                .mockImplementation((taskToken, bucket, key) => {
                    return {
                        [SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT]: syncTextractDetectTextSuccessResponse
                    };
                });

            mockStartAnalyzeJob = jest
                .spyOn(syncUtils, 'startAnalyzeJob')
                .mockImplementation((taskToken, bucket, key, documentType, featureTypes) => {
                    throw new Error('An error occurred.');
                });

            await expect(syncUtils.runSyncTextractJob('taskToken1', sqsMessages.Records[0])).rejects.toThrow(
                'An error occurred.'
            );
        });

        it('throws an error in runSyncTextractJob', async () => {
            mockSyncTextDetection = jest
                .spyOn(syncUtils, 'startSyncTextDetectionJob')
                .mockImplementation((taskToken, bucket, key) => {
                    return {
                        [SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT]: syncTextractDetectTextSuccessResponse
                    };
                });

            mockSyncTextDetection = jest
                .spyOn(syncUtils, 'startSyncTextDetectionJob')
                .mockImplementation((taskToken, bucket, key, documentType, featureTypes) => {
                    throw new Error('An error occurred.');
                });
            await expect(syncUtils.runSyncTextractJob('taskToken1', sqsMessages.Records[3])).rejects.toThrow(
                'An error occurred.'
            );
        });

        afterAll(() => {
            mockGetTextractApiType.mockRestore();
            mockStartAnalyzeJob.mockRestore();
            mockSyncTextDetection.mockRestore();
        });
    });

    describe('startAnalyzeJob: When provided with incorrect inputs', () => {
        let mockAnalyzeDocument, mockAnalyzeExpense, mockAnalyzeId;

        beforeAll(() => {
            mockAnalyzeDocument = jest.spyOn(syncUtils, 'textractAnalyzeDocument');
            mockAnalyzeDocument = mockAnalyzeDocument.mockImplementation((taskToken, bucket, key, featureTypes) => {
                throw new Error('An error occurred in Doc job.');
            });

            mockAnalyzeExpense = jest.spyOn(syncUtils, 'textractAnalyzeExpense');
            mockAnalyzeExpense = mockAnalyzeExpense.mockImplementation((taskToken, bucket, key) => {
                throw new Error('An error occurred in Expense job.');
            });

            mockAnalyzeId = jest.spyOn(syncUtils, 'textractAnalyzeID');
            mockAnalyzeId = mockAnalyzeId.mockImplementation((taskToken, bucket, key) => {
                throw new Error('An error occurred in ID job.');
            });
        });

        it('should run startAnalyzeJob with analyzeDocument', async () => {
            await expect(
                syncUtils.startAnalyzeJob('taskToken1', 'bucket-name', 'file1.png', 'Document', ['TABLES'])
            ).rejects.toThrow('An error occurred in Doc job.');
        });

        it('should run startAnalyzeJob with analyzeExpense', async () => {
            await expect(
                syncUtils.startAnalyzeJob('taskToken1', 'bucket-name', 'file2.png', 'Expense', null)
            ).rejects.toThrow('An error occurred in Expense job.');
        });

        it('should run startAnalyzeJob with analyzeId', async () => {
            await expect(
                syncUtils.startAnalyzeJob('taskToken1', 'bucket-name', 'file3.png', 'ID', null)
            ).rejects.toThrow('An error occurred in ID job.');
        });

        afterAll(() => {
            jest.clearAllMocks();
            mockAnalyzeDocument.mockRestore();
            mockAnalyzeExpense.mockRestore();
            mockAnalyzeId.mockRestore();
        });
    });

    describe('Individual API calls: When provided with incorrect inputs', () => {
        let publishMetricsSpy;

        beforeEach(() => {
            jest.clearAllMocks();
            publishMetricsSpy = jest
                .spyOn(SharedLib.CloudWatchMetrics.prototype, 'publishMetrics')
                .mockImplementation(() => {});
        });

        it('textractAnalyzeDocument incorrect input: receives Document type input', async () => {
            AWSMock.mock('Textract', 'analyzeDocument', (params, callback) => {
                callback(new Error('An error occurred while analyzing document.'), null);
            });

            await expect(
                syncUtils.textractAnalyzeDocument('taskToken1', 'bucket-name', 'some-key', ['FORMS'])
            ).rejects.toThrow('An error occurred while analyzing document.');
            expect(publishMetricsSpy).toHaveBeenCalledTimes(1);
        });

        it('textractAnalyzeExpense incorrect input: receives Document type input', async () => {
            AWSMock.mock('Textract', 'analyzeExpense', (params, callback) => {
                callback(new Error('An error occurred while analyzing expense document.'), null);
            });
            await expect(syncUtils.textractAnalyzeExpense('taskToken1', 'bucket-name', 'some-key')).rejects.toThrow(
                'An error occurred while analyzing expense document.'
            );
            expect(publishMetricsSpy).toHaveBeenCalledTimes(1);
        });

        it('textractAnalyzeID incorrect input:receives Document type input', async () => {
            AWSMock.mock('Textract', 'analyzeID', (params, callback) => {
                callback(new Error('An error occurred while analyzing ID document.'), null);
            });
            await expect(syncUtils.textractAnalyzeID('taskToken1', 'bucket-name', 'some-key')).rejects.toThrow(
                'An error occurred while analyzing ID document.'
            );
            expect(publishMetricsSpy).toHaveBeenCalledTimes(1);
        });

        it('startSyncTextDetectionJob incorrect input: receives text detection job', async () => {
            AWSMock.mock('Textract', 'detectDocumentText', (params, callback) => {
                callback(new Error('An error occurred while detecting text in the document.'), null);
            });
            await expect(syncUtils.startSyncTextDetectionJob('taskToken1', 'bucket-name', 'some-key')).rejects.toThrow(
                'An error occurred while detecting text in the document.'
            );
            expect(publishMetricsSpy).toHaveBeenCalledTimes(1);
        });

        afterAll(() => {
            jest.clearAllMocks();
            publishMetricsSpy.mockRestore();
        });
    });
});
