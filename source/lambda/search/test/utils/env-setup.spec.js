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

const envSetupChecker = require('../../utils/env-setup');

describe('Check Kendra index id env variable setup', () => {
    beforeAll(() => {
        process.env.KENDRA_INDEX_ID = 'fake-kendra-index-id';
    });

    it('checkKendraIndexIdEnvSetup', () => {
        expect(envSetupChecker.checkKendraIndexIdEnvSetup()).toBe();
    });

    it('fails when env is not set correctly', () => {
        delete process.env.KENDRA_INDEX_ID;
        expect(() => {
            envSetupChecker.checkKendraIndexIdEnvSetup();
        }).toThrow();
    });

    afterAll(() => {
        delete process.env.KENDRA_INDEX_ID;
    });
});

describe('Check open search env variable setup', () => {
    beforeEach(() => {
        process.env.AWS_REGION = 'us-west-2';
        process.env.OS_COLLECTION_ENDPOINT = 'https://foobar.us-east-1.aoss.amazonaws.com';
    });

    it('checkOpenSearchEnvSetup', () => {
        expect(envSetupChecker.checkOpenSearchEnvSetup()).toBe();
    });

    it('fails when aws region env is not set correctly', () => {
        delete process.env.AWS_REGION;
        expect(() => {
            envSetupChecker.checkOpenSearchEnvSetup();
        }).toThrow();
    });

    it('fails when collection endpoint env is not set correctly', () => {
        delete process.env.OS_COLLECTION_ENDPOINT;
        expect(() => {
            envSetupChecker.checkOpenSearchEnvSetup();
        }).toThrow();
    });

    afterAll(() => {
        delete process.env.AWS_REGION;
        delete process.env.OS_COLLECTION_ENDPOINT;
    });
});

describe('Checks all environments', () => {
    beforeEach(() => {
        process.env.KENDRA_INDEX_ID = 'fake-kendra-index-id';
        process.env.AWS_REGION = 'us-west-2';
        process.env.OS_COLLECTION_ENDPOINT = 'https://foobar.us-east-1.aoss.amazonaws.com';
    });

    it('succeeds when env is set correctly', () => {
        expect(envSetupChecker.checkAllEnvSetup()).toBe();
    });

    afterAll(() => {
        delete process.env.KENDRA_INDEX_ID;
        delete process.env.AWS_REGION;
        delete process.env.OS_COLLECTION_ENDPOINT;
    });
});
