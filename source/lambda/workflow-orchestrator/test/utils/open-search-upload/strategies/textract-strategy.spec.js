// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const SharedLib = require('common-node-lib');
const { TextractStrategy } = require('../../../../utils/open-search-upload/strategies/textract-strategy');
const { openSearchPayload, textractDetectTextInference, expectedFormattedTextractInference } = require('../../../event-test-data');

describe('Textract strategy test', () => {
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

    it('Textract strategy constructor: able to construct', () => {
        const textractStrategy = new TextractStrategy(requestAccountId, userId, caseId, documents);

        expect(textractStrategy).toBeDefined();
    });

    it('Textract strategy constructor: able to prepare documents', async () => {
        const textractStrategy = new TextractStrategy(requestAccountId, userId, caseId, documents);

        const getTextractMock = jest.spyOn(SharedLib, 'getInferenceFromS3').mockImplementation(async (params) => {
            return textractDetectTextInference;
        });

        await textractStrategy.prepareDocuments();

        expect(getTextractMock).toHaveBeenCalledTimes(1);
        expect(textractStrategy.inferences.size).toBe(1);
        expect(textractStrategy.inferences.get('some-doc-id')).toBe(expectedFormattedTextractInference);
    });
});
