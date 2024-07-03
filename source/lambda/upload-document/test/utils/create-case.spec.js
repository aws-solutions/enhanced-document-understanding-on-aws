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
 **********************************************************************************************************************/
'use strict';

const AWSMock = require('aws-sdk-mock');
const CaseCreator = require('../../utils/create-case');
const { CloudWatchMetrics } = require('../../../layers/common-node-lib/metrics/cloudwatch');

exports.isUUID = (uuid) => {
    return uuid.match('^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$');
};

describe('When creating a new case record', () => {
    let publishMetricsSpy, ddbParams;
    beforeEach(() => {
        process.env.CASE_DDB_TABLE_NAME = 'fake-test-table';
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.S3_UPLOAD_PREFIX = 'initial';
        jest.restoreAllMocks();
        publishMetricsSpy = jest.spyOn(CloudWatchMetrics.prototype, 'publishMetrics').mockImplementation(() => {});
        jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2000-01-01T00:00:00.000Z');

        ddbParams = {
            TableName: 'fake-test-table',
            Item: {
                'CASE_ID': { 'S': 'fakeUserId:some-uuid' },
                'DOCUMENT_ID': { 'S': '0000' },
                'DOC_COUNT': { 'N': '0' },
                'USER_ID': { 'S': 'fakeUserId' },
                'USER_DOC_ID': { 'S': 'fakeUserId:0000' },
                'CASE_NAME': { 'S': 'fakeCaseName' },
                'CREATION_TIMESTAMP': { 'S': '2000-01-01T00:00:00.000Z' },
                'STATUS': { 'S': 'initiate' },
                'ENABLE_BACKEND_UPLOAD': {
                    'BOOL': false
                },
                'S3_FOLDER_PATH': {
                    'S': 'initial/fakeUserId:some-uuid'
                }
            }
        };
    });

    it('should generate a valid caseId with the provided userId:', () => {
        const userId = 'fakeUserId';
        const response = CaseCreator.generateCaseId(userId);

        const [receivedUserId, receivedCaseId] = response.split(':');
        expect(this.isUUID(receivedCaseId)).toBeTruthy();
        expect(receivedUserId).toEqual(userId);
    });

    it('should successfully add records to the database table', async () => {
        jest.spyOn(CaseCreator, 'generateCaseId').mockImplementation(() => {
            return 'fakeUserId:some-uuid';
        });

        const userId = 'fakeUserId';
        const caseName = 'fakeCaseName';

        AWSMock.mock('DynamoDB', 'putItem', async (params) => {
            expect(params).toEqual(ddbParams);
            return {};
        });

        const params = {
            userId: userId,
            caseName: caseName
        };
        const response = await CaseCreator.createCase(params);

        expect(response.ddbResponse).toEqual({
            'CASE_ID': 'fakeUserId:some-uuid',
            'DOCUMENT_ID': '0000',
            'DOC_COUNT': 0,
            'USER_ID': 'fakeUserId',
            'USER_DOC_ID': 'fakeUserId:0000',
            'CASE_NAME': 'fakeCaseName',
            'CREATION_TIMESTAMP': '2000-01-01T00:00:00.000Z',
            'STATUS': 'initiate',
            'S3_FOLDER_PATH': 'initial/fakeUserId:some-uuid',
            'ENABLE_BACKEND_UPLOAD': false
        });
        expect(response.caseId).toEqual('fakeUserId:some-uuid');
        expect(publishMetricsSpy).toHaveBeenCalledTimes(1);
    });

    afterEach(() => {
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;

        AWSMock.restore('DynamoDB');
        publishMetricsSpy.mockRestore();
        jest.restoreAllMocks();
    });
});

describe('Raises an error when DynamoDb throws an error', () => {
    let publishMetricsSpy;
    beforeEach(() => {
        jest.spyOn(CaseCreator, 'generateCaseId').mockImplementation(() => {
            return 'fakeUserId:some-uuid';
        });

        process.env.CASE_DDB_TABLE_NAME = 'fake-test-table';
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';

        publishMetricsSpy = jest.spyOn(CloudWatchMetrics.prototype, 'publishMetrics').mockImplementation(() => {});
    });

    it('should throw an error in DynamoDb', async () => {
        jest.spyOn(CaseCreator, 'generateCaseId').mockImplementation(() => {
            return 'fakeUserId:some-uuid';
        });

        AWSMock.mock('DynamoDB', 'putItem', (ddbParams, callback) => {
            callback(new Error('Some error occurred.'), null);
        });

        const params = {
            userId: 'fakeUserId',
            caseName: 'fakeCaseName'
        };

        await expect(CaseCreator.createCase(params)).rejects.toThrow('Some error occurred.');
        expect(publishMetricsSpy).toHaveBeenCalledTimes(0);
    });
});
