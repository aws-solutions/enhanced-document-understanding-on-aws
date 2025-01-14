// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
'use strict';

const errorFormatter = require('../../response-formatter/error-response');

describe('When formatting error responses as HTTP responses', () => {
    beforeAll(() => {
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.AWS_REGION = 'us-east-1';
    });

    it('Should format the error into a default response correctly', () => {
        const response = errorFormatter.formatError(new Error('Test error'));
        expect(response).toEqual({
            'statusCode': '400',
            'headers': {
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'text/plain',
                'x-amzn-ErrorType': 'CustomExecutionError',
                'Access-Control-Allow-Origin': '*' // NOSONAR - javascript:S5122 - Domain not known at this point.
            },
            'isBase64Encoded': false,
            'body': 'CustomExecutionError: Test error'
        });
    });

    it('Should format a custom error response correctly', () => {
        const customErr = new Error('Test error');
        customErr.statusCode = '501';
        customErr.code = 'TestCustomError';

        expect(errorFormatter.formatError(customErr)).toEqual({
            'statusCode': '501',
            'headers': {
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'text/plain',
                'x-amzn-ErrorType': 'TestCustomError',
                'Access-Control-Allow-Origin': '*' // NOSONAR - javascript:S5122 - Domain not known at this point.
            },
            'isBase64Encoded': false,
            'body': 'TestCustomError: Test error'
        });
    });

    // if formatError receives a string then it shoud still format the error correctly
    it('Should format a custom error response correctly when the error is a string', () => {
        expect(errorFormatter.formatError('Test error')).toEqual({
            'statusCode': '400',
            'headers': {
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'text/plain',
                'x-amzn-ErrorType': 'CustomExecutionError',
                'Access-Control-Allow-Origin': '*' // NOSONAR - javascript:S5122 - Domain not known at this point.
            },
            'isBase64Encoded': false,
            'body': 'CustomExecutionError: Test error'
        });
    });

    afterAll(() => {
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.AWS_REGION;
    });
});
