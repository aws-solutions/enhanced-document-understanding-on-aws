// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package com.builder.lambda.utils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.MockedStatic;

import com.builder.lambda.model.EventDataInput;
import com.google.gson.Gson;

import software.amazon.awssdk.services.sfn.SfnClient;
import software.amazon.awssdk.services.sfn.model.SendTaskFailureRequest;
import software.amazon.awssdk.services.sfn.model.SendTaskHeartbeatRequest;
import software.amazon.awssdk.services.sfn.model.SendTaskSuccessRequest;

public class StepFunctionConnectorTest {
    private static SfnClient mockedClient;
    private static StepFunctionConnector connector;
    private static MockedStatic<LogManager> mockLogManager;

    @BeforeAll
    public static void setUp() throws Exception {
        // mocking the aws sdk client
        mockedClient = mock(SfnClient.class);
        connector = new StepFunctionConnector(mockedClient);

        // mocking the logger
        mockLogManager = mockStatic(LogManager.class);
        final Logger logger = mock(Logger.class);
        mockLogManager.when(() -> LogManager.getLogger(any(Class.class))).thenReturn(logger);
    }

    @BeforeEach
    public void clear() throws Exception {
        // mocking the aws sdk client
        clearInvocations(mockedClient);
    }

    @AfterAll
    public static void tearDown() throws Exception {
        mockLogManager.close();
    }

    @Test
    public void testSendTaskSuccess() throws Exception {
        // sends out a blank success payload 
        when(mockedClient.sendTaskSuccess(any(SendTaskSuccessRequest.class))).thenReturn(null);
        EventDataInput fakeOutputEvent = new EventDataInput();
        connector.sendTaskSuccess(fakeOutputEvent, "fakeTaskToken");
        
        // validate we correctly sent to sfn via the client
        String expectedOutput = new Gson().toJson(fakeOutputEvent);
        ArgumentCaptor<SendTaskSuccessRequest> successRequestCaptor = ArgumentCaptor.forClass(SendTaskSuccessRequest.class);
        verify(mockedClient, times(1)).sendTaskSuccess(successRequestCaptor.capture());
        assertEquals(successRequestCaptor.getValue().output(), expectedOutput);
        assertEquals(successRequestCaptor.getValue().taskToken(), "fakeTaskToken");
    }

    @Test
    public void testSendTaskFailure() throws Exception {
        // sends out a blank success payload 
        when(mockedClient.sendTaskFailure(any(SendTaskFailureRequest.class))).thenReturn(null);
        Exception e = new RuntimeException("fake error message");
        connector.sendTaskFailure(e, "fakeTaskToken");
        
        ArgumentCaptor<SendTaskFailureRequest> failureRequestCaptor = ArgumentCaptor.forClass(SendTaskFailureRequest.class);
        verify(mockedClient, times(1)).sendTaskFailure(failureRequestCaptor.capture());
        assertEquals(failureRequestCaptor.getValue().cause(), "fake error message");
        assertEquals(failureRequestCaptor.getValue().error(), "java.lang.RuntimeException: fake error message");
        assertEquals(failureRequestCaptor.getValue().taskToken(), "fakeTaskToken");
    }

    @Test
    public void testSendTaskHeartbeat() throws Exception {
        // sends out a blank success payload 
        when(mockedClient.sendTaskHeartbeat(any(SendTaskHeartbeatRequest.class))).thenReturn(null);
        connector.sendTaskHeartbeat("fakeTaskToken");
        
        // validate we correctly sent to sfn via the client
        ArgumentCaptor<SendTaskHeartbeatRequest> heartbeatRequestCaptor = ArgumentCaptor.forClass(SendTaskHeartbeatRequest.class);
        verify(mockedClient, times(1)).sendTaskHeartbeat(heartbeatRequestCaptor.capture());
        assertEquals(heartbeatRequestCaptor.getValue().taskToken(), "fakeTaskToken");
    }

    @Test
    public void testSendTaskSuccessFails() throws Exception {
        // sends out a blank success payload 
        when(mockedClient.sendTaskSuccess(any(SendTaskSuccessRequest.class))).thenThrow(new RuntimeException("fakeError"));
        EventDataInput fakeOutputEvent = new EventDataInput();
        connector.sendTaskSuccess(fakeOutputEvent, "fakeTaskToken");

        ArgumentCaptor<SendTaskFailureRequest> failureRequestCaptor = ArgumentCaptor.forClass(SendTaskFailureRequest.class);
        verify(mockedClient, times(1)).sendTaskFailure(failureRequestCaptor.capture());
        assertEquals(failureRequestCaptor.getValue().cause(), "fakeError");
        assertEquals(failureRequestCaptor.getValue().error(), "java.lang.RuntimeException: fakeError");
        assertEquals(failureRequestCaptor.getValue().taskToken(), "fakeTaskToken");
    }

    @Test
    public void testSendTaskFailureFails() throws Exception {
        // sends out a blank success payload 
        when(mockedClient.sendTaskFailure(any(SendTaskFailureRequest.class))).thenThrow(new RuntimeException("fakeError"));
        Exception e = new RuntimeException("fake error message");
        
        assertThrows(RuntimeException.class, () -> connector.sendTaskFailure(e, "fakeTaskToken"));
    }

    @Test
    public void testSendTaskHeartbeatFails() throws Exception {
        // sends out a blank success payload 
        when(mockedClient.sendTaskHeartbeat(any(SendTaskHeartbeatRequest.class))).thenThrow(new RuntimeException("fakeError"));
        assertThrows(RuntimeException.class, () -> connector.sendTaskHeartbeat("fakeTaskToken"));
    }
}
