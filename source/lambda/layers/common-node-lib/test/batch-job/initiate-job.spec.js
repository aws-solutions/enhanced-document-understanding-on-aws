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

const _sfn = require('../../stepfunctions/task-notify');
const _ = require('lodash');

const { jobMessage } = require('../event-test-data');
const jobProcessor = require('../../batch-job/initiate-job');

describe('Running Synchronous job with correct inputs', () => {
    let mockSfnHeartbeat, mockSfnSuccessStatus, mockSfnFailureStatus;
    const mockedRunSyncJob = async (taskToken, sqsRecord) => {
        return { inferences: { 'mocked-ai-service': 'mocked-response' } };
    };

    beforeAll(() => {
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.AWS_REGION = 'us-east-1';

        mockSfnSuccessStatus = jest.spyOn(_sfn, 'sendTaskSuccess');
        mockSfnSuccessStatus.mockImplementation((response, taskToken) => {
            return {};
        });

        mockSfnFailureStatus = jest.spyOn(_sfn, 'sendTaskFailure');
        mockSfnFailureStatus.mockImplementation((response, taskToken) => {
            return {};
        });

        mockSfnHeartbeat = jest.spyOn(_sfn, 'sendTaskHeartbeat');
        mockSfnHeartbeat.mockImplementation((taskToken) => {
            return {};
        });
    });

    describe('When sync service runs successfully and sends success status to stepfunction', () => {
        it('should successfully send success task status', async () => {
            await jobProcessor.processRecordsSync(jobMessage.Records, mockedRunSyncJob);
            expect(mockSfnSuccessStatus).toHaveBeenCalledTimes(2);
        });
    });

    describe('When processing SQS records', () => {
        it('should append AI service response to record if it is the first workflow', async () => {
            const expectedResponse = {
                ...JSON.parse(jobMessage.Records[0].body).input,
                inferences: { 'mocked-ai-service': 'mocked-response' }
            };

            await jobProcessor.processRecordsSync([jobMessage.Records[0]], mockedRunSyncJob);
            expect(mockSfnSuccessStatus.mock.calls[0][0]).toEqual(expectedResponse);
        });

        it('should append AI service response to record if it is any of the later workflows', async () => {
            const expectedResponse = _.merge(JSON.parse(jobMessage.Records[1].body).input, {
                inferences: { 'mocked-ai-service': 'mocked-response' }
            });

            await jobProcessor.processRecordsSync([jobMessage.Records[1]], mockedRunSyncJob);

            expect(mockSfnSuccessStatus.mock.calls.slice(-1)[0][0]).toEqual(expectedResponse);
        });

        it('should catch an error and send a task failure notice', async () => {
            const mockedRunSyncJobError = (taskToken, sqsRecord) => {
                throw Error('fake-error');
            };

            await jobProcessor.processRecordsSync([jobMessage.Records[1]], mockedRunSyncJobError);

            expect(mockSfnFailureStatus.mock.calls.slice(-1)[0][0].message).toEqual('fake-error');
        });
    });

    afterAll(() => {
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.AWS_REGION;

        mockSfnSuccessStatus.mockRestore();
        mockSfnFailureStatus.mockRestore();
        mockSfnHeartbeat.mockRestore();
    });
});
