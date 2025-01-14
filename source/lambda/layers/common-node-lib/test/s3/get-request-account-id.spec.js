// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const AccountIdParser = require('../../s3/get-request-account-id');

describe('AccountIdParser', () => {
    it('should throw an error when no account id is present in event', () => {
        const event = {
            requestContext: {}
        };

        try {
            AccountIdParser.getAccountIdFromEvent(event);
        } catch (error) {
            expect(error.message).toEqual('No request context account ID');
        }
    });

    it('should return the account id when present', () => {
        const event = {
            requestContext: {
                accountId: 'fake-account-id'
            }
        };
        expect(AccountIdParser.getAccountIdFromEvent(event)).toEqual('fake-account-id');
    });
});

describe('AccountIdParser', () => {
    it('should throw an error if context is not present', () => {
        try {
            AccountIdParser.getAccountIdFromLambdaContext(undefined);
        } catch (error) {
            expect(error.message).toEqual('Request context is missing');
        }
    });

    it('should throw an error if invokedFunctionArn is not present', () => {
        const context = {};
        try {
            AccountIdParser.getAccountIdFromLambdaContext(context);
        } catch (error) {
            expect(error.message).toEqual('No request context invokedFunctionArn');
        }
    });
    it('should return account id from the lambda context invokedFunctionArn', () => {
        const context = {
            invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:my-function'
        };
        expect(AccountIdParser.getAccountIdFromLambdaContext(context)).toEqual('123456789012');
    });
});
