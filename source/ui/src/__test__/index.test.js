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
        'UserPoolClientId': fakeUserPoolClientId
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
