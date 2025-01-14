// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

module.exports = {
    testEnvironment: 'node',
    testMatch: ['test/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
    collectCoverage: true,
    collectCoverageFrom: ['**.js', '!coverage/**', '!test/*.js', '!jest.config.js'],
    coverageReporters: ['text', ['lcov', { 'projectRoot': '../../../../' }]]
};
