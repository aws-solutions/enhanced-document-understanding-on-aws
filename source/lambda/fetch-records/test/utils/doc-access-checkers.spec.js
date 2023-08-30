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
const AccessCheckers = require('../../utils/doc-access-checkers');
const SharedLib = require('common-node-lib');

describe('AccessCheckers: redactedDocAccessChecker', () => {
    let unmarshalledDdbRecord;
    beforeEach(() => {
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.S3_REDACTED_PREFIX = 'redacted';

        jest.spyOn(SharedLib, 'getCognitoEntityFromAuthToken').mockImplementation((authToken) => {
            expect(authToken).toEqual('fake-token');
            return {
                'cognito:username': 'fake-userid'
            };
        });

        unmarshalledDdbRecord = {
            BUCKET_NAME: 'fake-bucket',
            S3_KEY: 'fake-s3-key.jpg',
            UPLOADED_FILE_EXTENSION: '.jpg',
            UPLOADED_FILE_NAME: 'simple-document-image',
            DOCUMENT_ID: 'doc-fake-id',
            CASE_ID: 'fake-userid:fake-case-id',
            DOCUMENT_TYPE: 'passport',
            USER_ID: 'fake-userid'
        };
    });

    it('should return true if the document exists', async () => {
        AWSMock.mock('S3', 'headObject', async (params) => {
            expect(params.Bucket).toEqual('fake-bucket');
            expect(params.Key).toEqual('redacted/fake-userid:fake-case-id/doc-fake-id-redacted.jpg');
            return 'mocked-object-metadata';
        });
        const result = await AccessCheckers.redactedDocAccessChecker(unmarshalledDdbRecord, 'fake-token');
        expect(result).toBeTruthy();
    });

    it('should return false if the document does not exist', async () => {
        AWSMock.mock('S3', 'headObject', async (params) => {
            expect(params.Bucket).toEqual('fake-bucket');
            expect(params.Key).toEqual('redacted/fake-userid:fake-case-id/fake-doc-id-redacted.jpg');
            throw new Error('S3 object not found');
        });

        const result = await AccessCheckers.redactedDocAccessChecker(unmarshalledDdbRecord, 'fake-token');
        expect(result).toBeFalsy();
    });

    afterEach(() => {
        AWSMock.restore('S3');
        jest.restoreAllMocks();
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.S3_REDACTED_PREFIX;
    });
});

describe('AccessCheckers: unredactedDocAccessChecker', () => {
    let unmarshalledDdbRecord;
    beforeEach(() => {
        process.env.S3_REDACTED_PREFIX = 'redacted';
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';

        unmarshalledDdbRecord = {
            BUCKET_NAME: 'fake-bucket',
            S3_KEY: 'fake-s3-key.jpg',
            UPLOADED_FILE_EXTENSION: '.jpg',
            UPLOADED_FILE_NAME: 'simple-document-image',
            DOCUMENT_ID: 'doc-fake-id',
            CASE_ID: 'fake-userid:fake-case-id',
            DOCUMENT_TYPE: 'passport',
            USER_ID: 'fake-userid'
        };
    });

    it('should return true if the userId from token matches the userId from the document', async () => {
        jest.spyOn(SharedLib, 'getCognitoEntityFromAuthToken').mockImplementation((authToken) => {
            expect(authToken).toEqual('fake-token');
            return {
                'cognito:username': 'fake-userid'
            };
        });

        const result = await AccessCheckers.unredactedDocAccessChecker(unmarshalledDdbRecord, 'fake-token');
        expect(result).toBeTruthy();
    });

    it('should return false if the document does not exist', async () => {
        jest.spyOn(SharedLib, 'getCognitoEntityFromAuthToken').mockImplementation((authToken) => {
            expect(authToken).toEqual('fake-token');
            return 'mock-invalid-user-id';
        });

        const result = await AccessCheckers.redactedDocAccessChecker(unmarshalledDdbRecord, 'fake-token');
        expect(result).toBeFalsy();
    });

    it('should throw error if access token is not provided', async () => {
        try {
            await AccessCheckers.redactedDocAccessChecker(unmarshalledDdbRecord);
        } catch (error) {
            expect(error.message).toEqual('No authentication token provided');
        }

        try {
            await AccessCheckers.unredactedDocAccessChecker(unmarshalledDdbRecord);
        } catch (error) {
            expect(error.message).toEqual('No authentication token provided');
        }
    });

    afterEach(() => {
        jest.restoreAllMocks();
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.S3_REDACTED_PREFIX;
    });
});
