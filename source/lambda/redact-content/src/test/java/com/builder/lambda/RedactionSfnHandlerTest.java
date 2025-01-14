// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package com.builder.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.events.SQSEvent;
import com.builder.lambda.utils.DependencyFactory;
import com.builder.lambda.utils.SfnRequestProcessor;

import software.amazon.awssdk.core.SdkSystemSetting;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.sfn.SfnClient;
import uk.org.webcompere.systemstubs.environment.EnvironmentVariables;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.mockito.Mock;
import org.mockito.MockedConstruction;
import org.mockito.MockedStatic;
import software.amazon.awssdk.services.cloudwatch.CloudWatchClient;
import software.amazon.awssdk.services.cloudwatch.model.CloudWatchException;
import software.amazon.awssdk.services.cloudwatch.model.PutMetricDataRequest;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RedactionSfnHandlerTest {

    @Mock
    SQSEvent sqsEvent;

    @Mock
    Context context;

    @Mock
    CloudWatchClient mockCloudWatchClient;

    @Test
    public void testConstructionInstantiatesClients() throws Exception {

        try (MockedStatic<DependencyFactory> mockDependencyFactory = mockStatic(DependencyFactory.class)) {
            mockDependencyFactory.when(DependencyFactory::s3Client).thenReturn(mock(S3Client.class));
            mockDependencyFactory.when(DependencyFactory::sfnClient).thenReturn(mock(SfnClient.class));

            new RedactionSfnHandler();
            mockDependencyFactory.verify(DependencyFactory::s3Client, times(1));
            mockDependencyFactory.verify(DependencyFactory::sfnClient, times(1));
        }
    }

    @Test
    public void testHandleRequestPasses() throws Exception {
        EnvironmentVariables environmentVariables = new EnvironmentVariables(
                SdkSystemSetting.AWS_REGION.environmentVariable(), "fake-region");
        environmentVariables.execute(() -> {
            // mocks the RequestProcessor construction which happens in handleRequest()
            MockedConstruction<SfnRequestProcessor> mockedConstruction = Mockito
                    .mockConstruction(SfnRequestProcessor.class);

            // ensure we have called the process function of the mocked SfnRequestProcessor
            // once with the provided event
            RedactionSfnHandler handler = new RedactionSfnHandler();
            handler.handleRequest(sqsEvent, context);
            SfnRequestProcessor mockedProcessor = mockedConstruction.constructed().get(0);
            verify(mockedProcessor, times(1)).process(sqsEvent);
            mockedConstruction.close();
        });

    }

    @Test
    public void testHandleRequestThrowsWhenRequestFails() throws Exception {
        // mocks the SfnRequestProcessor.process() method to throw an error
        EnvironmentVariables environmentVariables = new EnvironmentVariables(
                SdkSystemSetting.AWS_REGION.environmentVariable(), "fake-region");
        environmentVariables.execute(() -> {
            MockedConstruction<SfnRequestProcessor> mockedConstruction = Mockito.mockConstruction(
                    SfnRequestProcessor.class,
                    (mock, context) -> {
                        doThrow(new RuntimeException()).when(mock).process(sqsEvent);
                    });
            RedactionSfnHandler handler = new RedactionSfnHandler();

            assertThrows(RuntimeException.class, () -> handler.handleRequest(sqsEvent,
                    context));
            mockedConstruction.close();
        });
    }

    @Test
    @MockitoSettings(strictness = Strictness.LENIENT)
    public void shouldNotThrowExceptionWhenPutMetricDataFails() throws Exception {
        doThrow(CloudWatchException.class).when(mockCloudWatchClient).putMetricData(any(PutMetricDataRequest.class));
        EnvironmentVariables environmentVariables = new EnvironmentVariables(
                SdkSystemSetting.AWS_REGION.environmentVariable(), "fake-region");
        environmentVariables.execute(() -> {
            // mocks the SfnRequestProcessor construction which happens in handleRequest()
            MockedConstruction<SfnRequestProcessor> mockedConstruction = Mockito
                    .mockConstruction(SfnRequestProcessor.class);

            // ensure we have called the process function of the mocked SfnRequestProcessor
            // once with the provided event
            RedactionSfnHandler handler = new RedactionSfnHandler();
            assertDoesNotThrow(() -> handler.handleRequest(sqsEvent, context));
            mockedConstruction.close();
        });
    }
}
