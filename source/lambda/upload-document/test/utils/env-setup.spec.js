// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
'use strict';

const envSetupChecker = require('../../utils/env-setup');

describe('Check DynamoDB table name environment', () => {
    beforeEach(() => {
        process.env.CASE_DDB_TABLE_NAME = 'fake_table';
        process.env.WORKFLOW_CONFIG_TABLE_NAME = 'fake-workflow-config-table';
        process.env.DDB_GSI_USER_DOC_ID = 'user-doc-id-index';
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
        delete process.env.WORKFLOW_CONFIG_TABLE_NAME;
    });
});

describe('Check S3 prefix name table name environment', () => {
    beforeEach(() => {
        process.env.S3_UPLOAD_PREFIX = 'fake_prefix';
    });

    it('succeeds when env is set correctly', () => {
        expect(envSetupChecker.checkS3KeyPrefixEnvSetup()).toBe();
    });

    it('fails when env is not set correctly', () => {
        delete process.env.S3_UPLOAD_PREFIX;
        expect(() => {
            envSetupChecker.checkS3KeyPrefixEnvSetup();
        }).toThrow();
    });

    afterAll(() => {
        delete process.env.S3_UPLOAD_PREFIX;
    });
});

describe('Check S3 bucket name environment', () => {
    beforeEach(() => {
        process.env.UPLOAD_DOCS_BUCKET_NAME = 'fake_prefix';
    });

    it('succeeds when env is set correctly', () => {
        expect(envSetupChecker.checkS3EnvSetup()).toBe();
    });

    it('fails when env is not set correctly', () => {
        delete process.env.UPLOAD_DOCS_BUCKET_NAME;
        expect(() => {
            envSetupChecker.checkS3EnvSetup();
        }).toThrow();
    });

    afterAll(() => {
        delete process.env.UPLOAD_DOCS_BUCKET_NAME;
    });
});

describe('Checks all environments', () => {
    beforeEach(() => {
        process.env.S3_UPLOAD_PREFIX = 'initial';
        process.env.CASE_DDB_TABLE_NAME = 'fake_table';
        process.env.UPLOAD_DOCS_BUCKET_NAME = 'fake_prefix';
        process.env.WORKFLOW_CONFIG_TABLE_NAME = 'fake-workflow-config-table';
    });

    it('succeeds when env is set correctly', () => {
        expect(envSetupChecker.checkAllEnvSetup()).toBe();
    });

    afterAll(() => {
        delete process.env.S3_UPLOAD_PREFIX;
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.UPLOAD_DOCS_BUCKET_NAME;
        delete process.env.WORKFLOW_CONFIG_TABLE_NAME;
    });
});

describe('Check workflow config name environment', () => {
    beforeEach(() => {
        process.env.WORKFLOW_CONFIG_NAME = 'textract';
    });

    it('succeeds when env is set correctly', () => {
        expect(envSetupChecker.checkWorkflowConfigNameEnvSetup()).toBe();
    });

    it('set default value when env is not set', () => {
        delete process.env.WORKFLOW_CONFIG_NAME;
        envSetupChecker.checkWorkflowConfigNameEnvSetup();
        expect(process.env.WORKFLOW_CONFIG_NAME).toBe('default');
    });

    afterAll(() => {
        delete process.env.WORKFLOW_CONFIG_NAME;
    });
});
