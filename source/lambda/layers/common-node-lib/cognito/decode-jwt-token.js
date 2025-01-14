// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
