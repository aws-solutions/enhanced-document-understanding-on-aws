// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
'use strict';

const envSetupChecker = require('../../utils/env-setup');

describe('Check upload docs bucket name environment', () => {
    beforeEach(() => {
        process.env.UPLOAD_DOCS_BUCKET_NAME = 'fake-bucket';
    });

    it('succeeds when env is set correctly', () => {
        expect(envSetupChecker.checkS3BucketNameEnvSetup()).toBe();
    });

    it('fails when env is not set correctly', () => {
        delete process.env.UPLOAD_DOCS_BUCKET_NAME;
        expect(() => {
            envSetupChecker.checkS3BucketNameEnvSetup();
        }).toThrow();
    });

    afterAll(() => {
        delete process.env.UPLOAD_DOCS_BUCKET_NAME;
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

describe('Checks all environments', () => {
    beforeEach(() => {
        process.env.S3_UPLOAD_PREFIX = 'initial';
        process.env.UPLOAD_DOCS_BUCKET_NAME = 'fake-bucket';
    });

    it('succeeds when env is set correctly', () => {
        expect(envSetupChecker.checkAllEnvSetup()).toBe();
    });

    afterAll(() => {
        delete process.env.S3_UPLOAD_PREFIX;
        delete process.env.UPLOAD_DOCS_BUCKET_NAME;
    });
});
