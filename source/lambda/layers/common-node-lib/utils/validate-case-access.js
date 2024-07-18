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
 * Validate user to case association.
 * @param {string} caseId - case id in the form `{userId}:{caseUUID}`
 * @param {Object} requestContext - lambda event request context
 * @returns true/ false
 */
function validateUserToCaseAssociation(caseId, requestContext) {
    if (caseId === undefined || requestContext === undefined) {
        return false;
    }

    const userIdFromCase = caseId.split(':')[0];
    const userIdFromAuthClaim = requestContext.authorizer.claims['cognito:username'];
    return (userIdFromCase === userIdFromAuthClaim)
}

module.exports = { validateUserToCaseAssociation };
