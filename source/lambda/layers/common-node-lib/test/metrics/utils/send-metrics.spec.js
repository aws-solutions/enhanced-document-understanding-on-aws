// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
'use strict';

process.env.AWS_REGION = 'fakeRegion';
process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';

const AWSMock = require('aws-sdk-mock');
const { sendCloudWatchMetrics } = require('../../../metrics/utils/send-metrics');
const { caseStatusMetricsResponse } = require('../../event-test-data');
const { CloudwatchNamespace } = require('../../../constants');

describe('Send Metrics: When provided with correct inputs', () => {
    beforeAll(() => {
        jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));
    });

    it('should pass successfully when workflow initiate status is passed', async () => {
        AWSMock.mock('CloudWatch', 'putMetricData', async (params) => {
            expect(params).toEqual(caseStatusMetricsResponse);
            return 'success';
        });

        const actualResponse = await sendCloudWatchMetrics(
            CloudwatchNamespace.CASE,
            caseStatusMetricsResponse
        );
        expect(actualResponse).toEqual('success');
    });

    afterAll(() => {
        AWSMock.restore('CloudWatch');
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
    });
});

describe('Send Metrics: When Cloudwatch throws an error', () => {
    afterAll(() => {
        AWSMock.restore('CloudWatch');
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
    });

    beforeAll(() => {
        process.env.AWS_REGION = 'fakeRegion';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));
    });

    it('should return null when cloudwatch fails to send metrics', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        AWSMock.mock('CloudWatch', 'putMetricData', async (params) => {
            throw new Error('Some error occurred.');
        });

        const actualResponse = await sendCloudWatchMetrics(
            CloudwatchNamespace.CASE,
            caseStatusMetricsResponse
        );
        expect(actualResponse).toBeNull();
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            `Failed to publish cw metrics with params: ${JSON.stringify(
                caseStatusMetricsResponse
            )}. Error: Some error occurred.`
        );
    });
});
