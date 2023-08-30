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
const { uploadToKendraIndex, prepareDocuments, getUserIdFromEvent } = require('../../utils/kendra-upload');
const SharedLib = require('common-node-lib');
const {
    casePayload,
    expectedKendraIndexInput,
    expectedPrepareDocumentsInput,
    expectedPrepareDocumentsOutput,
    textractDetectTextInference
} = require('../event-test-data');

describe('Uploads documents to Kendra Index', () => {
    let getTextractMock;
    beforeEach(() => {
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.KENDRA_INDEX_ID = 'test-index-id';
        process.env.S3_INFERENCE_BUCKET_NAME = 'fakeBucket';
    });

    it('should upload documents to the Kendra index successfully', async () => {
        const indexId = 'test-index-id';
        const roleArn = 'arn:iam::123456789012:role/test-role';

        const batchPutDocumentMock = jest.fn().mockReturnValue({ FailedDocuments: [] });
        AWSMock.mock('Kendra', 'batchPutDocument', batchPutDocumentMock);
        jest.spyOn(AWS, 'S3').mockImplementation(() => {
            return {};
        });

        getTextractMock = jest.spyOn(SharedLib, 'getInferenceFromS3').mockImplementation(async (params) => {
            return textractDetectTextInference;
        });

        await uploadToKendraIndex(indexId, roleArn, casePayload);
        expect(batchPutDocumentMock).toHaveBeenCalledTimes(1);
        expect(getTextractMock).toHaveBeenCalledTimes(2);
        expect(batchPutDocumentMock.mock.calls[0][0]).toEqual(expectedKendraIndexInput());
    });

    it('should throw error when empty payload is passed', async () => {
        const indexId = 'test-index-id';
        const roleArn = 'arn:iam::123456789012:role/test-role';
        const payloadWithNoDocuments = { case: { id: 'mock-user-id:mock-case-id', documentList: [] } };

        await expect(uploadToKendraIndex(indexId, roleArn, payloadWithNoDocuments)).rejects.toThrow(
            `No documents found for the case: ${casePayload.case.id}`
        );
    });

    afterEach(() => {
        AWSMock.restore('Kendra');
        jest.restoreAllMocks();
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.KENDRA_INDEX_ID;
        delete process.env.S3_INFERENCE_BUCKET_NAME;
    });
});

describe('when preparing documents', () => {
    let getTextractMock;
    beforeEach(() => {
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.KENDRA_INDEX_ID = 'test-index-id';
        process.env.S3_INFERENCE_BUCKET_NAME = 'fakeBucket';
        getTextractMock = jest.spyOn(SharedLib, 'getInferenceFromS3').mockImplementation(async (params) => {
            return textractDetectTextInference;
        });
    });

    it('should prepare documents successfully', async () => {
        const mockedUserId = 'mock-user-id';
        const documents = await prepareDocuments(expectedPrepareDocumentsInput(), mockedUserId, "fake-account");

        expect(getTextractMock).toHaveBeenCalledTimes(11);
        expect(documents).toEqual(expectedPrepareDocumentsOutput());
        expect(documents.length).toEqual(2);
        expect(documents[0].length).toEqual(10);
        expect(documents[1].length).toEqual(1);
    });

    it('should add ACL to document prep output', async () => {
        const mockedUserId = 'mock-user-id';
        const documentBatches = await prepareDocuments(expectedPrepareDocumentsInput(), mockedUserId, "fake-account");

        expect(getTextractMock).toHaveBeenCalledTimes(11);
        documentBatches.forEach((batch) => {
            batch.forEach((document) => {
                expect(document['AccessControlList']).toEqual([
                    {
                        Access: 'ALLOW',
                        Name: 'mock-user-id',
                        Type: 'USER'
                    }
                ]);
            });
        });
    });

    it('should add Attributes to document prep output', async () => {
        const mockedUserId = 'mock-user-id';
        const documentBatches = await prepareDocuments(expectedPrepareDocumentsInput(), mockedUserId, "fake-account");

        documentBatches.forEach((batch) => {
            batch.forEach((document) => {
                expect(document['Attributes']).toEqual([
                    {
                        Key: `${SharedLib.WorkflowOrchestratorDefaults.KENDRA_ATTRIBUTES.CASE_ID}`,
                        Value: {
                            StringValue: 'mock-user-id:mock-case-id'
                        }
                    },
                    {
                        Key: `${SharedLib.WorkflowOrchestratorDefaults.KENDRA_ATTRIBUTES.DOC_ID}`,
                        Value: {
                            StringValue: expect.any(String)
                        }
                    },
                    {
                        Key: `${SharedLib.WorkflowOrchestratorDefaults.KENDRA_ATTRIBUTES.DOC_TYPE}`,
                        Value: {
                            StringValue: 'passport'
                        }
                    },
                    {
                        Key: `${SharedLib.WorkflowOrchestratorDefaults.KENDRA_ATTRIBUTES.FILE_NAME}`,
                        Value: {
                            StringValue: 'single-page-Insulin.pdf'
                        }
                    },
                    {
                        Key: `${SharedLib.WorkflowOrchestratorDefaults.KENDRA_ATTRIBUTES.FILE_TYPE}`,
                        Value: {
                            StringValue: '.pdf'
                        }
                    }
                ]);
            });
        });
    });

    // create a test for getUserIdFromEvent
    it('should get user id from event', () => {
        const event = {
            case: {
                id: 'mock-case-id:mock-case-id'
            }
        };
        const userId = getUserIdFromEvent(event);
        expect(userId).toEqual('mock-case-id');
    });

    afterEach(() => {
        jest.restoreAllMocks();
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.KENDRA_INDEX_ID;
        delete process.env.S3_INFERENCE_BUCKET_NAME;
    });
});
