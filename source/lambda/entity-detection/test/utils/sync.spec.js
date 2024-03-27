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

const AWSMock = require('aws-sdk-mock');
const {
    textractDetectTextInference,
    expectedSyncComprehendResponse,
    expectedStandardEntityS3Upload,
    expectedPiiEntityS3Upload,
    expectedMedicalEntityS3Upload,
    expectedSyncComprehendMedicalResponse,
    expectedSyncComprehendPiiResponse,
    expectedStandardResponse,
    expectedMedicalResponse,
    expectedPiiResponse
} = require('../event-test-data');

const syncUtils = require('../../utils/sync');
const utils = require('../../utils/generic');
const SharedLib = require('common-node-lib');
const { EntityDetector } = require('../../utils/entity/entity-detector');

describe('runSyncEntityDetection (Comprehend): When provided with correct inputs', () => {
    let getComprehendResult, s3InferenceDownloadSpy, s3InferenceUploadSpy, ddbInferenceSpy, updateEntityLocations;
    const mockRequestAccountId = 'fake-account-id';

    beforeEach(() => {
        jest.resetModules();
        process.env.AWS_REGION = 'fakeRegion';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.ENTITY_DETECTION_LANGUAGE = 'es';
        process.env.S3_INFERENCE_BUCKET_NAME = 'fakeBucket';
        process.env.CASE_DDB_TABLE_NAME = 'fakeTable';
        process.env.CUSTOM_COMPREHEND_ARN = 'custom-arn';

        syncUtils.checkComprehendSyncEnvSetup();

        // parsing the stringified test input as values are injected during tests, and reloading for each test

        s3InferenceDownloadSpy = jest.spyOn(SharedLib, 'getInferenceFromS3').mockImplementation(async (params) => {
            return textractDetectTextInference;
        });

        s3InferenceUploadSpy = jest
            .spyOn(SharedLib, 'uploadDocumentInferences')
            .mockImplementation(async (input, requestAccountId, inferencesToUpload) => {
                let results = [];
                inferencesToUpload.forEach((inference) => {
                    results.push({
                        caseId: input.document.caseId,
                        documentId: input.document.id,
                        inferenceType: inference,
                        s3Key: `${inference}-s3-key`
                    });
                });
                return results;
            });

        ddbInferenceSpy = jest.spyOn(SharedLib, 'updateInferences').mockImplementation(async (params) => {
            return 'fake ddb response1';
        });
    });

    it('should return expected output for standard entity detection', async () => {
        const { sqsMessage } = require('../event-test-data');

        getComprehendResult = jest.spyOn(EntityDetector.prototype, 'getComprehendResult');
        getComprehendResult.mockImplementation(async (...params) => {
            return expectedSyncComprehendResponse;
        });
        updateEntityLocations = jest.spyOn(EntityDetector.prototype, 'addEntityLocations');

        const actualResponse = await syncUtils.runSyncEntityDetection(
            'fake-token',
            sqsMessage.Records[0],
            mockRequestAccountId
        );

        expect(actualResponse).toEqual(expectedStandardResponse);

        expect(getComprehendResult).toHaveBeenCalledWith({
            endpointArn: 'custom-arn',
            languageCode: 'es',
            pageText: 'This is a 2023 test about John Doe, New York. john doe. it is it is repeating.',
            taskToken: 'fake-token'
        });

        // for 2 pages in fake textract response
        expect(getComprehendResult).toHaveBeenCalledTimes(2);
        expect(updateEntityLocations).toHaveBeenCalledTimes(2);

        // checking that the correct data gets passed to the upload functions
        expect(s3InferenceUploadSpy).toHaveBeenCalledWith(expectedStandardEntityS3Upload, mockRequestAccountId, [
            utils.jobTypes.STANDARD,
            `${utils.jobTypes.STANDARD}-${utils.INFERENCE_NAME_LOCATION_SUFFIX}`
        ]);
        const expectedS3Response = [
            {
                'caseId': sqsMessage.Records[0].body.input.document.caseId,
                'documentId': sqsMessage.Records[0].body.input.document.id,
                'inferenceType': SharedLib.InferenceTypes.ENTITY,
                's3Key': `${SharedLib.InferenceTypes.ENTITY}-s3-key`
            },
            {
                'caseId': sqsMessage.Records[0].body.input.document.caseId,
                'documentId': sqsMessage.Records[0].body.input.document.id,
                'inferenceType': `${SharedLib.InferenceTypes.ENTITY}-${utils.INFERENCE_NAME_LOCATION_SUFFIX}`,
                's3Key': `${SharedLib.InferenceTypes.ENTITY}-${utils.INFERENCE_NAME_LOCATION_SUFFIX}-s3-key`
            }
        ];
        expect(ddbInferenceSpy).toHaveBeenCalledWith(expectedS3Response);
    });

    it('should return expected output for pii entity detection', async () => {
        const { sqsMessage } = require('../event-test-data');

        getComprehendResult = jest.spyOn(EntityDetector.prototype, 'getComprehendResult');
        updateEntityLocations = jest.spyOn(EntityDetector.prototype, 'addEntityLocations');
        getComprehendResult.mockImplementation(async (...params) => {
            return expectedSyncComprehendPiiResponse;
        });

        sqsMessage.Records[0].body.input.stage = utils.jobTypes.PII;
        const actualResponse = await syncUtils.runSyncEntityDetection(
            'fake-token',
            sqsMessage.Records[0],
            mockRequestAccountId
        );
        expect(actualResponse).toEqual(expectedPiiResponse);

        expect(getComprehendResult).toHaveBeenCalledWith({
            endpointArn: 'custom-arn',
            languageCode: 'es',
            pageText: 'This is a 2023 test about John Doe, New York. john doe. it is it is repeating.',
            taskToken: 'fake-token'
        });
        // for 2 pages in fake textract response
        expect(getComprehendResult).toHaveBeenCalledTimes(2);
        expect(updateEntityLocations).toHaveBeenCalledTimes(2);

        // checking that the correct data gets passed to the upload functions
        expect(s3InferenceUploadSpy).toHaveBeenCalledWith(expectedPiiEntityS3Upload, mockRequestAccountId, [
            utils.jobTypes.PII,
            `${utils.jobTypes.PII}-${utils.INFERENCE_NAME_LOCATION_SUFFIX}`
        ]);
        const expectedS3Response = [
            {
                'caseId': sqsMessage.Records[0].body.input.document.caseId,
                'documentId': sqsMessage.Records[0].body.input.document.id,
                'inferenceType': SharedLib.InferenceTypes.PII,
                's3Key': `${SharedLib.InferenceTypes.PII}-s3-key`
            },
            {
                'caseId': sqsMessage.Records[0].body.input.document.caseId,
                'documentId': sqsMessage.Records[0].body.input.document.id,
                'inferenceType': `${SharedLib.InferenceTypes.PII}-${utils.INFERENCE_NAME_LOCATION_SUFFIX}`,
                's3Key': `${SharedLib.InferenceTypes.PII}-${utils.INFERENCE_NAME_LOCATION_SUFFIX}-s3-key`
            }
        ];

        expect(ddbInferenceSpy).toHaveBeenCalledWith(expectedS3Response);
    });

    it('should return expected output for medical entity detection', async () => {
        const { sqsMessage } = require('../event-test-data');

        getComprehendResult = jest.spyOn(EntityDetector.prototype, 'getComprehendResult');
        updateEntityLocations = jest.spyOn(EntityDetector.prototype, 'addEntityLocations');
        getComprehendResult.mockImplementation(async (...params) => {
            return expectedSyncComprehendMedicalResponse;
        });

        sqsMessage.Records[0].body.input.stage = utils.jobTypes.MEDICAL;
        const actualResponse = await syncUtils.runSyncEntityDetection(
            'fake-token',
            sqsMessage.Records[0],
            mockRequestAccountId
        );
        expect(actualResponse).toEqual(expectedMedicalResponse);

        // for 2 pages in fake textract response
        expect(getComprehendResult).toHaveBeenCalledTimes(2);
        expect(updateEntityLocations).toHaveBeenCalledTimes(2);

        // checking that the correct data gets passed to the upload functions
        expect(s3InferenceUploadSpy).toHaveBeenCalledWith(expectedMedicalEntityS3Upload, mockRequestAccountId, [
            utils.jobTypes.MEDICAL,
            `${utils.jobTypes.MEDICAL}-${utils.INFERENCE_NAME_LOCATION_SUFFIX}`
        ]);
        const expectedS3Response = [
            {
                'caseId': sqsMessage.Records[0].body.input.document.caseId,
                'documentId': sqsMessage.Records[0].body.input.document.id,
                'inferenceType': SharedLib.InferenceTypes.MEDICAL_ENTITY,
                's3Key': `${SharedLib.InferenceTypes.MEDICAL_ENTITY}-s3-key`
            },
            {
                'caseId': sqsMessage.Records[0].body.input.document.caseId,
                'documentId': sqsMessage.Records[0].body.input.document.id,
                'inferenceType': `${SharedLib.InferenceTypes.MEDICAL_ENTITY}-${utils.INFERENCE_NAME_LOCATION_SUFFIX}`,
                's3Key': `${SharedLib.InferenceTypes.MEDICAL_ENTITY}-${utils.INFERENCE_NAME_LOCATION_SUFFIX}-s3-key`
            }
        ];
        expect(ddbInferenceSpy).toHaveBeenCalledWith(expectedS3Response);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.ENTITY_DETECTION_LANGUAGE;
        delete process.env.S3_INFERENCE_BUCKET_NAME;
        delete process.env.CASE_DDB_TABLE_NAME;
        jest.restoreAllMocks();
        AWSMock.restore('Comprehend');
        AWSMock.restore('ComprehendMedical');
    });
});

