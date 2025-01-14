// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
'use strict';

process.env.AWS_REGION = 'fakeRegion';
process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';

const AWSMock = require('aws-sdk-mock');
const { CloudWatchMetrics } = require('../../metrics/cloudwatch');
const { comprehendWorkflowMetricsResponse, textractWorkflowMetricsResponse } = require('../event-test-data');
const { CloudwatchNamespace, CaseStatus, TextractAPIs, ComprehendAPIs } = require('../../constants');
const { WorkflowMetrics } = require('../../metrics/workflows');

describe('Cloudwatch Workflow Metrics: When provided with correct inputs', () => {
    let consoleLogSpy;

    beforeAll(() => {
        process.env.AWS_REGION = 'fakeRegion';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.UUID = 'fake-uuid'

        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));
    });

    beforeEach(() => {
        jest.resetAllMocks();
        AWSMock.restore('CloudWatch');
    });

    it('should pass successfully when comprehend workflow metrics are passed', async () => {
        AWSMock.mock('CloudWatch', 'putMetricData', async (params) => {
            expect(params).toEqual(comprehendWorkflowMetricsResponse);
            return 'success';
        });

        const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.WORKFLOW_TYPES);
        const actualResponse = await cloudWatch.publishMetrics(ComprehendAPIs.COMPREHEND_DETECT_ENTITIES_SYNC);
        expect(actualResponse).toEqual('success');
    });

    it('should pass successfully when textract workflow metrics are passed', async () => {
        AWSMock.mock('CloudWatch', 'putMetricData', async (params) => {
            expect(params).toEqual(textractWorkflowMetricsResponse);
            return 'success';
        });

        const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.WORKFLOW_TYPES);
        const actualResponse = await cloudWatch.publishMetrics(TextractAPIs.TEXTRACT_ANALYZE_DOCUMENT_SYNC);
        expect(actualResponse).toEqual('success');
    });

    afterAll(() => {
        AWSMock.restore('CloudWatch');
        consoleLogSpy.mockRestore();
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.UUID;
    });
});

describe('Cloudwatch Workflow Metrics: When provided with incorrect inputs', () => {
    let consoleErrorSpy;

    beforeAll(() => {
        process.env.AWS_REGION = 'fakeRegion';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.UUID = 'fake-uuid'

        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should throw an error when illegal API for comprehend is passed', async () => {
        const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.WORKFLOW_TYPES);
        expect(async () => cloudWatch.publishMetrics(CaseStatus.CLASSIFY)).rejects.toThrow(
            `Provided API in publishMetrics method is not supported.`
        );
        expect(consoleErrorSpy).toHaveBeenCalledWith('Provided API in publishMetrics method is not supported.');
    });

    it('should throw an error when illegal API for textract is passed', async () => {
        const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.WORKFLOW_TYPES);
        expect(async () => cloudWatch.publishMetrics(TextractAPIs.DETECT_ENTITIES_NEW)).rejects.toThrow(
            `Provided API in publishMetrics method is not supported.`
        );
        expect(consoleErrorSpy).toHaveBeenCalledWith('Provided API in publishMetrics method is not supported.');
    });

    it('should throw an error when illegal workflow name is used', async () => {
        // code should generally not reach here.
        expect(async () =>
            new WorkflowMetrics().publishMetricsData(CaseStatus.INITIATE, 'some-api', 2)
        ).rejects.toThrow(`Provided API in publishMetrics method is not supported.`);
        expect(consoleErrorSpy).toHaveBeenCalledWith('Provided API in publishMetrics method is not supported.');
    });

    it('should throw an error when cloudwatch raises an error for ComprehendAPIs', async () => {
        AWSMock.mock('CloudWatch', 'putMetricData', async (params) => {
            throw new Error('Some error occurred.');
        });

        const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.WORKFLOW_TYPES);
        await cloudWatch.publishMetrics(ComprehendAPIs.COMPREHEND_DETECT_ENTITIES_SYNC);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            `Failed to publish cw metrics with params: ${JSON.stringify(
                comprehendWorkflowMetricsResponse
            )}. Error: Some error occurred.`
        );
    });

    it('should throw an error when cloudwatch raises an error for TextractAPIs', async () => {
        AWSMock.mock('CloudWatch', 'putMetricData', async (params) => {
            throw new Error('Some error occurred.');
        });

        const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.WORKFLOW_TYPES);
        await cloudWatch.publishMetrics(TextractAPIs.TEXTRACT_ANALYZE_DOCUMENT_SYNC);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            `Failed to publish cw metrics with params: ${JSON.stringify(
                textractWorkflowMetricsResponse
            )}. Error: Some error occurred.`
        );
    });

    afterAll(() => {
        consoleErrorSpy.mockRestore();
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.UUID;
    });
});
