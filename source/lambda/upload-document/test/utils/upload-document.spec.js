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
const DocUploader = require('../../utils/upload-document');
const CaseCreator = require('../../utils/create-case');
const { dynamoDBConfigResponse } = require('../config/config-data');
const SharedLib = require('common-node-lib');

exports.isUUID = (uuid) => {
    return uuid.match('^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$');
};

describe('When generating a document ID', () => {
    it('should be a valid uuid with', () => {
        const docId = DocUploader.createDocumentId();
        const validDocIdPrefix = 'doc-';

        expect(docId.startsWith(validDocIdPrefix)).toBeTruthy();
        expect(this.isUUID(docId.replace('doc-', ''))).toBeTruthy();
    });
});

describe('When generating the upload FileKey', () => {
    beforeAll(() => {
        process.env.S3_UPLOAD_PREFIX = 'initial';
        process.env.UPLOAD_DOCS_BUCKET_NAME = 'testBucket';
        process.env.WORKFLOW_CONFIG_NAME = 'fakeWorkflowName';
        process.env.WORKFLOW_CONFIG_TABLE_NAME = 'fakeWorkflowConfigTableName';
    });

    it('Should have a valid format', () => {
        const userId = 'fakeUserId';
        const caseId = CaseCreator.generateCaseId(userId);
        const docId = DocUploader.createDocumentId();
        const fileExtension = '.pdf';

        const fileKey = DocUploader.createFileKey(caseId, docId, fileExtension);

        const fileKeyArr = fileKey.split('/');
        const testUserId = fileKeyArr[1].split(':')[0];
        const testCaseIdUuid = fileKeyArr[1].split(':')[1];
        const testFileNameArr = fileKeyArr[2].split('.');
        const validDocIdPrefix = 'doc-';

        expect(fileKeyArr[0]).toEqual('initial');
        expect(testUserId).toEqual(userId);
        expect(this.isUUID(testCaseIdUuid)).toBeTruthy();
        expect(testFileNameArr[0].startsWith(validDocIdPrefix)).toBeTruthy();
        expect(this.isUUID(testFileNameArr[0].slice(validDocIdPrefix.length))).toBeTruthy();
        expect(testFileNameArr[1]).toEqual('pdf');
    });

    afterAll(() => {
        delete process.env.UPLOAD_DOCS_BUCKET_NAME;
        delete process.env.S3_UPLOAD_PREFIX;
        delete process.env.WORKFLOW_CONFIG_NAME;
        delete process.env.WORKFLOW_CONFIG_TABLE_NAME;
    });
});

describe('When creating an entry for adding a new document to the database', () => {
    const postPolicyResponse = {
        url: 'fake-bucket-url',
        fields: {
            key: 'fake-key',
            bucket: 'fake-bucket'
        }
    };
    beforeEach(() => {
        process.env.CASE_DDB_TABLE_NAME = 'testTable';
        process.env.UPLOAD_DOCS_BUCKET_NAME = 'testBucket';
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.WORKFLOW_CONFIG_NAME = 'fakeWorkflowName';
        process.env.WORKFLOW_CONFIG_TABLE_NAME = 'fakeWorkflowConfigTableName';
    });

    it('should put an entry into the database', async () => {
        const params = {
            userId: 'fake-user-id',
            caseId: 'user-id:fake-case-id',
            caseName: 'case001',
            fileName: 'fake-file-name',
            fileExtension: '.pdf',
            documentType: 'fake-doc-type',
            docId: 'fake-doc-id',
            filekey: 'fake-file-key'
        };

        AWSMock.mock('DynamoDB', 'putItem', async (ddbParams) => {
            expect(ddbParams.TableName).toEqual('testTable');
            expect(Object.keys(ddbParams.Item)).toEqual([
                'CASE_ID',
                'CASE_NAME',
                'DOCUMENT_ID',
                'BUCKET_NAME',
                'S3_KEY',
                'UPLOADED_FILE_NAME',
                'UPLOADED_FILE_EXTENSION',
                'DOCUMENT_TYPE',
                'USER_ID',
                'CREATION_TIMESTAMP'
            ]);

            return 'success';
        });

        expect(await DocUploader.addDocumentToDb(params)).toEqual('success');
    });

    afterEach(() => {
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.UPLOAD_DOCS_BUCKET_NAME;
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.WORKFLOW_CONFIG_NAME;
        delete process.env.WORKFLOW_CONFIG_TABLE_NAME;

        AWSMock.restore('DynamoDB');
    });
});

