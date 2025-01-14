// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const AWS = require('aws-sdk');
const AWSMock = require('aws-sdk-mock');
const sqsPoller = require('../../sqs/sqs-poller');
const { sqsMessages } = require('../event-test-data');

describe('SQS Poller: When provided with correct inputs', () => {
    let consoleDebugSpy, sqs;

    beforeAll(() => {
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.SQS_BATCH_SIZE = 10;
        process.env.SQS_URL = 'fake-sqs-url/';
        consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Should successfully pass for one loop iteration', () => {
        beforeAll(() => {
            AWSMock.mock('SQS', 'receiveMessage', (params, callback) => {
                if (params.QueueUrl === process.env.SQS_URL) {
                    callback(null, sqsMessages);
                } else {
                    callback(new Error("SQS Url doesn't exist."), null);
                }
            });
        });
        afterEach(() => {
            jest.clearAllMocks();
        });

        afterAll(() => {
            AWSMock.restore('SQS');
            consoleDebugSpy.mockRestore();
        });

        it('should pass successfully', async () => {
            sqs = new AWS.SQS();
            const actualResponse = await sqsPoller.pullRecordsFromSQS(sqs);
            expect(actualResponse).toBe(sqsMessages);
        });

        it('it should log environment variables correctly', async () => {
            sqsPoller.checkSQSEnvSetup();
            expect(consoleDebugSpy).toHaveBeenCalledTimes(3);
        });

        it('should exit the loop when SQS queue gets empty', async () => {
            sqs = new AWS.SQS();
            const error_msg = 'No more SQS_MESSAGE in the queue!';
            await sqsPoller.pullRecordsFromSQS(sqs);
            expect(consoleDebugSpy).toHaveBeenCalledWith(error_msg);
        });
    });

    describe('Should successfully pass for multiple loop iterations', () => {
        beforeAll(() => {
            process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';

            AWSMock.mock('SQS', 'receiveMessage', (params, callback) => {
                if (params.QueueUrl === process.env.SQS_URL) {
                    callback(null, sqsMessages);
                } else {
                    callback(new Error("SQS Url doesn't exist."), null);
                }
            });
        });

        afterAll(() => {
            AWSMock.restore('SQS');
        });

        it('should return right size of SQS messages', async () => {
            sqs = new AWS.SQS();
            const error_msg = 'No more SQS_MESSAGE in the queue!';
            const actualResponse = await sqsPoller.pullRecordsFromSQS(sqs);
            expect(consoleDebugSpy).not.toHaveBeenCalledWith(error_msg);
            expect(actualResponse.Messages.length).toEqual(sqsMessages.Messages.length);
        });
    });

    afterAll(() => {
        consoleDebugSpy.mockRestore();
        delete process.env.SQS_BATCH_SIZE;
        delete process.env.SQS_URL;
        delete process.env.AWS_SDK_USER_AGENT;
    });
});

describe('SQS Poller: When provided with incorrect inputs', () => {
    let consoleWarnSpy, consoleDebugSpy, sqs, actualResponse, DEFAULT_SQS_BATCH_SIZE, DEFAULT_SQS_ITERATION_COUNT;
    beforeAll(() => {
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.SQS_BATCH_SIZE = 10;
        process.env.SQS_URL = 'fake-sqs-url/';

        DEFAULT_SQS_BATCH_SIZE = 10;
        DEFAULT_SQS_ITERATION_COUNT = 5;
        AWSMock.mock('SQS', 'receiveMessage', (params, callback) => {
            callback(new Error("Fake error: SQS Url doesn't exist."), null);
        });

        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    });

    beforeEach(() => {
        process.env.SQS_BATCH_SIZE = 10;
        process.env.SQS_ITERATION_COUNT = 5;
        process.env.SQS_URL = 'fake-sqs-url/';
        jest.clearAllMocks();
    });

    it('check if SQS_BATCH_SIZE is being set', async () => {
        const error_msg = `SQS_BATCH_SIZE Lambda Environment variable not set. Setting it to the default value of: ${DEFAULT_SQS_BATCH_SIZE}.`;
        sqsPoller.checkSQSEnvSetup();
        expect(consoleDebugSpy).not.toHaveBeenCalledWith(error_msg);
        delete process.env.SQS_BATCH_SIZE;
        sqsPoller.checkSQSEnvSetup();
        expect(consoleDebugSpy).toHaveBeenCalledWith(error_msg);
    });

    it('check if SQS_ITERATION_COUNT is being set', async () => {
        const error_msg = `SQS_ITERATION_COUNT Lambda Environment variable not set. Setting it to the default value of: ${DEFAULT_SQS_ITERATION_COUNT}.`;
        sqsPoller.checkSQSEnvSetup();
        expect(consoleDebugSpy).not.toHaveBeenCalledWith(error_msg);
        delete process.env.SQS_ITERATION_COUNT;
        sqsPoller.checkSQSEnvSetup();
        expect(consoleDebugSpy).toHaveBeenCalledWith(error_msg);
    });

    it('throws an errors due to SQS_URL env variable not being set', async () => {
        delete process.env.SQS_URL;
        try {
            sqsPoller.checkSQSEnvSetup();
        } catch (error) {
            expect(error.message).toBe('SQS_URL Lambda Environment variable not set.');
        }
    });

    it('should throw an error in SQS receiveMessage', async () => {
        sqs = new AWS.SQS();
        await expect(sqsPoller.pullRecordsFromSQS(sqs)).rejects.toThrow("Fake error: SQS Url doesn't exist.");
    });

    it('returns an empty response due to empty SQS queue', async () => {
        sqs = new AWS.SQS();
        AWSMock.remock('SQS', 'receiveMessage', (params, callback) => {
            if (params.QueueUrl === process.env.SQS_URL) {
                callback(null, { Messages: [] });
            } else {
                callback(new Error("SQS Url doesn't exist."), null);
            }
        });

        actualResponse = await sqsPoller.pullRecordsFromSQS(sqs);
        expect(actualResponse).toBe(undefined);
        expect(consoleWarnSpy).toHaveBeenCalledWith('No records retrieved from SQS to process.');
    });

    afterAll(() => {
        AWSMock.restore('SQS');
        consoleWarnSpy.mockRestore();
        delete process.env.SQS_BATCH_SIZE;
        delete process.env.SQS_URL;
        delete process.env.AWS_SDK_USER_AGENT;
    });
});
