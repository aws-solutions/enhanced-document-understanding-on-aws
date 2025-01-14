// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const envSetupChecker = require('../../utils/env-setup');

describe('Check Kendra index id env variable setup', () => {
    beforeAll(() => {
        process.env.KENDRA_INDEX_ID = 'fake-kendra-index-id';
    });

    it('checkKendraIndexIdEnvSetup', () => {
        expect(envSetupChecker.checkKendraIndexIdEnvSetup()).toBe(true);
    });

    it('fails when env is not set correctly', () => {
        delete process.env.KENDRA_INDEX_ID;
        expect(envSetupChecker.checkKendraIndexIdEnvSetup()).toBe(false);
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
        expect(envSetupChecker.checkOpenSearchEnvSetup()).toBe(true);
    });

    it('fails when aws region env is not set correctly', () => {
        delete process.env.AWS_REGION;
        expect(envSetupChecker.checkOpenSearchEnvSetup()).toBe(false);
    });

    it('fails when collection endpoint env is not set correctly', () => {
        delete process.env.OS_COLLECTION_ENDPOINT;
        expect(envSetupChecker.checkOpenSearchEnvSetup()).toBe(false);
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
