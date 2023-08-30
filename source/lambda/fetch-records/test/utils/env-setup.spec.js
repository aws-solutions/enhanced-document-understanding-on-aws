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

describe('Check DynamoDB table name environment', () => {
    beforeEach(() => {
        process.env.CASE_DDB_TABLE_NAME = 'fake_table';
    });

    it('succeeds when env is set correctly', () => {
        expect(envSetupChecker.checkDdbEnvSetup()).toBe();
    });

    it('fails when env is not set correctly', () => {
        delete process.env.CASE_DDB_TABLE_NAME;
        expect(() => {
            envSetupChecker.checkDdbEnvSetup();
        }).toThrow();
    });

    afterAll(() => {
        delete process.env.CASE_DDB_TABLE_NAME;
    });
});

describe('Check DynamoDB GSI name environment', () => {
    beforeEach(() => {
        process.env.DDB_GSI_USER_ID = 'fake-gsi-index';
    });

    it('succeeds when env is set correctly', () => {
        expect(envSetupChecker.checkDdbGsiNameEnvSetup()).toBe();
    });

    it('fails when env is not set correctly', () => {
        delete process.env.DDB_GSI_USER_ID;
        expect(() => {
            envSetupChecker.checkDdbGsiNameEnvSetup();
        }).toThrow();
    });

    afterAll(() => {
        delete process.env.DDB_GSI_USER_ID;
    });
});

describe('Check Redacted doc s3 prefix name environment', () => {
    beforeEach(() => {
        process.env.S3_REDACTED_PREFIX = 'redacted-docs';
    });

    it('succeeds when env is set correctly', () => {
        expect(envSetupChecker.checkRedactionPrefixEnvSetup()).toBe();
    });

    it('fails when env is not set correctly', () => {
        delete process.env.S3_REDACTED_PREFIX;
        expect(() => {
            envSetupChecker.checkRedactionPrefixEnvSetup();
        }).toThrow();
    });

    afterAll(() => {
        delete process.env.S3_REDACTED_PREFIX;
    });
});

describe('Checks all environments', () => {
    beforeEach(() => {
        process.env.CASE_DDB_TABLE_NAME = 'fake_table';
        process.env.DDB_GSI_USER_ID = 'fake-gsi-index';
    });

    it('succeeds when env is set correctly', () => {
        expect(envSetupChecker.checkAllEnvSetup()).toBe();
    });

    afterAll(() => {
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.DDB_GSI_USER_ID;
    });
});
