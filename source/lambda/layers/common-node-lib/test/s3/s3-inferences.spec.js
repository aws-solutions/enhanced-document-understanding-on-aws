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
const AWS = require('aws-sdk');
const AWSMock = require('aws-sdk-mock');
const s3Inference = require('../../s3/s3-inferences');
const {
    workflowOrchestratorCompleteStatusEvent,
    workflowOrchestratorS3UploadSuccessResponse,
    getInferenceFromS3TextractAnalyzeIdResponse
} = require('../event-test-data');

describe('S3 Inference Saver: When provided with correct inputs', () => {
    let consoleDebugSpy;
    let mockRequstAccountId = 'fake-account-id';

    beforeAll(() => {
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.S3_INFERENCE_BUCKET_NAME = 'fake-bucket';
        AWSMock.mock('S3', 'putObject', (params, callback) => {
            callback(null, {});
        });
        consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.clearAllMocks();
        process.env.S3_INFERENCE_BUCKET_NAME = 'fake-bucket';
    });

    it('should pass successfully, logging inference bucket', async () => {
        let result = await s3Inference.uploadCaseInferences(workflowOrchestratorCompleteStatusEvent.detail);
        expect(result).toEqual(workflowOrchestratorS3UploadSuccessResponse);
        expect(consoleDebugSpy).toHaveBeenCalledWith('S3_INFERENCE_BUCKET_NAME is: fake-bucket');
    });

    it('should pass successfully, not logging bucket since it is already set', async () => {
        let result = await s3Inference.uploadCaseInferences(workflowOrchestratorCompleteStatusEvent.detail);
        expect(result).toEqual(workflowOrchestratorS3UploadSuccessResponse);
        expect(consoleDebugSpy).not.toHaveBeenCalled();
    });

    it('should pass and only infer specified inferences when passing 1 inference to upload', async () => {
        let result = await s3Inference.uploadCaseInferences(workflowOrchestratorCompleteStatusEvent.detail, [
            'test-inference'
        ]);
        let expectedResult = workflowOrchestratorS3UploadSuccessResponse.slice(1);
        expect(result).toEqual(expectedResult);
    });

    it('should pass and only infer specified inferences when passing multiple inferences to upload', async () => {
        let result = await s3Inference.uploadCaseInferences(workflowOrchestratorCompleteStatusEvent.detail, [
            'test-inference',
            'fake-inference-type'
        ]);
        let expectedResult = workflowOrchestratorS3UploadSuccessResponse.slice(1);
        expect(result).toEqual(expectedResult);
    });

    it('should pass and only infer specified inferences when passing all inferences to upload', async () => {
        let result = await s3Inference.uploadCaseInferences(workflowOrchestratorCompleteStatusEvent.detail, [
            'test-inference',
            'textract-detectText'
        ]);
        let expectedResult = workflowOrchestratorS3UploadSuccessResponse;
        expect(result).toEqual(expectedResult);
    });

    it('should pass and do nothing when no suitable inferences are specified', async () => {
        let result = await s3Inference.uploadCaseInferences(workflowOrchestratorCompleteStatusEvent.detail, [
            'fake-inference-type'
        ]);
        expect(result).toEqual([]);
    });

    it('should pass successfully for some inferences in 1 document', async () => {
        let result = await s3Inference.uploadDocumentInferences(
            workflowOrchestratorCompleteStatusEvent.detail.case.documentList[0],
            mockRequstAccountId,
            ['test-inference']
        );
        expect(result).toEqual([workflowOrchestratorS3UploadSuccessResponse[1]]);
    });

    it('should pass successfully for all inferences in 1 document, logging inference bucket', async () => {
        jest.resetModules();
        AWSMock.mock('S3', 'putObject', (params, callback) => {
            callback(null, {});
        });
        const s3 = new AWS.S3();
        let s3Inference = require('../../s3/s3-inferences'); // re-importing will clear the module level S3_INFERENCE_BUCKET_NAME
        let result = await s3Inference.uploadDocumentInferences(
            workflowOrchestratorCompleteStatusEvent.detail.case.documentList[0],
            mockRequstAccountId,
            [],
            s3
        );
        expect(result).toEqual(workflowOrchestratorS3UploadSuccessResponse.slice(0, 2));
        expect(consoleDebugSpy).toHaveBeenCalledWith('S3_INFERENCE_BUCKET_NAME is: fake-bucket');
    });

    it('should pass successfully for all inferences in 1 document', async () => {
        let result = await s3Inference.uploadDocumentInferences(
            workflowOrchestratorCompleteStatusEvent.detail.case.documentList[0]
        );
        expect(result).toEqual(workflowOrchestratorS3UploadSuccessResponse.slice(0, 2));
    });

    it('should pass successfully for all inferences in 1 document with passed client', async () => {
        const s3 = new AWS.S3();
        let result = await s3Inference.uploadDocumentInferences(
            workflowOrchestratorCompleteStatusEvent.detail.case.documentList[0],
            mockRequstAccountId,
            ['test-inference'],
            s3
        );
        expect(result).toEqual([workflowOrchestratorS3UploadSuccessResponse[1]]);
    });

    it('should pass successfully for a single inference', async () => {
        let result = await s3Inference.uploadInference(
            'caseId1',
            'docId1',
            'textract-detectText',
            workflowOrchestratorCompleteStatusEvent.detail.case.documentList[0].inferences['textract-detectText']
        );
        expect(result).toEqual(workflowOrchestratorS3UploadSuccessResponse[0]);
    });

    it('should pass successfully for a single inference with passed client', async () => {
        const s3 = new AWS.S3();
        let result = await s3Inference.uploadInference(
            'caseId1',
            'docId1',
            'textract-detectText',
            workflowOrchestratorCompleteStatusEvent.detail.case.documentList[0].inferences['textract-detectText'],
            s3
        );
        expect(result).toEqual(workflowOrchestratorS3UploadSuccessResponse[0]);
    });

    it('should pass successfully for all inferences in 1 document, logging inference bucket', async () => {
        // resetting and re-importing the module will clear the module level S3_INFERENCE_BUCKET_NAME
        jest.resetModules();
        AWSMock.mock('S3', 'putObject', (params, callback) => {
            callback(null, {});
        });
        const s3 = new AWS.S3();
        let s3Inference = require('../../s3/s3-inferences');
        let result = await s3Inference.uploadInference(
            'caseId1',
            'docId1',
            'textract-detectText',
            workflowOrchestratorCompleteStatusEvent.detail.case.documentList[0].inferences['textract-detectText'],
            s3
        );
        expect(result).toEqual(workflowOrchestratorS3UploadSuccessResponse[0]);
        expect(consoleDebugSpy).toHaveBeenCalledWith('S3_INFERENCE_BUCKET_NAME is: fake-bucket');
    });

    it('should pass expected bucket owner when request account id is passed', async () => {
        jest.resetModules();
        AWSMock.mock('S3', 'putObject', async (params) => {
            expect(params).toBeDefined();
            expect(params.ExpectedBucketOwner).toEqual(mockRequstAccountId);
            return {};
        });
        const s3 = new AWS.S3();
        let s3Inference = require('../../s3/s3-inferences');
        let result = await s3Inference.uploadInference(
            'caseId1',
            'docId1',
            'textract-detectText',
            workflowOrchestratorCompleteStatusEvent.detail.case.documentList[0].inferences['textract-detectText'],
            s3,
            mockRequstAccountId
        );
        expect(result).toEqual(workflowOrchestratorS3UploadSuccessResponse[0]);
    });

    it('should log environment variables correctly', async () => {
        s3Inference.checkInferenceBucketS3EnvSetup();
        expect(consoleDebugSpy).toHaveBeenCalledWith('S3_INFERENCE_BUCKET_NAME is: fake-bucket');
    });

    afterAll(() => {
        AWSMock.restore('S3');
        consoleDebugSpy.mockRestore();
        delete process.env.S3_INFERENCE_BUCKET_NAME;
        delete process.env.AWS_SDK_USER_AGENT;
    });
});