describe('When creating a presigned POST request', () => {
    const postPolicyResponse = {
        url: 'fake-bucket-url',
        fields: {
            key: 'fake-key',
            bucket: 'fake-bucket'
        }
    };
    beforeEach(() => {
        process.env.CASE_DDB_TABLE_NAME = 'testTable';
        process.env.UPLOAD_DOCS_BUCKET_NAME = 'testBucket';
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.S3_UPLOAD_PREFIX = 'initial';
        process.env.WORKFLOW_CONFIG_NAME = 'fakeWorkflowName';
        process.env.WORKFLOW_CONFIG_TABLE_NAME = 'fakeWorkflowConfigTableName';

        AWSMock.mock('S3', 'createPresignedPost', async (s3Params) => {
            expect(s3Params.Bucket).toEqual('testBucket');
            expect(s3Params.Fields.key).toBeDefined();
            expect(s3Params.Fields['x-amz-meta-userId']).toEqual('fake-user-id');
            expect(s3Params.Fields['x-amz-meta-fileExtension']).toEqual('application/pdf');
            expect(s3Params.Fields['tagging']).toEqual(
                '<Tagging><TagSet><Tag><Key>userId</Key><Value>fake-user-id</Value></Tag></TagSet></Tagging>'
            );
            return postPolicyResponse;
        });
    });

    it('should put an entry into the database', async () => {
        const params = {
            userId: 'fake-user-id',
            caseId: 'user-id:fake-case-id',
            fileName: 'fake-file-name',
            fileExtension: '.pdf',
            documentType: 'fake-doc-type',
            filekey: 'fake-file-key'
        };

        const presignedPost = await (await DocUploader.generatePresignedS3PostUrl(params)).promise();
        expect(presignedPost).toEqual(postPolicyResponse);
    });

    it('should create the correct contentType field given a fileExtension', async () => {
        AWSMock.remock('S3', 'createPresignedPost', async (s3Params) => {
            return s3Params.Fields['x-amz-meta-fileExtension'];
        });

        const params = {
            userId: 'fake-user-id',
            caseId: 'user-id:fake-case-id',
            fileName: 'fake-file-name',
            documentType: 'fake-doc-type',
            filekey: 'fake-file-key'
        };

        const pdfExtParams = { ...params, fileExtension: '.pdf' };
        const pdfPostRequstValue = await (await DocUploader.generatePresignedS3PostUrl(pdfExtParams)).promise();
        expect(pdfPostRequstValue).toEqual('application/pdf');

        try {
            const unsupportedExtParams = { ...params, fileExtension: '.unsupported' };
            await (await DocUploader.generatePresignedS3PostUrl(unsupportedExtParams)).promise();
        } catch (error) {
            expect(error.message).toBeDefined();
        }
    });

    it('should throw custom error if s3 API call errors out', async () => {
        AWSMock.remock('S3', 'createPresignedPost', async (s3Params) => {
            throw new Error('fake error');
        });
        const params = {
            userId: 'fake-user-id',
            caseId: 'user-id:fake-case-id',
            fileName: 'fake-file-name',
            fileExtension: '.pdf',
            documentType: 'fake-doc-type',
            filekey: 'fake-file-key'
        };

        try {
            await (await DocUploader.generatePresignedS3PostUrl(params)).promise();
        } catch (error) {
            expect(error.message).toEqual('fake error');
        }
    });

    afterEach(() => {
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.UPLOAD_DOCS_BUCKET_NAME;
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.S3_UPLOAD_PREFIX;
        delete process.env.WORKFLOW_CONFIG_NAME;
        delete process.env.WORKFLOW_CONFIG_TABLE_NAME;

        AWSMock.restore('DynamoDB');
        AWSMock.restore('S3');
    });
});

describe('When creating a record and creating a upload file post request', () => {
    beforeEach(() => {
        process.env.CASE_DDB_TABLE_NAME = 'testTable';
        process.env.UPLOAD_DOCS_BUCKET_NAME = 'testBucket';
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.S3_UPLOAD_PREFIX = 'initial';
        process.env.WORKFLOW_CONFIG_NAME = 'fakeWorkflowName';
        process.env.WORKFLOW_CONFIG_TABLE_NAME = 'fakeWorkflowConfigTableName';

        AWSMock.mock('S3', 'createPresignedPost', async (s3Params) => {
            return 'success';
        });

        AWSMock.mock('DynamoDB', 'putItem', async (ddbParams) => {
            return 'success';
        });

        AWSMock.mock('DynamoDB', 'getItem', (params, callback) => {
            if (params.TableName == process.env.WORKFLOW_CONFIG_TABLE_NAME) {
                callback(null, dynamoDBConfigResponse);
            }
        });

        jest.spyOn(SharedLib, 'getCase').mockImplementation(async (params) => {
            return {
                Count: 3,
                Items: [
                    {
                        DOCUMENT_ID: {
                            S: '0000'
                        }
                    },
                    {
                        UPLOADED_FILE_NAME: {
                            S: 'testFile'
                        },
                        DOCUMENT_TYPE: {
                            S: 'bankAccount'
                        },
                        DOCUMENT_ID: {
                            S: 'fake-id'
                        }
                    },
                    {
                        UPLOADED_FILE_NAME: {
                            S: 'testFile'
                        },
                        DOCUMENT_TYPE: {
                            S: 'passport'
                        },
                        DOCUMENT_ID: {
                            S: 'fake-id'
                        }
                    }
                ]
            };
        });
    });

    it('should successfully complete request', async () => {
        const params = {
            caseId: 'user-id:fake-case-id',
            fileName: 'fake-file-name',
            fileExtension: '.pdf',
            documentType: 'paystub'
        };

        const presignedPost = await (await DocUploader.createUploadPostRequest(params)).promise();
        expect(presignedPost).toEqual('success');
    });

    it('should throw an error', async () => {
        const params = {
            caseId: 'user-id:fake-case-id',
            fileName: 'fake-file-name'
        };

        try {
            await DocUploader.createUploadPostRequest(params);
        } catch (error) {
            expect(error.message).toBeDefined();
        }
    });

    afterEach(() => {
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.UPLOAD_DOCS_BUCKET_NAME;
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.S3_UPLOAD_PREFIX;
        delete process.env.WORKFLOW_CONFIG_NAME;
        delete process.env.WORKFLOW_CONFIG_TABLE_NAME;

        AWSMock.restore('DynamoDB');
        AWSMock.restore('S3');
        jest.restoreAllMocks();
    });
});

