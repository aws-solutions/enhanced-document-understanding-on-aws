// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { rest } from 'msw';

export const MOCK_CONFIG = {
    ApiEndpoint: 'https://jsonplaceholder.typicode.com/',
    AWS_REGION: 'us-east-1',
    USER_POOL_ID: 'test_user_pool_id',
    USER_POOL_CLIENT_ID: 'testClientId',
    DATA_BUCKET_NAME: 'test-bucket'
};

export const getSignedUrlResponse = {
    downloadUrl: `${MOCK_CONFIG.ApiEndpoint}fake-url`
};

const getDocumentResponse = {
    key: `${MOCK_CONFIG.ApiEndpoint}/fake-key`
};

const getCasesResponse = {
    Count: 4,
    ScannedCount: 4,
    Items: [
        {
            CASE_ID: { S: 'fake-case-id-1' },
            CASE_NAME: { S: 'fake-case-name-1' },
            DOCUMENT_ID: { S: '0000' },
            STATUS: { S: 'success' },
            USER_ID: { S: 'fake-user-id' },
            DOC_COUNT: { N: '1' },
            CREATION_TIMESTAMP: { 'S': '2000-01-01T00:00:00.000Z' }
        },
        {
            CASE_ID: { S: 'fake-case-id-2' },
            CASE_NAME: { S: 'fake-case-name-2' },
            DOCUMENT_ID: { S: '0000' },
            STATUS: { S: 'success' },
            USER_ID: { S: 'fake-user-id' },
            DOC_COUNT: { N: '0' },
            CREATION_TIMESTAMP: { 'S': '2000-01-01T00:00:00.000Z' }
        },
        {
            CASE_ID: { S: 'fake-case-id-3' },
            CASE_NAME: { S: 'fake-case-name-3' },
            DOCUMENT_ID: { S: '0000' },
            STATUS: { S: 'success' },
            USER_ID: { S: 'fake-user-id' },
            DOC_COUNT: { N: '0' },
            CREATION_TIMESTAMP: { 'S': '2000-01-01T00:00:00.000Z' }
        },
        {
            CASE_ID: { S: 'fake-case-id-4' },
            CASE_NAME: { S: 'fake-case-name-4' },
            DOCUMENT_ID: { S: '0000' },
            STATUS: { S: 'success' },
            USER_ID: { S: 'fake-user-id' },
            DOC_COUNT: { N: '0' },
            CREATION_TIMESTAMP: { 'S': '2000-01-01T00:00:00.000Z' }
        }
    ]
};

const getDocumentByCaseIdResponse = {
    Count: 1,
    ScannedCount: 1,
    Items: [
        {
            BUCKET_NAME: { S: 'fake-bucket-name-1' },
            CASE_ID: { S: 'fake-case-id-1' },
            CASE_NAME: { S: 'fake-case-name-1' },
            DOCUMENT_ID: { S: 'fake-doc-id1' },
            DOCUMENT_TYPE: { S: 'passport' },
            S3_KEY: {
                S: 'fake-s3-key.jpg'
            },
            UPLOADED_FILE_EXTENSION: { S: 'jpg' },
            UPLOADED_FILE_NAME: { S: 'fake-file-name' },
            USER_ID: { S: 'fake-user-id' },
            CREATION_TIMESTAMP: { 'S': '2000-01-01T00:00:00.000Z' }
        }
    ]
};

export const handlers = [
    rest.get('/runtimeConfig.json', (_, res, ctx) => {
        return res(ctx.status(200), ctx.text(JSON.stringify(MOCK_CONFIG)));
    }),
    rest.get(`${MOCK_CONFIG.ApiEndpoint}cases`, (req, res, ctx) => {
        let response: any = getCasesResponse;
        if (req.params) {
            response = {
                ...getCasesResponse,
                LastEvaluatedKey: true
            };
        }
        return res(ctx.status(200), ctx.text(JSON.stringify(response)));
    }),
    rest.get(`${MOCK_CONFIG.ApiEndpoint}case/:caseId`, (_, res, ctx) => {
        return res(ctx.status(200), ctx.text(JSON.stringify(getDocumentByCaseIdResponse)));
    }),
    rest.get(`${MOCK_CONFIG.ApiEndpoint}document/:caseId/:documentId`, (req, res, ctx) => {
        return res(ctx.status(200), ctx.text(JSON.stringify(getDocumentResponse)));
    }),
    rest.get(`${MOCK_CONFIG.ApiEndpoint}document/download`, (_, res, ctx) => {
        return res(ctx.status(200), ctx.text(JSON.stringify(getSignedUrlResponse)));
    }),
    rest.get(`${MOCK_CONFIG.ApiEndpoint}inferences/:caseId/:documentId`, (_, res, ctx) => {
        return res(ctx.status(200), ctx.text(JSON.stringify(['textract-detectText', 'entity-medical-locations'])));
    }),
    rest.get(`${MOCK_CONFIG.ApiEndpoint}inferences/:caseId/:documentId/:inferenceType`, (req, res, ctx) => {
        return res(ctx.status(200), ctx.text(JSON.stringify({})));
    }),
    rest.post(`${MOCK_CONFIG.ApiEndpoint}document`, (_, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.text(
                JSON.stringify({
                    fields: [
                        {
                            key: 'test-entry'
                        }
                    ],
                    url: 'signed-url'
                })
            )
        );
    }),
    rest.all('/signed-url', (req, res, ctx) => {
        return res(ctx.status(403));
    })
];
