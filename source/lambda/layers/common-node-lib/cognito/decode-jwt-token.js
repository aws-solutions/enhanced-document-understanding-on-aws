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

const jwt_decode = require('jwt-decode').jwtDecode;

/**
 * Uses the Authorization header to decode the JWT token
 * @param {Object} event - lambda event object
 * @returns decoded JWT token
 */
exports.decodeJwtToken = (jwtToken) => {
    try {
        return jwt_decode(jwtToken);
    } catch (error) {
        console.error(error);
        throw error;
    }
};

/**
 * Uses the Authorization header to decode the JWT token and return the cognito user id
 * @param {Object} event - lambda event object
 * @returns cognito user id
 */
exports.getUserIdFromEvent = (event) => {
    const decodedJwt = this.decodeJwtToken(event.headers.Authorization);
    const cognitoUserId = decodedJwt['cognito:username'];
    return cognitoUserId;
};

/**
 * Uses the Authorization header to decode the JWT token and return the cognito user pool name
 * and/or group name.
 * @param {String} authToken Cognito auth token
 * @returns Object containing cognito user id and groups
 */
exports.getCognitoEntityFromAuthToken = (authToken) => {
    const decodedJwt = this.decodeJwtToken(authToken);
    return Object.assign(
        {},
        'cognito:username' in decodedJwt ? { 'cognito:username': decodedJwt['cognito:username'] } : {},
        'cognito:groups' in decodedJwt ? { 'cognito:groups': decodedJwt['cognito:groups'] } : {}
    );
};
