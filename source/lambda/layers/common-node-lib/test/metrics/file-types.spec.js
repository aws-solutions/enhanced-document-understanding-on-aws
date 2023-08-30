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
 *********************************************************************************************************************/
'use strict';

process.env.AWS_REGION = 'fakeRegion';
process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';

const AWSMock = require('aws-sdk-mock');
const { CloudWatchMetrics } = require('../../metrics/cloudwatch');
const { fileTypeMetricsResponse } = require('../event-test-data');
const { CloudwatchNamespace, SupportedFileTypes } = require('../../constants');

describe('Cloudwatch File Type Metrics: When provided with correct inputs', () => {
    let cloudwatchMock, requestParams;

    beforeAll(() => {
        process.env.AWS_REGION = 'fakeRegion';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.UUID = 'fake-uuid'
        requestParams = fileTypeMetricsResponse;
        jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));

        AWSMock.mock('CloudWatch', 'putMetricData', async (params) => {
            return 'success';
        });
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should pass successfully when supported file type with count is passed', async () => {
        cloudwatchMock = AWSMock.mock('CloudWatch', 'putMetricData', async (params) => {
            expect(params).toEqual(fileTypeMetricsResponse);
            return 'success';
        });
        const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.FILE_TYPES);
        const actualResponse = await cloudWatch.publishMetrics(SupportedFileTypes.JPEG, 2);
        expect(actualResponse).toBe('success');
    });

    it('should pass successfully when supported file type with count is passed', async () => {
        cloudwatchMock = AWSMock.mock('CloudWatch', 'putMetricData', async (params) => {
            expect(params).toEqual(fileTypeMetricsResponse);
            return 'success';
        });
        const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.FILE_TYPES);
        const actualResponse = await cloudWatch.publishMetrics(SupportedFileTypes.JPG, 2);
        expect(actualResponse).toBe('success');
    });

    it('should pass successfully when supported file type is passed', async () => {
        fileTypeMetricsResponse.MetricData[0].Value = 1;
        cloudwatchMock = AWSMock.mock('CloudWatch', 'putMetricData', async (params) => {
            expect(params).toEqual(fileTypeMetricsResponse);
            return 'success';
        });

        const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.FILE_TYPES);
        const actualResponse = await cloudWatch.publishMetrics(SupportedFileTypes.JPEG);
        expect(actualResponse).toBe('success');
    });

    afterAll(() => {
        AWSMock.restore('CloudWatch');
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.UUID;
    });
});

describe('Cloudwatch File Type Metrics: When provided with incorrect inputs', () => {
    let consoleErrorSpy;
    beforeAll(() => {
        process.env.AWS_REGION = 'fakeRegion';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.UUID = 'fake-uuid'
        jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should throw an error when illegal file type/extension is passed', async () => {
        const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.FILE_TYPES);

        expect(async () => cloudWatch.publishMetrics('docx')).rejects.toThrow(
            `Provided File Extension Type in publishMetrics method is not supported. Possible values: ${Object.keys(
                SupportedFileTypes
            )}`
        );
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            `Provided File Extension Type in publishMetrics method is not supported. Possible values: ${Object.keys(
                SupportedFileTypes
            )}`
        );
    });

    it('should log error when cloudwatch fails to send metrics', async () => {
        AWSMock.mock('CloudWatch', 'putMetricData', async (params) => {
            throw new Error('Some error occurred.');
        });

        const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.FILE_TYPES);
        const actualResponse = await cloudWatch.publishMetrics(SupportedFileTypes.JPEG);
        expect(actualResponse).toBeNull();
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            `Failed to publish cw metrics with params: ${JSON.stringify(
                fileTypeMetricsResponse
            )}. Error: Some error occurred.`
        );
    });

    afterAll(() => {
        AWSMock.restore('CloudWatch');
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.UUID;
    });
});
