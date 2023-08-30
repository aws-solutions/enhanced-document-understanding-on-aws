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

const _sfn = require('../../index');
const AWSMock = require('aws-sdk-mock');

describe('With all stepfunction status calls mocked', () => {
    beforeAll(() => {
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.AWS_REGION = 'us-east-1';

        AWSMock.mock('StepFunctions', 'sendTaskSuccess', (params, callback) => {
            if (params.taskToken === 'fakeToken') {
                callback(null, {});
            }
        });

        AWSMock.mock('StepFunctions', 'sendTaskFailure', (params, callback) => {
            if (params.taskToken === 'fakeToken') {
                callback(null, {});
            }
        });

        AWSMock.mock('StepFunctions', 'sendTaskHeartbeat', (params, callback) => {
            if (params.taskToken === 'fakeToken') {
                callback(null, {});
            }
        });
    });

    describe('When async status to stepfunctions are successful', () => {
        it('should successfully send success task status', async () => {
            expect(await _sfn.sendTaskSuccess({ response: 'Fake output' }, 'fakeToken')).toStrictEqual({});
        });

        it('should successfully send failure task status', async () => {
            expect(await _sfn.sendTaskFailure(new Error('Fake error occurred'), 'fakeToken')).toStrictEqual({});
        });

        it('should successfully send heart beat task status', async () => {
            expect(await _sfn.sendTaskHeartbeat('fakeToken')).toStrictEqual({});
        });
    });

    describe('When async status to stepfunctions are not successful', () => {
        describe('With success tasks', () => {
            beforeAll(() => {
                AWSMock.remock('StepFunctions', 'sendTaskSuccess', (params, callback) => {
                    if (params.taskToken === 'fakeToken') {
                        callback(new Error('Fake error for sendTaskSuccess'), null);
                    }
                });
            });

            it('should not throw an error when sending success task status fails', async () => {
                await expect(
                    _sfn.sendTaskSuccess({ response: 'Fake output' }, 'fakeToken')
                ).resolves.not.toThrowError();
            });
        });

        describe('With failure and heartbeat', () => {
            beforeAll(() => {
                AWSMock.remock('StepFunctions', 'sendTaskFailure', (params, callback) => {
                    if (params.taskToken === 'fakeToken') {
                        callback(new Error('Fake error for sendTaskFailure'), null);
                    }
                });

                AWSMock.remock('StepFunctions', 'sendTaskHeartbeat', (params, callback) => {
                    if (params.taskToken === 'fakeToken') {
                        callback(new Error('Fake error for sendTaskHeartbeat'), null);
                    }
                });
            });

            it('should fail when sending failure task status', async () => {
                try {
                    await _sfn.sendTaskFailure(new Error('Fake status error'), 'fakeToken');
                } catch (error) {
                    expect(error.message).toStrictEqual('Fake error for sendTaskFailure');
                }
            });

            it('should fail when sending heartbeat', async () => {
                try {
                    await _sfn.sendTaskHeartbeat('fakeToken');
                } catch (error) {
                    expect(error.message).toStrictEqual('Fake error for sendTaskHeartbeat');
                }
            });
        });
    });

    afterAll(() => {
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.AWS_REGION;
        AWSMock.restore('StepFunctions');
    });
});
