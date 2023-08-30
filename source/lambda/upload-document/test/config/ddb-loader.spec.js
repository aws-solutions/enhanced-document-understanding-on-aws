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
const { loadWorkflowConfig } = require('../../config/ddb-loader');
const { configJSON, workflowConfigName, dynamoDBConfigResponse } = require('./config-data');

describe('When loading workflow config, if TableName is available', () => {
    beforeAll(() => {
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.WORKFLOW_CONFIG_TABLE_NAME = 'fake-workflow-config-table';
    });

    beforeAll(() => {
        AWSMock.mock('DynamoDB', 'getItem', (params, callback) => {
            expect(params.TableName == process.env.WORKFLOW_CONFIG_TABLE_NAME);
            expect(params.Key.workflowConfigName == workflowConfigName);

            callback(null, dynamoDBConfigResponse);
        });
    });

    it('should return a JSON if the config name exists in the table', async () => {
        expect(await loadWorkflowConfig(workflowConfigName)).toStrictEqual(configJSON);
    });

    afterAll(() => {
        AWSMock.restore('DynamoDB');
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.WORKFLOW_CONFIG_TABLE_NAME;
    });
});

describe('When config name does not exist in the table', () => {
    beforeAll(() => {
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.WORKFLOW_CONFIG_TABLE_NAME = 'fake-workflow-config-table';

        AWSMock.mock('DynamoDB', 'getItem', (params, callback) => {
            expect(params.TableName == process.env.WORKFLOW_CONFIG_TABLE_NAME);
            expect(params.Key.workflowConfigName == workflowConfigName);

            callback(null, {
                Key: {
                    WorkflowConfigName: {
                        S: this.workflowConfigName
                    }
                },
                ConsumedCapacity: {
                    TableName: process.env.WORKFLOW_CONFIG_TABLE_NAME
                }
            });
        });
    });

    it('should throw an error', async () => {
        try {
            await loadWorkflowConfig('non-existing-config');
        } catch (error) {
            expect(error.message).toEqual('No config found in table for config name non-existing-config');
        }
    });

    afterAll(() => {
        AWSMock.restore('DynamoDB');
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.WORKFLOW_CONFIG_TABLE_NAME;
    });
});

describe('When getItem call fails', () => {
    beforeAll(() => {
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.WORKFLOW_CONFIG_TABLE_NAME = 'fake-workflow-config-table';

        AWSMock.mock('DynamoDB', 'getItem', (params, callback) => {
            expect(params.TableName == process.env.WORKFLOW_CONFIG_TABLE_NAME);
            expect(params.Key.workflowConfigName == workflowConfigName);

            callback(new Error('Fake Error for testing'), null);
        });
    });

    it('should throw an error', async () => {
        try {
            await loadWorkflowConfig('non-existing-config');
        } catch (error) {
            expect(error.message).toEqual('Fake Error for testing');
        }
    });

    afterAll(() => {
        AWSMock.restore('DynamoDB');
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.WORKFLOW_CONFIG_TABLE_NAME;
    });
});

describe('When WORKFLOW_CONFIG_TABLE_NAME environment variable is not set', () => {
    beforeAll(() => {
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
    });

    it('should throw an error', async () => {
        try {
            await loadWorkflowConfig(workflowConfigName);
        } catch (error) {
            expect(error.message).toEqual(
                'Either CASE_DDB_TABLE_NAME or WORKFLOW_CONFIG_TABLE_NAME Lambda Environment variable not set.'
            );
        }
    });

    afterAll(() => {
        delete process.env.AWS_SDK_USER_AGENT;
    });
});