describe('if document upload limit is exhausted', () => {
    beforeAll(() => {
        process.env.CASE_DDB_TABLE_NAME = 'testTable';
        process.env.UPLOAD_DOCS_BUCKET_NAME = 'testBucket';
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.S3_UPLOAD_PREFIX = 'initial';
        process.env.WORKFLOW_CONFIG_NAME = 'fakeWorkflowName';
        process.env.WORKFLOW_CONFIG_TABLE_NAME = 'fakeWorkflowConfigTableName';

        AWSMock.mock('S3', 'createPresignedPost', async (s3Params) => {
            return 'success';
        });

        AWSMock.mock('DynamoDB', 'putItem', async (ddbParams) => {
            return 'success';
        });

        AWSMock.mock('DynamoDB', 'getItem', (params, callback) => {
            if (params.TableName == process.env.WORKFLOW_CONFIG_TABLE_NAME) {
                callback(null, {
                    Key: {
                        WorkflowConfigName: {
                            S: this.workflowConfigName
                        }
                    },
                    Item: {
                        Name: {
                            S: 'default'
                        },
                        WorkflowSequence: {
                            L: [
                                { S: SharedLib.WorkflowStageNames.TEXTRACT },
                                { S: SharedLib.WorkflowStageNames.PII },
                                { S: SharedLib.WorkflowStageNames.ENTITY },
                                { S: SharedLib.WorkflowStageNames.REDACTION }
                            ]
                        },
                        MinRequiredDocuments: {
                            L: [
                                {
                                    M: {
                                        DocumentType: {
                                            S: 'Passport'
                                        },
                                        FileTypes: {
                                            L: [{ S: '.pdf' }, { S: '.png' }, { S: '.jpeg' }, { S: '.jpg' }]
                                        },
                                        MaxSize: {
                                            S: '5'
                                        },
                                        WorkflowsToProcess: {
                                            L: [
                                                { S: SharedLib.WorkflowStageNames.TEXTRACT },
                                                { S: SharedLib.WorkflowStageNames.REDACTION }
                                            ]
                                        },
                                        NumDocuments: { S: '1' }
                                    }
                                }
                            ]
                        }
                    },
                    ConsumedCapacity: {
                        TableName: process.env.WORKFLOW_CONFIG_TABLE_NAME
                    }
                });
            }
        });

        jest.spyOn(SharedLib, 'getCase').mockImplementation(async (params) => {
            return {
                Key: {
                    CASE_ID: {
                        S: 'fake-case-id'
                    }
                },
                Count: 2,
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
                            S: 'bankAccount'
                        }
                    }
                ]
            };
        });
    });

    afterAll(() => {
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.UPLOAD_DOCS_BUCKET_NAME;
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.S3_UPLOAD_PREFIX;
        delete process.env.WORKFLOW_CONFIG_NAME;
        delete process.env.WORKFLOW_CONFIG_TABLE_NAME;

        AWSMock.restore('DynamoDB');
        AWSMock.restore('S3');
        jest.restoreAllMocks();
    });

    it('should return false', async () => {
        const params = {
            caseId: 'user-id:fake-case-id',
            fileName: 'fake-file-name',
            fileExtension: '.pdf',
            documentType: 'fake-doc-type'
        };

        const response = await DocUploader.checkIfDocumentsCanBeUploadedForCase(params);
        expect(response).toBeFalsy();
    });

    it('should throw an exception when calling createUploadPostRequest', async () => {
        const params = {
            caseId: 'user-id:fake-case-id',
            fileName: 'fake-file-name',
            fileExtension: '.pdf',
            documentType: 'fake-doc-type'
        };
        try {
            await DocUploader.createDocumentId(params);
        } catch (error) {
            expect(error.message).toBeEqual('No more documents can be uploaded');
        }
    });
});
