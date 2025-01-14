// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
'use strict';

/**
 * Get the account ID from a lambda event
 * @param event
 * @returns {*}
 */
const getAccountIdFromEvent = (event) => {
    if (!event.requestContext.accountId) {
        console.error('No request context account ID');
        throw new Error('No request context account ID');
    }

    return event.requestContext.accountId;
};

const getAccountIdFromLambdaContext = (context) => {
    if (!context) {
        console.error('Request context is missing');
        throw new Error('Request context is missing');
    }
    if (!context.invokedFunctionArn) {
        console.error('No request context invokedFunctionArn');
        throw new Error('No request context invokedFunctionArn');
    }

    const accountId = context.invokedFunctionArn.split(':')[4];
    return accountId;
};

module.exports = { getAccountIdFromEvent, getAccountIdFromLambdaContext };
