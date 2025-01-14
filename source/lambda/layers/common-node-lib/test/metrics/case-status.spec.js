// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
'use strict';

process.env.AWS_REGION = 'fakeRegion';
process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';

const AWSMock = require('aws-sdk-mock');
const { CloudWatchMetrics } = require('../../metrics/cloudwatch');
const { caseStatusMetricsResponse } = require('../event-test-data');
const { CloudwatchNamespace, CaseStatus } = require('../../constants');

describe('Cloudwatch Case Metrics: When provided with correct inputs', () => {
    beforeAll(() => {
        process.env.AWS_REGION = 'fakeRegion';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.UUID = 'fake-uuid'
        jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));
    });

    it('should pass successfully when workflow initiate status is passed', async () => {
        AWSMock.mock('CloudWatch', 'putMetricData', async (params) => {
            expect(params).toEqual(caseStatusMetricsResponse);
            return 'success';
        });

        const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.CASE);
        const actualResponse = await cloudWatch.publishMetrics(CaseStatus.INITIATE);
        expect(actualResponse).toEqual('success');
    });

    it('should pass successfully when workflow success status is passed', async () => {
        caseStatusMetricsResponse.MetricData[0].Dimensions[0].Value = 'success';
        AWSMock.mock('CloudWatch', 'putMetricData', async (params) => {
            expect(params).toEqual(caseStatusMetricsResponse);
            return 'success';
        });

        const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.CASE);
        const actualResponse = await cloudWatch.publishMetrics(CaseStatus.SUCCESS);
        expect(actualResponse).toEqual('success');
    });

    it('should pass successfully when workflow failure status is passed', async () => {
        caseStatusMetricsResponse.MetricData[0].Dimensions[0].Value = 'failure';
        AWSMock.mock('CloudWatch', 'putMetricData', async (params) => {
            expect(params).toEqual(caseStatusMetricsResponse);
            return 'success';
        });

        const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.CASE);
        const actualResponse = await cloudWatch.publishMetrics(CaseStatus.FAILURE);
        expect(actualResponse).toEqual('success');
    });

    it('should pass successfully when workflow complete status is passed', async () => {
        caseStatusMetricsResponse.MetricData[0].Dimensions[0].Value = 'success';
        AWSMock.mock('CloudWatch', 'putMetricData', async (params) => {
            expect(params).toEqual(caseStatusMetricsResponse);
            return 'success';
        });

        const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.CASE);
        const actualResponse = await cloudWatch.publishMetrics(CaseStatus.SUCCESS);
        expect(actualResponse).toEqual('success');
    });

    afterAll(() => {
        AWSMock.restore('CloudWatch');
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
    });
});

describe('Cloudwatch Case Metrics: When provided with incorrect inputs', () => {
    let consoleErrorSpy;

    afterEach(() => {
        jest.resetAllMocks();
    });

    beforeAll(() => {
        process.env.AWS_REGION = 'fakeRegion';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.UUID = 'fake-uuid'
        jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should throw an error when illegal CaseStatus is passed', async () => {
        const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.CASE);

        expect(async () => cloudWatch.publishMetrics(CaseStatus.TRIGGERED)).rejects.toThrow(
            `Provided CaseStatus in publishMetrics method is not supported. Possible values: ${Object.keys(CaseStatus)}`
        );
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            `Provided CaseStatus in publishMetrics method is not supported. Possible values: ${Object.keys(CaseStatus)}`
        );
    });

    it('should return null when cloudwatch fails to send metrics', async () => {
        AWSMock.mock('CloudWatch', 'putMetricData', async (params) => {
            throw new Error('Some error occurred.');
        });

        const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.CASE);
        const actualResponse = await cloudWatch.publishMetrics(CaseStatus.SUCCESS);
        expect(actualResponse).toBeNull();
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            `Failed to publish cw metrics with params: ${JSON.stringify(
                caseStatusMetricsResponse
            )}. Error: Some error occurred.`
        );
    });

    afterAll(() => {
        AWSMock.restore('CloudWatch');
        consoleErrorSpy.mockRestore();
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
    });
});
