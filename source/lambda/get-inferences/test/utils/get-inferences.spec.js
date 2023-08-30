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

const InferenceGetter = require('../../utils/get-inferences');
const SharedLib = require('common-node-lib');

describe('Check DynamoDB table name environment', () => {
    beforeEach(() => {
        process.env.CASE_DDB_TABLE_NAME = 'fake_table';
    });

    it('succeeds when env is set correctly', () => {
        expect(InferenceGetter.checkDdbEnvSetup()).toBe();
    });

    it('fails when env is not set correctly', () => {
        delete process.env.CASE_DDB_TABLE_NAME;
        expect(() => {
            InferenceGetter.checkDdbEnvSetup();
        }).toThrow();
    });

    afterAll(() => {
        delete process.env.CASE_DDB_TABLE_NAME;
    });
});

describe('Check s3 bucket name environment', () => {
    beforeEach(() => {
        process.env.S3_INFERENCE_BUCKET_NAME = 'bucket_name';
    });

    it('succeeds when env is set correctly', () => {
        expect(InferenceGetter.checkS3InferenceBucketEnvSetup()).toBe();
    });

    it('fails when env is not set correctly', () => {
        delete process.env.S3_INFERENCE_BUCKET_NAME;
        expect(() => {
            InferenceGetter.checkS3InferenceBucketEnvSetup();
        }).toThrow();
    });

    afterAll(() => {
        delete process.env.S3_INFERENCE_BUCKET_NAME;
    });
});

describe('Checks all environments', () => {
    beforeEach(() => {
        process.env.CASE_DDB_TABLE_NAME = 'fake_table';
        process.env.S3_INFERENCE_BUCKET_NAME = 'bucket_name';
    });

    it('succeeds when env is set correctly', () => {
        expect(InferenceGetter.checkAllEnvSetup()).toBe();
    });

    afterAll(() => {
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.S3_INFERENCE_BUCKET_NAME;
    });
});

describe('listInferences gets a list of inference prefixes', () => {
    beforeEach(() => {
        process.env.CASE_DDB_TABLE_NAME = 'fake_table';
        process.env.S3_INFERENCE_BUCKET_NAME = 'bucket_name';
    });

    it('returns the inference names as expected', async () => {
        jest.spyOn(SharedLib, 'getInferencePrefixes').mockImplementation((caseId, documentId) => {
            return { 'fake-inference1': 'data1', 'fake-inference2': 'data2' };
        });
        let result = await InferenceGetter.listInferences('caseId', 'documentId');
        expect(result).toEqual(['fake-inference1', 'fake-inference2']);
    });

    it('throws when we get an underlying failure', async () => {
        jest.spyOn(SharedLib, 'getInferencePrefixes').mockImplementation((caseId, documentId) => {
            throw new Error('fake error');
        });
        await expect(InferenceGetter.listInferences('caseId', 'documentId')).rejects.toThrow('fake error');
    });

    afterAll(() => {
        jest.restoreAllMocks();
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.S3_INFERENCE_BUCKET_NAME;
    });
});

describe('getInference gets specific inference as an object', () => {
    beforeEach(() => {
        process.env.CASE_DDB_TABLE_NAME = 'fake_table';
        process.env.S3_INFERENCE_BUCKET_NAME = 'bucket_name';
    });

    it('returns the inference as expected', async () => {
        let fakeInference = { 'test': { 'test2': 1, 'test3': 2 } };
        jest.spyOn(SharedLib, 'getInferenceFromS3').mockImplementation((caseId, documentId, inferenceType) => {
            return fakeInference;
        });
        let result = await InferenceGetter.getInference('caseId', 'documentId', 'inferenceType');
        expect(result).toEqual(fakeInference);
    });

    it('throws when we get an underlying failure', async () => {
        jest.spyOn(SharedLib, 'getInferenceFromS3').mockImplementation((caseId, documentId) => {
            throw new Error('fake error');
        });
        await expect(InferenceGetter.getInference('caseId', 'documentId', 'inferenceType')).rejects.toThrow(
            'fake error'
        );
    });

    afterAll(() => {
        jest.restoreAllMocks();
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.S3_INFERENCE_BUCKET_NAME;
    });
});
