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
const CaseFetcher = require('../../ddb/ddb-get-case');

describe('When retrieving a single record from the database', () => {
    const dataRecord = {
        Key: {
            CASE_ID: {
                S: 'fake-case-id'
            }
        },
        Count: 2,
        Items: [
            {
                DOCUMENT_ID: {
                    S: 'fake-document-id-1'
                }
            },
            {
                DOCUMENT_ID: {
                    S: 'fake-document-id-2'
                }
            }
        ]
    };

    beforeEach(() => {
        process.env.S3_UPLOAD_PREFIX = 'initial';
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';

        AWSMock.mock('DynamoDB', 'query', async (params) => {
            expect(params).toBeDefined();
            const mockReturnResponse = {
                Count: dataRecord.Count,
                Items: dataRecord.Items
            };
            return mockReturnResponse;
        });
    });

    it('Should return all records that have the same caseId', async () => {
        const params = { caseId: 'fake-case-id', ddbTableName: 'testTable' };
        const response = await CaseFetcher.getCase(params);

        const expectedResponse = {
            Count: dataRecord.Count,
            Items: dataRecord.Items
        };
        expect(response).toEqual(expectedResponse);
    });

    it('Should throw error if ddb table name not in params', async () => {
        try {
            const params = { caseId: 'invalid-fake-case-id' };

            await CaseFetcher.getCase(params);
        } catch (error) {
            expect(error.message).toEqual('Table name is required');
        }
    });

    it('Should return response without Item if caseId not found', async () => {
        AWSMock.remock('DynamoDB', 'query', async (params) => {
            expect(params).toBeDefined();
            return { Items: [] };
        });

        try {
            const params = { caseId: 'invalid-fake-case-id', ddbTableName: 'testTable' };
            await CaseFetcher.getCase(params);
        } catch (error) {
            expect(error.message).toEqual('Incorrect CaseId');
        }
    });

    afterEach(() => {
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.S3_UPLOAD_PREFIX;

        AWSMock.restore('DynamoDB');
    });
});
