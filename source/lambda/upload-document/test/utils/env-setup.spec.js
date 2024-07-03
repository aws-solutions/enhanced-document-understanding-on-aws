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
