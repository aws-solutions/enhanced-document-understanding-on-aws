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

/**
 * Utility function to convert any success response into a Http 200 response with the
 * proper formatting and headers.
 *
 * @param {any} body Response message. This will be strigified and inserted into 'body'
 * @param {[key: string]: string} extraHeaders any extra headers to include in response.
 *         any key in extraHeaders will override any header in the defaultHeaders with the same key.
 * @returns
 */
function formatResponse(body, extraHeaders) {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Headers': 'Origin,X-Requested-With,Content-Type,Accept',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Origin': '*' // NOSONAR - javascript:S5122 - Domain not known at this point.
    };
    const headers = typeof extraHeaders === 'undefined' ? defaultHeaders : { ...defaultHeaders, ...extraHeaders };
    body = typeof body === 'string' ? body : JSON.stringify(body);
    let response = {
        'statusCode': 200,
        'headers': headers,
        'isBase64Encoded': false,
        'body': body
    };
    return response;
}

module.exports = { formatResponse };
