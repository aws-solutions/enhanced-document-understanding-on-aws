// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package com.builder.lambda.utils;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import software.amazon.awssdk.services.cloudwatch.CloudWatchClient;
import software.amazon.awssdk.services.cloudwatch.model.CloudWatchException;
import software.amazon.awssdk.services.cloudwatch.model.PutMetricDataRequest;
import software.amazon.awssdk.services.cloudwatch.model.PutMetricDataResponse;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.mockStatic;

@ExtendWith(MockitoExtension.class)
class CloudWatchMetricsTest {
    @Mock
    private CloudWatchClient mockCloudWatchClient;

    @InjectMocks
    private CloudWatchMetrics cloudWatchMetrics;

    private static MockedStatic<LogManager> mockLogManager;

    @BeforeAll
    public static void setUp() {
        // mocking the logger
        mockLogManager = mockStatic(LogManager.class);
        final Logger logger = mock(Logger.class);
        mockLogManager.when(() -> LogManager.getLogger(any(Class.class))).thenReturn(logger);
    }

    @BeforeEach
    public void clear() {
        clearInvocations(mockCloudWatchClient);
    }

    @Test
    public void testPutMetricDataWithSuccess() {
        when(mockCloudWatchClient.putMetricData(any(PutMetricDataRequest.class)))
                .thenReturn(mock(PutMetricDataResponse.class));

        cloudWatchMetrics.putMetricsData(Constants.REDACT_DOCUMENT_SUCCESS);
        verify(mockCloudWatchClient, times(1)).putMetricData(any(PutMetricDataRequest.class));

        cloudWatchMetrics.putMetricsData(Constants.REDACT_DOCUMENT_FAILURE);
        verify(mockCloudWatchClient, times(2)).putMetricData(any(PutMetricDataRequest.class));
    }

    @Test
    public void shouldThrowExceptionWhenPutMetricDataFails() {
        when(mockCloudWatchClient.putMetricData(any(PutMetricDataRequest.class)))
                .thenThrow(CloudWatchException.class);
        assertThrows(CloudWatchException.class,
                () -> cloudWatchMetrics.putMetricsData(Constants.REDACT_DOCUMENT_SUCCESS));
    }

    @AfterEach
    public void releaseMocks() throws Exception {
        // closeable.close();
    }

    @AfterAll
    public static void tearDown() {
        mockLogManager.close();
    }
}