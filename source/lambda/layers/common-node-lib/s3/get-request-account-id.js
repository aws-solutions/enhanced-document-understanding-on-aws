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
