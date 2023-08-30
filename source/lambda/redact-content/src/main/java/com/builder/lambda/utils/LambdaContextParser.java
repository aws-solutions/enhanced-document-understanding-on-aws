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
