// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { constructAmplifyConfig, getRuntimeConfig } from '../index';
import { API_NAME } from '../utils/constants';

const unmockedFetch = global.fetch;

jest.mock('../App', () => require('./mocks/App').default);

describe('When Web UI is created', () => {
    const fakeApiEndpoint = 'fake.endpoint';
    const fakeAwsRegion = 'fake-us-east-1';
    const fakeUserPoolId = 'fake-us-east-1_fake';
    const fakeUserPoolClientId = 'fake_id';
    const fakeRunTimeConfig = {
        'ApiEndpoint': fakeApiEndpoint,
        'AwsRegion': fakeAwsRegion,
        'UserPoolId': fakeUserPoolId,
        'UserPoolClientId': fakeUserPoolClientId,
        'KendraStackDeployed': 'Yes',
        'OpenSearchStackDeployed': 'Yes',
        'RequiredDocs': [
            {
                'NumDocuments': '1',
                'DocumentType': 'generic',
                'FileTypes': ['.pdf', '.png', '.jpeg', '.jpg'],
                'WorkflowsToProcess': ['textract', 'entity-standard', 'entity-pii', 'entity-medical', 'redaction'],
                'MaxSize': '5',
                'RunTextractAnalyzeAction': true
            }
        ],
        'WorkflowConfigName': 'default'
    };

    beforeAll(async () => {
        global.fetch = () =>
            Promise.resolve({
                json: () => Promise.resolve(fakeRunTimeConfig)
            });
    });

    afterAll(() => {
        global.fetch = unmockedFetch;
    });

    it('should fetch runtimeConfig correctly', async () => {
        const response = await getRuntimeConfig();

        expect(response).toEqual(fakeRunTimeConfig);
    });

    it('should resolve runtime config funtion correctly', async () => {
        await getRuntimeConfig().then(function (json) {
            expect(json).toEqual(fakeRunTimeConfig);
        });
    });

    it('should generate the correct Amplify configuration parameter', () => {
        const mockResponse = {
            Auth: {
                region: fakeAwsRegion,
                userPoolId: fakeUserPoolId,
                userPoolWebClientId: fakeUserPoolClientId
            },
            Storage: {
                AWSS3: {
                    region: fakeAwsRegion
                }
            },
            API: {
                endpoints: [
                    {
                        name: API_NAME, // TODO verify this
                        endpoint: fakeApiEndpoint,
                        region: fakeAwsRegion
                    }
                ]
            }
        };
        const response = constructAmplifyConfig(fakeRunTimeConfig);
        expect(response).toEqual(mockResponse);
    });
});
