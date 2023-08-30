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

describe('Check DynamoDB read environment', () => {
    beforeEach(() => {
        process.env.CASE_DDB_TABLE_NAME = 'fake_table';
        process.env.WORKFLOW_CONFIG_TABLE_NAME = 'fake-workflow-config-table';
    });

    it('succeeds when env is set correctly', () => {
        expect(envSetupChecker.checkDDBReadEnvSetup()).toBe();
    });

    it('fails when env is not set correctly', () => {
        delete process.env.CASE_DDB_TABLE_NAME;
        expect(() => {
            envSetupChecker.checkDDBReadEnvSetup();
        }).toThrow();
    });

    afterAll(() => {
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.WORKFLOW_CONFIG_TABLE_NAME;
    });
});

describe('Check S3 prefix environment', () => {
    beforeEach(() => {
        process.env.S3_UPLOAD_PREFIX = 'initial';
    });

    it('succeeds when env is set correctly', () => {
        expect(envSetupChecker.checkS3UploadPrefixEnvSetup()).toBe();
    });

    it('fails when env is not set correctly', () => {
        delete process.env.S3_UPLOAD_PREFIX;
        expect(() => {
            envSetupChecker.checkS3UploadPrefixEnvSetup();
        }).toThrow();
    });

    afterAll(() => {
        delete process.env.S3_UPLOAD_PREFIX;
    });
});

describe('Check event bus ARN environment', () => {
    beforeEach(() => {
        process.env.EVENT_BUS_ARN = 'fake-arn';
    });

    it('succeeds when env is set correctly', () => {
        expect(envSetupChecker.checkEventBusArnEnvSetup()).toBe();
    });

    it('fails when env is not set correctly', () => {
        delete process.env.EVENT_BUS_ARN;
        expect(() => {
            envSetupChecker.checkEventBusArnEnvSetup();
        }).toThrow();
    });

    afterAll(() => {
        delete process.env.EVENT_BUS_ARN;
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

describe('Check App namespace environment', () => {
    beforeEach(() => {
        process.env.APP_NAMESPACE = 'app.idp';
    });

    it('succeeds when env is set correctly', () => {
        expect(envSetupChecker.checkAppNamespaceEnvSetup()).toBe();
    });

    it('fails when env is not set correctly', () => {
        delete process.env.APP_NAMESPACE;
        expect(() => {
            envSetupChecker.checkAppNamespaceEnvSetup();
        }).toThrow();
    });

    afterAll(() => {
        delete process.env.APP_NAMESPACE;
    });
});

describe('Check Kendra role arn environment', () => {
    beforeEach(() => {
        process.env.KENDRA_ROLE_ARN = 'arn:iam::123:role/test-role';
    });

    it('succeeds when env is set correctly', () => {
        envSetupChecker.checkKendraRoleArnEnvSetup();
    });

    it('fails when env is not set correctly', () => {
        delete process.env.KENDRA_ROLE_ARN;
        expect(() => {
            envSetupChecker.checkKendraRoleArnEnvSetup();
        }).toThrow();
    });

    afterAll(() => {
        delete process.env.KENDRA_ROLE_ARN;
    });
});

describe('Checks all environments', () => {
    beforeEach(() => {
        process.env.S3_UPLOAD_PREFIX = 'initial';
        process.env.CASE_DDB_TABLE_NAME = 'fake_table';
        process.env.EVENT_BUS_ARN = 'fake-arn';
        process.env.WORKFLOW_CONFIG_TABLE_NAME = 'fake-workflow-config-table';
        process.env.WORKFLOW_CONFIG_NAME = 'textract';
        process.env.APP_NAMESPACE = 'app.idp';
    });

    it('succeeds when env is set correctly', () => {
        expect(envSetupChecker.checkAllEnvSetup()).toBe();
    });

    afterAll(() => {
        delete process.env.S3_UPLOAD_PREFIX;
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.EVENT_BUS_ARN;
        delete process.env.WORKFLOW_CONFIG_TABLE_NAME;
        delete process.env.WORKFLOW_CONFIG_NAME;
        delete process.env.APP_NAMESPACE;
    });
});
