// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

module.exports = {
    transform: {
        '^.+\\.tsx?$': 'ts-jest'
    },
    testEnvironmentOptions: {
        customExportConditions: ['']
    },
    testMatch: ['**/*.test.tsx', '**/*.test.ts'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    resolver: '<rootDir>/src/resolver.js',
    moduleNameMapper: {
        '\\.(css|scss)$': 'identity-obj-proxy'
    },
    preset: '@cloudscape-design/jest-preset',
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/src/jest.setup.ts'],
    collectCoverageFrom: [
        'src/**/*.js',
        'src/**/*.tsx',
        'src/**/*.ts',
        'src/**/*.jsx',

        '!**/__test__/**',
        '!coverage/**',
        '!test/*.js',
        '!src/resolver.js',
        '!jest.config.js',
        '!src/App.js',
        '!src/index.js',
        // Because this folder holds all the reducers for redux, We don't need to test them via this documentation provided by Redux. https://redux.js.org/usage/writing-tests
        '!src/app/reducers/*',
        '!src/mock/**',
        '!src/test_data/**',
        '!node_modules'
    ],
    coverageDirectory: './coverage/',
    collectCoverage: true,
    coverageReporters: ['text', ['lcov', { projectRoot: '../../' }]]
};
