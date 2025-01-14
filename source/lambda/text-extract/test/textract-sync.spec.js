// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const SharedLib = require('common-node-lib');
const lambda = require('../textract-sync');
const {
    sqsMessages,
    syncTextractIdSuccessResponse,
    syncTextractExpenseSuccessResponse,
    syncTextractDocumentSuccessResponse,
    syncTextractDetectTextSuccessResponse
} = require('./event-test-data');
const syncUtils = require('../utils/sync');
jest.mock('../utils/sync');

describe('Text-extraction Sync: When provided with correct inputs', () => {
    let processRecordsSyncSpy, runSyncTextractJobCallback;
    const mockRequestAccountId = '123456789012';
    const mockedContext = {
        invokedFunctionArn: `arn:aws:lambda:us-east-1:${mockRequestAccountId}:function:my-function`
    };
    beforeAll(() => {
        process.env.AWS_REGION = 'fakeRegion';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';

        runSyncTextractJobCallback = jest
            .spyOn(syncUtils, 'runSyncTextractJob')
            .mockImplementation((taskToken, sqsRecord, requestAccountId) => {
                return {};
            });
    });

    it('should analyze document', async () => {
        processRecordsSyncSpy = jest
            .spyOn(SharedLib, 'processRecordsSync')
            .mockImplementation((records, runSyncJob, requestAccountId) => {
                expect(requestAccountId).toEqual(mockRequestAccountId);
                return {
                    ...records.body.input,
                    inferences: { 'textract-analyzeDoc': syncTextractDocumentSuccessResponse }
                };
            });
        const actualResponse = await lambda.handler({ 'Records': sqsMessages.Records[1] }, mockedContext);

        expect(processRecordsSyncSpy).toHaveBeenCalledWith(
            sqsMessages.Records[1],
            runSyncTextractJobCallback,
            mockRequestAccountId
        );
        expect(actualResponse).toBe(undefined);
    });

    it('should analyze expense', async () => {
        processRecordsSyncSpy = jest
            .spyOn(SharedLib, 'processRecordsSync')
            .mockImplementation((records, runSyncJob, requestAccountId) => {
                return {
                    ...records.body.input,
                    inferences: { 'textract-analyzeExpense': syncTextractExpenseSuccessResponse }
                };
            });

        const actualResponse = await lambda.handler({ 'Records': sqsMessages.Records[1] }, mockedContext);
        expect(processRecordsSyncSpy).toHaveBeenCalledWith(
            sqsMessages.Records[1],
            runSyncTextractJobCallback,
            mockRequestAccountId
        );
        expect(actualResponse).toBe(undefined);
    });

    it('should analyze Id', async () => {
        processRecordsSyncSpy = jest
            .spyOn(SharedLib, 'processRecordsSync')
            .mockImplementation((records, runSyncJob, requestAccountId) => {
                return {
                    ...records.body.input,
                    inferences: { 'textract-analyzeId': syncTextractIdSuccessResponse }
                };
            });

        const actualResponse = await lambda.handler({ 'Records': sqsMessages.Records[2] }, mockedContext);
        expect(processRecordsSyncSpy).toHaveBeenCalledWith(
            sqsMessages.Records[2],
            runSyncTextractJobCallback,
            mockRequestAccountId
        );
        expect(actualResponse).toBe(undefined);
    });

    it('should detect text', async () => {
        processRecordsSyncSpy = jest
            .spyOn(SharedLib, 'processRecordsSync')
            .mockImplementation((records, runSyncJob, requestAccountId) => {
                return {
                    ...records.body.input,
                    inferences: { 'textract-detectText': syncTextractDetectTextSuccessResponse }
                };
            });

        const actualResponse = await lambda.handler({ 'Records': sqsMessages.Records[0] }, mockedContext);
        expect(processRecordsSyncSpy).toHaveBeenCalledWith(
            sqsMessages.Records[0],
            runSyncTextractJobCallback,
            mockRequestAccountId
        );
        expect(actualResponse).toBe(undefined);
    });

    afterAll(() => {
        processRecordsSyncSpy.mockRestore();
        runSyncTextractJobCallback.mockRestore();
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
    });
});

describe('Text-extraction Sync: When provided with incorrect inputs', () => {
    let processRecordsSyncSpy, runSyncTextractJobCallback;

    const mockRequestAccountId = '123456789012';
    const mockedContext = {
        invokedFunctionArn: `arn:aws:lambda:us-east-1:${mockRequestAccountId}:function:my-function`
    };
    beforeAll(() => {
        process.env.AWS_REGION = 'fakeRegion';
        process.env.AWS_SDK_USER_AGENT = '{ "customerAgent": "fake-data" }';

        runSyncTextractJobCallback = jest
            .spyOn(syncUtils, 'runSyncTextractJob')
            .mockImplementation((taskToken, sqsRecord) => {
                return {};
            });

        processRecordsSyncSpy = jest
            .spyOn(SharedLib, 'processRecordsSync')
            .mockImplementation((records, runSyncJob) => {
                throw new Error('An error occurred.');
            });
    });

    it('should throw an error in processRecordsSync', async () => {
        await expect(lambda.handler({ 'Records': sqsMessages.Records[0] }, mockedContext)).rejects.toThrow(
            'An error occurred.'
        );
    });

    it('should throw an error if context not provided', async () => {
        await expect(lambda.handler({ 'Records': sqsMessages.Records[0] })).rejects.toThrow(
            'Request context is missing'
        );
    });

    afterAll(() => {
        processRecordsSyncSpy.mockRestore();
        runSyncTextractJobCallback.mockRestore();
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
    });
});
