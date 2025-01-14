// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
'use strict';

/**
 * Formats a error object into a HTTP response with an error status code.
 * If error is a string, it is converted to a Object with parameter key `message`
 * @param {Error} error
 * @returns
 */
function formatError(error) {
    // if error is a string then convert to a Object with key message
    if (typeof error === 'string') {
        error = {
            message: error
        };
    }

    error.statusCode = error.statusCode ?? '400';
    error.code = error.code ?? 'CustomExecutionError';
    const allowOrigin = process.env.ALLOW_ORIGIN || "*";

    let response = {
        'statusCode': error.statusCode,
        'headers': {
            "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
            "Access-Control-Allow-Origin": `${allowOrigin}`,
            'Content-Type': 'text/plain',
            'x-amzn-ErrorType': error.code,
            'Access-Control-Allow-Origin': '*' // NOSONAR - javascript:S5122 - Domain not known at this point.
        },
        'isBase64Encoded': false,
        'body': error.code + ': ' + error.message
    };
    return response;
}

module.exports = { formatError };
