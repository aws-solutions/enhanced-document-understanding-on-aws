// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const AWSMock = require('aws-sdk-mock');
const CaseFetcher = require('../../utils/fetch-case');

const caseRecord = {
    Key: {
        CASE_ID: {
            S: 'fake-case-id'
        }
    },
    Count: 3,
    Items: [
        {
            DOCUMENT_ID: {
                S: '0000'
            }
        },
        {
            DOCUMENT_ID: {
                S: 'fake-document-id-1'
            },
            DOCUMENT_TYPE: {
                S: 'passport'
            }
        },
        {
            DOCUMENT_ID: {
                S: 'fake-document-id-2'
            },
            DOCUMENT_TYPE: {
                S: 'bankaccount'
            }
        }
    ]
};

describe('When retrieving a single record from the database', () => {
    beforeAll(() => {
        process.env.CASE_DDB_TABLE_NAME = 'testTable';
        process.env.S3_UPLOAD_PREFIX = 'initial';
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';

        AWSMock.mock('DynamoDB', 'query', (error, callback) => {
            const mockReturnResponse = {
                Count: caseRecord.Count,
                Items: caseRecord.Items
            };
            callback(null, mockReturnResponse);
        });
    });

    it('Should return all records that have the same caseId', async () => {
        const params = { caseId: 'fake-case-id' };
        const response = await CaseFetcher.getCase(params);

        const expectedResponse = {
            Count: caseRecord.Count,
            Items: caseRecord.Items
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

module.exports = { caseRecord };
