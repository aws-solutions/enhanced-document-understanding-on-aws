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

package com.builder.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPResponse;
import com.builder.lambda.utils.ApiRequestProcessor;
import com.builder.lambda.utils.DependencyFactory;

import software.amazon.awssdk.core.SdkSystemSetting;
import software.amazon.awssdk.services.cloudwatch.CloudWatchClient;
import software.amazon.awssdk.services.cloudwatch.model.CloudWatchException;
import software.amazon.awssdk.services.cloudwatch.model.PutMetricDataRequest;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.S3Exception;
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

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.Map;

@ExtendWith(MockitoExtension.class)
public class RedactionApiHandlerTest {

    @Mock
    CloudWatchClient mockCloudWatchClient;

    @Mock
    APIGatewayV2HTTPEvent apiEvent;

    @Mock
    Context context;

    @Test
    public void testConstructionInstantiatesClients() throws Exception {

        try (MockedStatic<DependencyFactory> mockDependencyFactory = mockStatic(DependencyFactory.class)) {
            mockDependencyFactory.when(DependencyFactory::s3Client).thenReturn(mock(S3Client.class));
            mockDependencyFactory.when(DependencyFactory::cloudWatchClient).thenReturn(mock(CloudWatchClient.class));

            new RedactionApiHandler();
            mockDependencyFactory.verify(DependencyFactory::s3Client, times(1));
            mockDependencyFactory.verify(DependencyFactory::cloudWatchClient, times(1));
        }
    }

    @Test
    public void testHandleRequestPasses() throws Exception {
        EnvironmentVariables environmentVariables = new EnvironmentVariables(
                SdkSystemSetting.AWS_REGION.environmentVariable(), "fake-region");
        environmentVariables.execute(() -> {
            // mocks the ApiRequestProcessor construction which happens in handleRequest()
            MockedConstruction<ApiRequestProcessor> mockedConstruction = Mockito
                    .mockConstruction(ApiRequestProcessor.class);

            // ensure we have called the process function of the mocked ApiRequestProcessor
            // once with the provided event
            RedactionApiHandler handler = new RedactionApiHandler();
            APIGatewayV2HTTPResponse response = handler.handleRequest(apiEvent, context);
            ApiRequestProcessor mockedProcessor = mockedConstruction.constructed().get(0);
            verify(mockedProcessor, times(1)).process(apiEvent);
            assertEquals(APIGatewayV2HTTPResponse.builder().withStatusCode(201).withHeaders(Map.of(
                    "Access-Control-Allow-Origin", "*",
                    "Content-Type", "application/json",
                    "Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept",
                    "Access-Control-Allow-Methods", "OPTIONS,POST,GET")).build(), response);
            mockedConstruction.close();
        });

    }

    @Test
    public void testHandleRequestResponds400IllegalArg() throws Exception {
        // mocks the ApiRequestProcessor.process() method to throw an error
        EnvironmentVariables environmentVariables = new EnvironmentVariables(
                SdkSystemSetting.AWS_REGION.environmentVariable(), "fake-region");
        environmentVariables.execute(() -> {
            MockedConstruction<ApiRequestProcessor> mockedConstruction = Mockito.mockConstruction(
                    ApiRequestProcessor.class,
                    (mock, context) -> {
                        doThrow(new IllegalArgumentException()).when(mock).process(apiEvent);
                    });
            RedactionApiHandler handler = new RedactionApiHandler();

            APIGatewayV2HTTPResponse response = handler.handleRequest(apiEvent, context);
            APIGatewayV2HTTPResponse expected = APIGatewayV2HTTPResponse.builder().withStatusCode(400).build();
            assertEquals(expected.getStatusCode(), response.getStatusCode());
            mockedConstruction.close();
        });
    }

