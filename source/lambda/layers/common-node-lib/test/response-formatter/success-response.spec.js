// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
'use strict';

const formatter = require('../../response-formatter/success-response');

describe('When formatting messages as HTTP responses', () => {
    beforeAll(() => {
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.AWS_REGION = 'us-east-1';
    });

    it('Should format the message into a default response correctly', () => {
        const response = formatter.formatResponse('Test response');
        expect(response).toEqual({
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Headers': 'Origin,X-Requested-With,Content-Type,Accept',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
                'Access-Control-Allow-Credentials': true,
                'Access-Control-Allow-Origin': '*' // NOSONAR - javascript:S5122 - Domain not known at this point.
            },
            'isBase64Encoded': false,
            'body': 'Test response'
        });
    });

    it('Should format the message into a response correctly with extra headers', () => {
        const response = formatter.formatResponse(
            { 'test-body': 'Test response' },
            { 'x-amz-testHeader': 'test-header-value' }
        );
        expect(response).toEqual({
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Headers': 'Origin,X-Requested-With,Content-Type,Accept',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
                'Access-Control-Allow-Origin': '*', // NOSONAR - javascript:S5122 - Domain not known at this point.
                'Access-Control-Allow-Credentials': true,
                'x-amz-testHeader': 'test-header-value'
            },
            'isBase64Encoded': false,
            'body': '{"test-body":"Test response"}'
        });
    });

    afterAll(() => {
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.AWS_REGION;
    });
});
