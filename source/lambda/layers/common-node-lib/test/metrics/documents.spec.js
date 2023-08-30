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
const { documentCountResponse } = require('../event-test-data');
const { CloudwatchNamespace } = require('../../constants');

describe('Cloudwatch Document Metrics: When provided with correct inputs', () => {
    let requestParams;

    beforeAll(() => {
        process.env.AWS_REGION = 'fakeRegion';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.UUID = 'fake-uuid'
        requestParams = documentCountResponse;
        jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));

        AWSMock.mock('CloudWatch', 'putMetricData', async (params) => {
            return 'success';
        });
    });

    beforeEach(() => {
        AWSMock.restore('CloudWatch');
    });

    it('should pass successfully when supported file type with count is passed', async () => {
        AWSMock.mock('CloudWatch', 'putMetricData', async (params) => {
            expect(params).toEqual(documentCountResponse);
            return 'success';
        });

        const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.DOCUMENTS);
        const actualResponse = await cloudWatch.publishMetrics();
        expect(actualResponse).toEqual('success');
    });

    it('should pass successfully when supported file type with count is passed', async () => {
        documentCountResponse.MetricData[0].Value = 2;
        AWSMock.mock('CloudWatch', 'putMetricData', async (params) => {
            expect(params).toEqual(documentCountResponse);
            return 'success';
        });

        const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.DOCUMENTS);
        const actualResponse = await cloudWatch.publishMetrics(2);
        expect(actualResponse).toEqual('success');
    });

    afterAll(() => {
        AWSMock.restore('CloudWatch');
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.UUID;
    });
});

describe('Cloudwatch Document Metrics: When provided with incorrect inputs', () => {
    let consoleErrorSpy;
    beforeAll(() => {
        process.env.AWS_REGION = 'fakeRegion';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.UUID = 'fake-uuid'
        jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));

        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.clearAllMocks();
        AWSMock.restore('CloudWatch');
    });

    it('should log error when cloudwatch fails to send metrics due to exception in publishMetrics', async () => {
        AWSMock.mock('CloudWatch', 'putMetricData', async (params) => {
            throw new Error('Some error occurred.');
        });

        const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.DOCUMENTS);
        const actualResponse = await cloudWatch.publishMetrics(2);
        expect(actualResponse).toBeNull();
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            `Failed to publish cw metrics with params: ${JSON.stringify(
                documentCountResponse
            )}. Error: Some error occurred.`
        );
    });

    it('should log error when cloudwatch fails to send metrics due to incorrect value passed', async () => {
        documentCountResponse.MetricData[0].Value = 'xx';
        AWSMock.mock('CloudWatch', 'putMetricData', async (params) => {
            return 'success';
        });

        const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.DOCUMENTS);
        const actualResponse = await cloudWatch.publishMetrics('xx');
        expect(actualResponse).toBeNull();
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            `Failed to publish cw metrics with params: ${JSON.stringify(
                documentCountResponse
            )}. Error: Expected params.MetricData[0].Value to be a number`
        );
    });

    afterAll(() => {
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.UUID;
    });
});
