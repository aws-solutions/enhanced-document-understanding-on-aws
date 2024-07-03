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
