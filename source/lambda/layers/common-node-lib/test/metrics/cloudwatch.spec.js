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

const AWSMock = require('aws-sdk-mock');

process.env.AWS_REGION = 'fakeRegion';
process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
const { CloudWatchMetrics } = require('../../metrics/cloudwatch');

const { CloudwatchNamespace, CaseStatus, ComprehendAPIs, SupportedFileTypes } = require('../../constants');
const {
    fileTypeMetricsResponse,
    comprehendWorkflowMetricsResponse,
    caseStatusMetricsResponse,
    documentCountResponse
} = require('../event-test-data');

describe('Cloudwatch Metrics: When provided with correct inputs', () => {
    let cloudwatchMock;

    beforeAll(() => {
        process.env.AWS_REGION = 'fakeRegion';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.UUID = 'fake-uuid'
        jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));
    });

    afterEach(() => {
        jest.clearAllMocks();
        AWSMock.restore('CloudWatch');
    });

    it('should pass successfully when case status metrics are passed', async () => {
        cloudwatchMock = AWSMock.mock('CloudWatch', 'putMetricData', async (params) => {
            expect(params).toEqual(caseStatusMetricsResponse);
            return 'success';
        });
        const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.CASE);
        const response = await cloudWatch.publishMetrics(CaseStatus.INITIATE);
        expect(response).toEqual('success');
    });

    it('should pass successfully when file type metrics are passed', async () => {
        cloudwatchMock = AWSMock.mock('CloudWatch', 'putMetricData', async (params) => {
            expect(params).toEqual(fileTypeMetricsResponse);
            return 'success';
        });

        const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.FILE_TYPES);
        const response = await cloudWatch.publishMetrics(SupportedFileTypes.JPEG, 2);
        expect(response).toEqual('success');
    });

    it('should pass successfully when comprehend workflow metrics are passed', async () => {
        cloudwatchMock = AWSMock.mock('CloudWatch', 'putMetricData', async (params) => {
            expect(params).toEqual(comprehendWorkflowMetricsResponse);
            return 'success';
        });

        const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.WORKFLOW_TYPES);
        const response = await cloudWatch.publishMetrics(ComprehendAPIs.COMPREHEND_DETECT_ENTITIES_SYNC);
        expect(response).toEqual('success');
    });

    it('should pass successfully when textract workflow metrics are passed', async () => {
        cloudwatchMock = AWSMock.mock('CloudWatch', 'putMetricData', async (params) => {
            expect(params).toEqual(documentCountResponse);
            return 'success';
        });

        const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.DOCUMENTS);
        const response = await cloudWatch.publishMetrics();
        expect(response).toEqual('success');
    });

    it('should allow switching strategies', async () => {
        cloudwatchMock = AWSMock.mock('CloudWatch', 'putMetricData', async (params) => {
            expect(params).toEqual(fileTypeMetricsResponse);
            return 'success';
        });
        const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.FILE_TYPES);
        let response = await cloudWatch.publishMetrics(SupportedFileTypes.JPEG, 2);
        expect(response).toEqual('success');
        AWSMock.restore('CloudWatch');

        cloudwatchMock = AWSMock.mock('CloudWatch', 'putMetricData', async (params) => {
            expect(params).toEqual(caseStatusMetricsResponse);
            return 'success';
        });
        cloudWatch.setNamespace(CloudwatchNamespace.CASE);
        response = await cloudWatch.publishMetrics(CaseStatus.INITIATE);
        expect(response).toEqual('success');
        AWSMock.restore('CloudWatch');

        AWSMock.mock('CloudWatch', 'putMetricData', async (params) => {
            expect(params).toEqual(comprehendWorkflowMetricsResponse);
            return 'success';
        });
        cloudWatch.setNamespace(CloudwatchNamespace.WORKFLOW_TYPES);
        response = await cloudWatch.publishMetrics(ComprehendAPIs.COMPREHEND_DETECT_ENTITIES_SYNC);
        expect(response).toEqual('success');
        AWSMock.restore('CloudWatch');

        AWSMock.mock('CloudWatch', 'putMetricData', async (params) => {
            expect(params).toEqual(documentCountResponse);
            return 'success';
        });
        cloudWatch.setNamespace(CloudwatchNamespace.DOCUMENTS);
        response = await cloudWatch.publishMetrics();
        expect(response).toEqual('success');
        AWSMock.restore('CloudWatch');
    });

    afterAll(() => {
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.UUID;
    });
});

describe('Cloudwatch Metrics: When provided with incorrect inputs', () => {
    beforeAll(() => {
        process.env.UUID = 'fake-uuid'
        process.env.AWS_REGION = 'fakeRegion';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
    });

    it('should throw an error when incorrect CloudwatchNamespace is passed', async () => {
        expect(() => {
            new CloudWatchMetrics(CloudwatchNamespace.ABC);
        }).toThrow(`Invalid CloudwatchNamespace. Possible values: ${Object.keys(CloudwatchNamespace)}`);
    });

    it('should throw an error when incorrect namespace string is passed', async () => {
        expect(() => {
            new CloudWatchMetrics('some-namespace');
        }).toThrow(`Invalid CloudwatchNamespace. Possible values: ${Object.keys(CloudwatchNamespace)}`);
    });

    it('should throw an error when namespace is not passed in object initialization', async () => {
        expect(() => {
            new CloudWatchMetrics();
        }).toThrow(`Invalid CloudwatchNamespace. Possible values: ${Object.keys(CloudwatchNamespace)}`);
    });

    it('should throw an error when namespace is not passed in setNamespace', async () => {
        const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.FILE_TYPES);
        expect(() => {
            cloudWatch.setNamespace();
        }).toThrow(`setNamespace method needs a CloudwatchNamespace type as an argument`);
    });

    it('should throw an error when invalid namespace is passed in setNamespace', async () => {
        const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.FILE_TYPES);
        expect(() => {
            cloudWatch.setNamespace('some-namespace');
        }).toThrow(`Invalid CloudwatchNamespace. Possible values: ${Object.keys(CloudwatchNamespace)}`);
    });

    afterAll(() => {
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.UUID;
    });
});
