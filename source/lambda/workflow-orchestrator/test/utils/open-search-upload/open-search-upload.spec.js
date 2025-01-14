// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const SharedLib = require('common-node-lib');
const { AossProxy } = require('common-node-lib');
const { OpenSearchUpload } = require('../../../utils/open-search-upload/open-search-upload');
const { openSearchPayload, textractDetectTextInference} = require('../../event-test-data');

describe('OpenSearch Serverless upload business logic test', () => {
    const requestAccountId = '1234567890';

    beforeAll(() => {
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.S3_INFERENCE_BUCKET_NAME = 'fakeBucket';
        process.env.AWS_REGION = 'us-west-2';
        process.env.OS_COLLECTION_ENDPOINT = 'https://foobar.us-east-1.aoss.amazonaws.com';
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('OpenSearch Serverless upload constructor: input parameters are not legal', () => {
        // A full deep copy without modifying openSearchPayload that is shared across tests
        const payload = JSON.parse(JSON.stringify(openSearchPayload));
        payload.case.documentList = [];

        expect(() =>
            new OpenSearchUpload(payload, requestAccountId)
        ).toThrow('No documents found for the case: some-user:some-case-id');
    });

    it('OpenSearch Serverless upload constructor: workflow parameters are not legal', () => {
        // A full deep copy without modifying openSearchPayload that is shared across tests
        const payload = JSON.parse(JSON.stringify(openSearchPayload));

        payload.case.workflows = [];
        expect(() =>
            new OpenSearchUpload(payload, requestAccountId)
        ).toThrow('Workflow is not configured, aborting OpenSearch upload.');
    });

    it('OpenSearch Serverless upload constructor: workflow did not run textract', () => {
        // A full deep copy without modifying openSearchPayload that is shared across tests
        const payload = JSON.parse(JSON.stringify(openSearchPayload));

        payload.case.workflows = [
            'entity-standard'
        ];
        expect(() =>
            new OpenSearchUpload(payload, requestAccountId)
        ).toThrow('Workflow should at least runs Textract, aborting OpenSearch upload.');
    });

    it('OpenSearch Serverless upload constructor: able to determine strategies', () => {
        // A full deep copy without modifying openSearchPayload that is shared across tests
        const payload = JSON.parse(JSON.stringify(openSearchPayload));
        const openSearchUpload = new OpenSearchUpload(payload, requestAccountId);
        const strategies = openSearchUpload.strategies;

        expect(strategies.size).toBe(1);
    });

    it('OpenSearch Serverless upload functionality: able to upload to open search', async () => {
        // A full deep copy without modifying openSearchPayload that is shared across tests
        const payload = JSON.parse(JSON.stringify(openSearchPayload));
        const prototype = AossProxy.prototype;

        const getTextractMock = jest.spyOn(SharedLib, 'getInferenceFromS3').mockImplementation(async (params) => {
            return textractDetectTextInference;
        });

        const createIndexSpy = jest.spyOn(prototype, 'createIndex').mockImplementation(async (params) => {
            return {};
        });

        const writeDocumentsSpy = jest.spyOn(prototype, 'writeDocuments').mockImplementation(async (params) => {
            return {};
        });


        const openSearchUpload = new OpenSearchUpload(payload, requestAccountId);
        openSearchUpload.openSearchProxy = prototype;
        await openSearchUpload.run();

        expect(getTextractMock).toHaveBeenCalledTimes(1);
        expect(createIndexSpy).toHaveBeenCalledTimes(1);
        expect(writeDocumentsSpy).toHaveBeenCalledTimes(1);
    });
});