describe('S3 Inference Saver: When provided with incorrect inputs', () => {
    let mockRequstAccountId = 'fake-account-id';

    beforeAll(() => {
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';

        AWSMock.mock('S3', 'putObject', (params, callback) => {
            callback(new Error('Fake error'), null);
        });
    });

    afterEach(() => {
        process.env.S3_INFERENCE_BUCKET_NAME = 'fake-bucket';
    });

    it('throws an error due to env variables not being set', async () => {
        expect(() => {
            s3Inference.checkInferenceBucketS3EnvSetup();
        }).toThrow('S3_INFERENCE_BUCKET_NAME Lambda Environment variable not set.');
    });

    it('should throw an error in S3 upload', async () => {
        await expect(s3Inference.uploadCaseInferences(workflowOrchestratorCompleteStatusEvent.detail)).rejects.toThrow(
            'Fake error'
        );
    });

    it('should throw an error in S3 upload for document', async () => {
        const s3 = new AWS.S3();
        await expect(
            s3Inference.uploadDocumentInferences(
                workflowOrchestratorCompleteStatusEvent.detail.case.documentList[0],
                mockRequstAccountId,
                [],
                s3
            )
        ).rejects.toThrow('Fake error');
    });

    it('should throw an error in S3 upload for single inference', async () => {
        const s3 = new AWS.S3();
        await expect(
            s3Inference.uploadInference(
                'caseId1',
                'docId1',
                'textract-detectText',
                workflowOrchestratorCompleteStatusEvent.detail.case.documentList[0].inferences['textract-detectText'],
                s3
            )
        ).rejects.toThrow('Fake error');
    });

    afterAll(() => {
        AWSMock.restore('S3');
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.WORKFLOW_S3_PREFIX;
        delete process.env.S3_INFERENCE_BUCKET_NAME;
    });
});

