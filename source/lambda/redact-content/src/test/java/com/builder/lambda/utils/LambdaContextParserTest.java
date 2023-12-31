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

import static org.junit.jupiter.api.Assertions.assertEquals;

import static org.mockito.Mockito.*;

import org.junit.jupiter.api.Test;

import com.amazonaws.services.lambda.runtime.Context;

public class LambdaContextParserTest {

    @Test
    // test for getInvocationAccountId method
    public void testGetInvocationAccountId() {

        Context context = mock(Context.class);
        when(context.getInvokedFunctionArn()).thenReturn("arn:aws:lambda:us-east-1:123456789012:function:my-function");

        LambdaContextParser lamdbaContextParser = new LambdaContextParser(context);
        assertEquals("123456789012", lamdbaContextParser.getInvocationAccountId());
    }
}
