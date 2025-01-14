// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