describe('S3 Inference Getter: When provided with correct inputs', () => {
    let consoleDebugSpy, s3;

    beforeAll(() => {
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.S3_INFERENCE_BUCKET_NAME = 'fake-bucket';

        // Setting up mocks
        AWSMock.mock('S3', 'getObject', async (params) => {
            expect(params.Bucket).toEqual('fake-bucket');
            expect(params.ExpectedBucketOwner).toEqual('fake-account-id');
            return { Body: JSON.stringify(getInferenceFromS3TextractAnalyzeIdResponse) };
        });
        s3 = new AWS.S3();
        consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.clearAllMocks();
        process.env.S3_INFERENCE_BUCKET_NAME = 'fake-bucket';
    });

    it('should pass successfully', async () => {
        let result = await s3Inference.getInferenceFromS3('caseId', 'docId', 'inferenceType', 'fake-account-id');
        expect(result).toEqual(getInferenceFromS3TextractAnalyzeIdResponse);
    });

    it('should pass successfully when passed client', async () => {
        let result = await s3Inference.getInferenceFromS3('caseId', 'docId', 'inferenceType', 'fake-account-id', s3);
        expect(result).toEqual(getInferenceFromS3TextractAnalyzeIdResponse);
    });

    it('should log environment variables correctly', async () => {
        s3Inference.checkInferenceBucketS3EnvSetup();
        expect(consoleDebugSpy).toHaveBeenCalledWith('S3_INFERENCE_BUCKET_NAME is: fake-bucket');
    });

    it('should pass successfully, logging inference bucket', async () => {
        // resetting and re-importing the module will clear the module level S3_INFERENCE_BUCKET_NAME
        jest.resetModules();
        AWSMock.mock('S3', 'getObject', { Body: JSON.stringify(getInferenceFromS3TextractAnalyzeIdResponse) });
        s3 = new AWS.S3();
        let s3Inference = require('../../s3/s3-inferences');
        let result = await s3Inference.getInferenceFromS3('caseId', 'docId', 'inferenceType', 'fake-account-id', s3);
        expect(result).toEqual(getInferenceFromS3TextractAnalyzeIdResponse);
        expect(consoleDebugSpy).toHaveBeenCalledWith('S3_INFERENCE_BUCKET_NAME is: fake-bucket');
    });

    afterAll(() => {
        AWSMock.restore('S3');
        consoleDebugSpy.mockRestore();
        delete process.env.S3_INFERENCE_BUCKET_NAME;
        delete process.env.AWS_SDK_USER_AGENT;
    });
});

describe('S3 Inference Getter: When provided with incorrect inputs', () => {
    beforeAll(() => {
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';

        AWSMock.mock('S3', 'getObject', (params, callback) => {
            callback(new Error('Fake error'), null);
        });
    });

    afterEach(() => {
        process.env.S3_INFERENCE_BUCKET_NAME = 'fake-bucket';
    });

    it('throws an errors due to env variables not being set', async () => {
        expect(() => {
            s3Inference.checkInferenceBucketS3EnvSetup();
        }).toThrow('S3_INFERENCE_BUCKET_NAME Lambda Environment variable not set.');
    });

    it('should throw an due to s3 error', async () => {
        await expect(
            s3Inference.getInferenceFromS3('caseId', 'docId', 'inferenceType', 'fake-account-id')
        ).rejects.toThrow('Error retrieving object: caseId/docId/inferenceType.json. Error is: Fake error');
    });

    afterAll(() => {
        AWSMock.restore('S3');
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.WORKFLOW_S3_PREFIX;
        delete process.env.S3_INFERENCE_BUCKET_NAME;
    });
});
