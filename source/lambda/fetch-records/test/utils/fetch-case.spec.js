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
const AWSMock = require('aws-sdk-mock');
const CaseFetcher = require('../../utils/fetch-case');

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

    beforeAll(() => {
        process.env.CASE_DDB_TABLE_NAME = 'testTable';
        process.env.S3_UPLOAD_PREFIX = 'initial';
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';

        AWSMock.mock('DynamoDB', 'query', (error, callback) => {
            const mockReturnResponse = {
                Count: dataRecord.Count,
                Items: dataRecord.Items
            };
            callback(null, mockReturnResponse);
        });
    });

    it('Should return all records that have the same caseId', async () => {
        const params = { caseId: 'fake-case-id' };
        const response = await CaseFetcher.getCase(params);

        const expectedResponse = {
            Count: dataRecord.Count,
            Items: dataRecord.Items
        };
        expect(response).toEqual(expectedResponse);
    });

    it('Should return response without Item if caseId not found', async () => {
        AWSMock.remock('DynamoDB', 'query', (error, callback) => {
            callback(null, { Items: [] });
        });

        try {
            const params = { caseId: 'invalid-fake-case-id' };
            await CaseFetcher.getCase(params);
        } catch (error) {
            expect(error.message).toEqual('Incorrect CaseId');
        }
    });

    afterAll(() => {
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.CASE_DDB_TABLE_NAME;

        AWSMock.restore('DynamoDB');
    });
});

describe('When listing all cases', () => {
    beforeEach(() => {
        process.env.CASE_DDB_TABLE_NAME = 'testTable';
        process.env.S3_UPLOAD_PREFIX = 'initial';
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.DDB_GSI_USER_ID = 'fake-user-index';
        process.env.DDB_GSI_USER_DOC_ID = 'fake-user-doc-index';
    });

    it('should return caseId key of all the records if query size not specified', async () => {
        const mockedResponse = {
            Count: 2,
            Items: [
                {
                    CASE_ID: {
                        S: 'fake-case-id-1'
                    }
                },
                {
                    CASE_ID: {
                        S: 'fake-case-id-2'
                    }
                }
            ]
        };
        AWSMock.mock('DynamoDB', 'query', async (params) => {
            expect(params.TableName).toEqual('testTable');
            expect(params.IndexName).toEqual('fake-user-index');
            return mockedResponse;
        });

        const caseRecords = await CaseFetcher.listCases('some-user');
        expect(caseRecords).toEqual(mockedResponse);
    });

    it('should return caseId key of paginated the records if query size specified', async () => {
        const params = {
            size: 20
        };
        const mockedResponse = {
            Count: 2,
            Items: [
                {
                    CASE_ID: {
                        S: 'fake-case-id-1'
                    }
                },
                {
                    CASE_ID: {
                        S: 'fake-case-id-2'
                    }
                }
            ]
        };
        AWSMock.mock('DynamoDB', 'query', async (params) => {
            expect(params.TableName).toEqual('testTable');
            expect(params.IndexName).toEqual('fake-user-doc-index');
            return mockedResponse;
        });

        const caseRecords = await CaseFetcher.listCases('some-user', params);
        expect(caseRecords).toEqual(mockedResponse);
    });

    afterEach(() => {
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.S3_UPLOAD_PREFIX;
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.DDB_GSI_USER_ID;
        delete process.env.DDB_GSI_USER_DOC_ID;

        AWSMock.restore('DynamoDB');
    });
});