    @Test
    public void testHandleRequestResponds400FileNotFound() throws Exception {
        // mocks the ApiRequestProcessor.process() method to throw an error
        EnvironmentVariables environmentVariables = new EnvironmentVariables(
                SdkSystemSetting.AWS_REGION.environmentVariable(), "fake-region");
        environmentVariables.execute(() -> {
            MockedConstruction<ApiRequestProcessor> mockedConstruction = Mockito.mockConstruction(
                    ApiRequestProcessor.class,
                    (mock, context) -> {
                        doThrow(new FileNotFoundException()).when(mock).process(apiEvent);
                    });
            RedactionApiHandler handler = new RedactionApiHandler();

            APIGatewayV2HTTPResponse response = handler.handleRequest(apiEvent, context);
            APIGatewayV2HTTPResponse expected = APIGatewayV2HTTPResponse.builder().withStatusCode(400).build();
            assertEquals(expected.getStatusCode(), response.getStatusCode());
            mockedConstruction.close();
        });
    }

    @Test
    public void testHandleRequestResponds500IO() throws Exception {
        // mocks the ApiRequestProcessor.process() method to throw an error
        EnvironmentVariables environmentVariables = new EnvironmentVariables(
                SdkSystemSetting.AWS_REGION.environmentVariable(), "fake-region");
        environmentVariables.execute(() -> {
            MockedConstruction<ApiRequestProcessor> mockedConstruction = Mockito.mockConstruction(
                    ApiRequestProcessor.class,
                    (mock, context) -> {
                        doThrow(new IOException()).when(mock).process(apiEvent);
                    });
            RedactionApiHandler handler = new RedactionApiHandler();

            APIGatewayV2HTTPResponse response = handler.handleRequest(apiEvent, context);
            APIGatewayV2HTTPResponse expected = APIGatewayV2HTTPResponse.builder().withStatusCode(500).build();
            assertEquals(expected.getStatusCode(), response.getStatusCode());
            mockedConstruction.close();
        });
    }

    @Test
    public void testHandleRequestResponds500S3() throws Exception {
        // mocks the ApiRequestProcessor.process() method to throw an error
        EnvironmentVariables environmentVariables = new EnvironmentVariables(
                SdkSystemSetting.AWS_REGION.environmentVariable(), "fake-region");
        environmentVariables.execute(() -> {
            MockedConstruction<ApiRequestProcessor> mockedConstruction = Mockito.mockConstruction(
                    ApiRequestProcessor.class,
                    (mock, context) -> {
                        doThrow(S3Exception.builder().build()).when(mock).process(apiEvent);
                    });
            RedactionApiHandler handler = new RedactionApiHandler();

            APIGatewayV2HTTPResponse response = handler.handleRequest(apiEvent, context);
            APIGatewayV2HTTPResponse expected = APIGatewayV2HTTPResponse.builder().withStatusCode(500).build();
            assertEquals(expected.getStatusCode(), response.getStatusCode());
            mockedConstruction.close();
        });

    }

    @Test
    public void testHandleRequestResponds500Generic() throws Exception {
        // mocks the ApiRequestProcessor.process() method to throw an error
        EnvironmentVariables environmentVariables = new EnvironmentVariables(
                SdkSystemSetting.AWS_REGION.environmentVariable(), "fake-region");
        environmentVariables.execute(() -> {
            MockedConstruction<ApiRequestProcessor> mockedConstruction = Mockito.mockConstruction(
                    ApiRequestProcessor.class,
                    (mock, context) -> {
                        doThrow(new RuntimeException()).when(mock).process(apiEvent);
                    });
            RedactionApiHandler handler = new RedactionApiHandler();

            APIGatewayV2HTTPResponse response = handler.handleRequest(apiEvent, context);
            APIGatewayV2HTTPResponse expected = APIGatewayV2HTTPResponse.builder().withStatusCode(500).build();
            assertEquals(expected.getStatusCode(), response.getStatusCode());
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
            // mocks the ApiRequestProcessor construction which happens in handleRequest()
            MockedConstruction<ApiRequestProcessor> mockedConstruction = Mockito
                    .mockConstruction(ApiRequestProcessor.class);

            // ensure we have called the process function of the mocked ApiRequestProcessor
            // once with the provided event
            RedactionApiHandler handler = new RedactionApiHandler();
            assertDoesNotThrow(() -> handler.handleRequest(apiEvent, context));
            mockedConstruction.close();
        });
    }
}
