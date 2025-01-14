// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const SharedLib = require('common-node-lib');
const { openSearchPayload, medicalComprehendInference, expectedFormattedMedicalComprehendInference } = require('../../../event-test-data');
const { MedicalEntityStrategy } = require('../../../../utils/open-search-upload/strategies/medical-entity-strategy');

describe('Medical entity strategy test', () => {
    const requestAccountId = '1234567890';
    const userId = 'some-user';
    const caseId = 'some-case';
    const documents = JSON.parse(JSON.stringify(openSearchPayload.case.documentList));

    beforeAll(() => {
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.S3_INFERENCE_BUCKET_NAME = 'fakeBucket';
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('Medical entity strategy constructor: able to construct', () => {
        const medicalEntityStrategy = new MedicalEntityStrategy(requestAccountId, userId, caseId, documents);

        expect(medicalEntityStrategy).toBeDefined();
    });

    it('Medical entity strategy constructor: able to prepare documents', async () => {
        const medicalEntityStrategy = new MedicalEntityStrategy(requestAccountId, userId, caseId, documents);

        const getTextractMock = jest.spyOn(SharedLib, 'getInferenceFromS3').mockImplementation(async (params) => {
            return medicalComprehendInference;
        });

        await medicalEntityStrategy.prepareDocuments();

        expect(getTextractMock).toHaveBeenCalledTimes(1);
        expect(medicalEntityStrategy.inferences.size).toBe(1);
        expect(medicalEntityStrategy.inferences.get('some-doc-id')).toStrictEqual(expectedFormattedMedicalComprehendInference);
    });
});
