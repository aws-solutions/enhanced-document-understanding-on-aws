// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';
const AWSMock = require('aws-sdk-mock');
const snsUtils = require('../../utils/sns-send-notification');

describe('SNS notifications missing ARN', () => {
    beforeAll(() => {
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        // Setting up mocks
        const mockedResponseData = {
            Success: 'OK'
        };
        AWSMock.mock('SNS', 'publish', (message, callback) => {
            callback(null, mockedResponseData);
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
    });

    it('Should throw when missing env', async () => {
        await expect(snsUtils.sendSNSNotification('fake-message')).rejects.toThrow(
            'SNS_TOPIC_ARN Lambda Environment variable not set.'
        );
    });

    afterAll(() => {
        AWSMock.restore('SNS');
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
    });
});

describe('SNS notifications sending correctly', () => {
    let consoleDebugSpy;

    beforeAll(() => {
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.SNS_TOPIC_ARN = 'fake-topic';

        consoleDebugSpy = jest.spyOn(console, 'debug');
    });

    afterEach(() => {
        jest.clearAllMocks();
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.SNS_TOPIC_ARN = 'fake-topic';
    });

    it('it should log environment variables correctly', async () => {
        snsUtils.checkSNSEnvSetup();
        expect(consoleDebugSpy.mock.calls[0][0]).toBe(`SNS_TOPIC_ARN is: ${process.env.SNS_TOPIC_ARN}`);
    });

    describe('SNS publish: Successfully publishes notification', () => {
        beforeAll(async () => {
            jest.clearAllMocks();

            // Setting up mocks
            const mockedResponseData = {
                Success: 'OK'
            };
            AWSMock.mock('SNS', 'publish', (message, callback) => {
                callback(null, mockedResponseData);
            });
        });

        it('should pass successfully', async () => {
            const mockedResponseData = {
                Success: 'OK'
            };
            const actualResponse = await snsUtils.sendSNSNotification('fake-message');
            expect(actualResponse).toEqual(mockedResponseData);
        });
    });

    afterAll(() => {
        AWSMock.restore('SNS');
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
    });
});
