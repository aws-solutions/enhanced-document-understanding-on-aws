// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
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
        process.env.DDB_GSI_USER_ID = 'fake-user-index';
        process.env.DDB_GSI_USER_DOC_ID = 'fake-user-doc-index';
    });

    it('succeeds when env is set correctly', () => {
        expect(envSetupChecker.checkDdbGsiNameEnvSetup()).toBe();
    });

    it('fails when user index is not set correctly', () => {
        delete process.env.DDB_GSI_USER_ID;
        expect(() => {
            envSetupChecker.checkDdbGsiNameEnvSetup();
        }).toThrow();
    });

    it('fails when user index is not set correctly', () => {
        delete process.env.DDB_GSI_USER_DOC_ID;
        expect(() => {
            envSetupChecker.checkDdbGsiNameEnvSetup();
        }).toThrow();
    });

    afterAll(() => {
        delete process.env.DDB_GSI_USER_ID;
        delete process.env.DDB_GSI_USER_DOC_ID;
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
        process.env.DDB_GSI_USER_ID = 'fake-user-index';
        process.env.DDB_GSI_USER_DOC_ID = 'fake-user-doc-index';
    });

    it('succeeds when env is set correctly', () => {
        expect(envSetupChecker.checkAllEnvSetup()).toBe();
    });

    afterAll(() => {
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.DDB_GSI_USER_ID;
        delete process.env.DDB_GSI_USER_DOC_ID;
    });
});
