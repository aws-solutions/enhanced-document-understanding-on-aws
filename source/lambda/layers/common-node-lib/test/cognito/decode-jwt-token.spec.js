// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const CognitoUtils = require('../../cognito/decode-jwt-token');
const jwt_decode = require('jwt-decode');

jest.mock('jwt-decode');

describe('When retrieving the UserId from a lambda event', () => {
    beforeEach(() => {
        jest.spyOn(jwt_decode, 'jwtDecode').mockImplementation((token) => {
            expect(token).toBeDefined();
            return {
                'sub': '123456789012',
                'cognito:username': 'mock-user-id'
            };
        });
    });

    it('should decode the jwt token correctly', () => {
        const token = 'mock-token';
        const decodedToken = CognitoUtils.decodeJwtToken(token);
        expect(decodedToken).toEqual({
            'sub': '123456789012',
            'cognito:username': 'mock-user-id'
        });
    });

    // create a test if the jwt_decode throws an error
    it('should throw an error if the jwt_decode throws an error', () => {
        jwt_decode.jwtDecode.mockImplementation(() => {
            throw new Error('jwt_decode error');
        });

        const token = 'mock-token';
        expect(() => {
            CognitoUtils.decodeJwtToken(token);
        }).toThrowError('jwt_decode error');
    });

    // create a test that takes in an event and returns the user id
    it('should return the user id', () => {
        // Create a mock lambda event with a Authorization token in header
        const event = {
            headers: {
                Authorization: 'mock-token'
            }
        };

        const userId = CognitoUtils.getUserIdFromEvent(event);
        expect(userId).toEqual('mock-user-id');
    });

    afterEach(() => {
        jest.resetAllMocks();
    });
});

describe('When retrieving the cognito entity from a auth token', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should have both the user id and group id', () => {
        jest.spyOn(jwt_decode, 'jwtDecode').mockImplementation((token) => {
            expect(token).toBeDefined();
            return {
                'cognito:username': 'mock-user-id',
                'cognito:groups': 'mock-group-id'
            };
        });

        const token = 'mock-token';
        const response = CognitoUtils.getCognitoEntityFromAuthToken(token);
        expect(response).toEqual({
            'cognito:username': 'mock-user-id',
            'cognito:groups': 'mock-group-id'
        });
    });

    it('should have both the user id only', () => {
        jest.spyOn(jwt_decode, 'jwtDecode').mockImplementation((token) => {
            expect(token).toBeDefined();
            return {
                'cognito:username': 'mock-user-id'
            };
        });

        const token = 'mock-token';
        const response = CognitoUtils.getCognitoEntityFromAuthToken(token);
        expect(response).toEqual({
            'cognito:username': 'mock-user-id'
        });
    });

    afterEach(() => {
        jest.resetAllMocks();
    });
});
