// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
