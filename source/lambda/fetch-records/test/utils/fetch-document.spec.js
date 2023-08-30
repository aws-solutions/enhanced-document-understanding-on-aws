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
const AWS = require('aws-sdk');
const DocFetcher = require('../../utils/fetch-document');
const SharedLib = require('common-node-lib');

const MOCK_DDB_RESPONSE = {
    'Item': {
        'BUCKET_NAME': {
            'S': 'fake-bucket'
        },
        'S3_KEY': {
            'S': 'fake-s3-key.jpg'
        },
        'UPLOADED_FILE_EXTENSION': {
            'S': '.jpg'
        },
        'UPLOADED_FILE_NAME': {
            'S': 'simple-document-image.jpg'
        },
        'DOCUMENT_ID': {
            'S': 'doc-fake-id'
        },
        'CASE_ID': {
            'S': 'fake-userid:fake-case-id'
        },
        'DOCUMENT_TYPE': {
            'S': 'passport'
        },
        'USER_ID': {
            'S': 'fake-userid'
        }
    }
};

describe('When loading workflow config, if TableName is available', () => {
    beforeAll(() => {
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.CASE_DDB_TABLE_NAME = 'fake-workflow-config-table';
        process.env.S3_REDACTED_PREFIX = 'redacted';
        AWSMock.mock('DynamoDB', 'getItem', async (params) => {
            expect(params.TableName == process.env.CASE_DDB_TABLE_NAME);
            expect(params.Key.CASE_ID === 'fake-userid:fake-case-id');
            expect(params.Key.DOCUMENT_ID === 'fake-document-id');

            return MOCK_DDB_RESPONSE;
        });

        jest.spyOn(SharedLib, 'getCognitoEntityFromAuthToken').mockImplementation((authToken) => {
            expect(authToken).toBeDefined();
            return {
                'cognito:username': 'fake-userid'
            };
        });

        AWSMock.mock('S3', 'headObject', async (params) => {
            expect(params).toBeDefined();
            return 'mocked-object-metadata';
        });
    });

    it('should query the workflow config table', async () => {
        const params = {
            caseId: 'fake-userid:fake-case-id',
            documentId: 'fake-document-id'
        };
        const response = await DocFetcher.getDdbRecord(params);
        expect(response).toEqual(AWS.DynamoDB.Converter.unmarshall(MOCK_DDB_RESPONSE.Item));
    });

    it('should get the redactedDoc when the redactedDocInfo is created', async () => {
        const params = {
            caseId: 'fake-userid:fake-case-id',
            documentId: 'fake-document-id'
        };
        const response = await DocFetcher.getRedactedDocInfo(params, () => {
            return true;
        });
        expect(response).toEqual({
            DocId: MOCK_DDB_RESPONSE.Item.DOCUMENT_ID.S,
            Bucket: MOCK_DDB_RESPONSE.Item.BUCKET_NAME.S,
            key: 'redacted/fake-userid:fake-case-id/doc-fake-id-redacted.jpg',
            FileName: MOCK_DDB_RESPONSE.Item.UPLOADED_FILE_NAME.S
        });
    });

    it('should throw an error if the redaction checker callback returns false', async () => {
        const params = {
            caseId: 'fake-userid:fake-case-id',
            documentId: 'fake-document-id'
        };
        try {
            await DocFetcher.getRedactedDocInfo(params, () => {
                return false;
            });
        } catch (error) {
            expect(error.message).toEqual('User does not have access to this document');
        }
    });

    it('should get the unredacted doc info', async () => {
        const params = {
            caseId: 'fake-userid:fake-case-id',
            documentId: 'fake-document-id'
        };
        const response = await DocFetcher.getUnredactedDocInfo(params, () => {
            return true;
        });
        expect(response).toEqual({
            DocId: MOCK_DDB_RESPONSE.Item.DOCUMENT_ID.S,
            Bucket: MOCK_DDB_RESPONSE.Item.BUCKET_NAME.S,
            key: 'fake-s3-key.jpg',
            FileName: MOCK_DDB_RESPONSE.Item.UPLOADED_FILE_NAME.S
        });
    });

    it('should throw an error if the unredacted doc access checker callback returns false', async () => {
        const params = {
            caseId: 'fake-userid:fake-case-id',
            documentId: 'fake-document-id'
        };
        try {
            await DocFetcher.getUnredactedDocInfo(params, () => {
                return false;
            });
        } catch (error) {
            expect(error.message).toEqual('User does not have access to this document');
        }
    });

    it('should return an object containing file id, key and bucket, for redacted doc', async () => {
        const params = {
            caseId: 'fake-userid:fake-case-id',
            documentId: 'doc-fake-id',
            redacted: true,
            authToken: 'fake-auth-token'
        };
        expect(await DocFetcher.getDocumentPrefix(params)).toEqual({
            DocId: MOCK_DDB_RESPONSE.Item.DOCUMENT_ID.S,
            Bucket: MOCK_DDB_RESPONSE.Item.BUCKET_NAME.S,
            key: 'redacted/fake-userid:fake-case-id/doc-fake-id-redacted.jpg',
            FileName: MOCK_DDB_RESPONSE.Item.UPLOADED_FILE_NAME.S
        });
    });

    it('should return an object containing file id, key and bucket, for unredacted doc', async () => {
        const params = {
            caseId: 'fake-userid:fake-case-id',
            documentId: 'doc-fake-id',
            redacted: false,
            authToken: 'fake-auth-token'
        };
        expect(await DocFetcher.getDocumentPrefix(params)).toEqual({
            DocId: MOCK_DDB_RESPONSE.Item.DOCUMENT_ID.S,
            Bucket: MOCK_DDB_RESPONSE.Item.BUCKET_NAME.S,
            key: MOCK_DDB_RESPONSE.Item.S3_KEY.S,
            FileName: MOCK_DDB_RESPONSE.Item.UPLOADED_FILE_NAME.S
        });
    });

    //should throw an error if the caseId is missing
    it('should throw an error if documentId is missing from request params', async () => {
        const params = {
            caseId: 'fake-userid:fake-case-id'
        };
        await expect(DocFetcher.getDocumentPrefix(params)).rejects.toThrow('Missing caseId or documentId');
    });

    afterAll(() => {
        AWSMock.restore('DynamoDB');
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.S3_REDACTED_PREFIX;
    });
});
