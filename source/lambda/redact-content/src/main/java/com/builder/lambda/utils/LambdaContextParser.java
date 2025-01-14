// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package com.builder.lambda.utils;

import com.amazonaws.services.lambda.runtime.Context;

import software.amazon.lambda.powertools.logging.Logging;

public class LambdaContextParser {

    private static final Integer ACCOUNT_ID_INDEX = 4;
    private final Context lambdaContext;

    public LambdaContextParser(final Context context) {
        this.lambdaContext = context;
    }

    public Context getLambdaContext() {
        return this.lambdaContext;
    }

    /**
     * Get the account id by parsing the invocation function arn from
     * a given lambda context
     * 
     * @return aws account id
     */
    @Logging
    public String getInvocationAccountId() {
        String invocationFunctionArn = lambdaContext.getInvokedFunctionArn();
        String[] arnParts = invocationFunctionArn.split(":");
        return arnParts[ACCOUNT_ID_INDEX];
    }
}