describe('runSyncEntityDetection (Comprehend): When provided with incorrect inputs', () => {
    let s3InferenceDownloadSpy;
    beforeEach(() => {
        jest.resetModules();

        process.env.AWS_REGION = 'fakeRegion';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.ENTITY_DETECTION_LANGUAGE = 'es';
        process.env.S3_INFERENCE_BUCKET_NAME = 'fakeBucket';
        process.env.CASE_DDB_TABLE_NAME = 'fakeTable';
    });

    it('getInferenceFromS3 fails causing runSyncEntityDetection failure', async () => {
        const { sqsMessage } = require('../event-test-data');

        s3InferenceDownloadSpy = jest.spyOn(SharedLib, 'getInferenceFromS3').mockImplementation(async (params) => {
            throw new Error('fake error');
        });
        await expect(syncUtils.runSyncEntityDetection('fake-token', sqsMessage.Records[0])).rejects.toThrow(
            'fake error'
        );
    });

    it('getTextractDetectedText fails causing runSyncEntityDetection failure', async () => {
        const { sqsMessage } = require('../event-test-data');

        let badInput = sqsMessage.Records[0];
        delete badInput.body.input.inferences[SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT];
        await expect(syncUtils.runSyncEntityDetection('fake-token', badInput)).rejects.toThrow(
            `No inference called ${SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT} was found in the payload, and thus stage ${badInput.body.input.stage} can't be performed.`
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.ENTITY_DETECTION_LANGUAGE;
        delete process.env.S3_INFERENCE_BUCKET_NAME;
        delete process.env.CASE_DDB_TABLE_NAME;
        jest.restoreAllMocks();
    });
});

describe('Check Comprehend Sync Env Setup', () => {
    beforeEach(() => {
        jest.resetModules();
        process.env.ENTITY_DETECTION_LANGUAGE = 'es';
        process.env.CUSTOM_COMPREHEND_ARN = 'custom-arn';
    });

    it('providing no language picks default', async () => {
        delete process.env.ENTITY_DETECTION_LANGUAGE;
        syncUtils.checkComprehendSyncEnvSetup();
        expect(syncUtils.ENTITY_DETECTION_LANGUAGE).toEqual(utils.DEFAULT_LANGUAGE);
    });

    it('setting a language picks sets as expected', async () => {
        syncUtils.checkComprehendSyncEnvSetup();
        expect(syncUtils.ENTITY_DETECTION_LANGUAGE).toEqual('es');
    });

    it('providing custom Comprehend arn', async () => {
        syncUtils.checkComprehendSyncEnvSetup();
        expect(syncUtils.CUSTOM_COMPREHEND_ARN).toEqual('custom-arn');
    });
});
