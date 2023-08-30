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
