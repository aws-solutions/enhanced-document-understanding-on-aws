// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const { validateUserToCaseAssociation } = require('../../index');

describe('validateUserToCaseAssociation', () => {
    it('should return false when caseId is undefined', () => {
        const requestContext = { authorizer: { claims: { 'cognito:username': 'user123' } } };
        const result = validateUserToCaseAssociation(undefined, requestContext);
        expect(result).toBe(false);
    });

    it('should return false when requestContext is undefined', () => {
        const result = validateUserToCaseAssociation('user123:case456', undefined);
        expect(result).toBe(false);
    });

    it('should return false when userIdClaim does not match userId from caseId', () => {
        const requestContext = { authorizer: { claims: { 'cognito:username': 'user456' } } };
        const result = validateUserToCaseAssociation('user123:case456', requestContext);
        expect(result).toBe(false);
    });

    it('should return true when userIdClaim matches userId from caseId', () => {
        const requestContext = { authorizer: { claims: { 'cognito:username': 'user123' } } };
        const result = validateUserToCaseAssociation('user123:case456', requestContext);
        expect(result).toBe(true);
    });

    it('should handle requestContext with additional properties', () => {
        const requestContext = {
            authorizer: {
                claims: { 'cognito:username': 'user123' },
                otherProperty: 'value'
            }
        };
        const result = validateUserToCaseAssociation('user123:case456', requestContext);
        expect(result).toBe(true);
    });
});
