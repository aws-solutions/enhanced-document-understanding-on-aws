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

import com.amazonaws.services.lambda.runtime.events.SQSEvent;
import com.amazonaws.services.lambda.runtime.events.SQSEvent.SQSMessage;
import com.amazonaws.util.IOUtils;
import com.builder.lambda.model.Document;
import com.builder.lambda.model.EventDataBody;
import com.builder.lambda.model.EventDataInput;
import com.google.gson.Gson;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import org.mockito.ArgumentCaptor;
import org.mockito.MockedConstruction;
import org.mockito.MockedStatic;
import org.mockito.Mockito;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.mockStatic;

import software.amazon.awssdk.services.s3.model.Tag;
import uk.org.webcompere.systemstubs.environment.EnvironmentVariables;

public class SfnRequestProcessorTest {
    private static SQSEvent event;
    private static ArrayList<EventDataBody> expectedEventBodies = new ArrayList<EventDataBody>();
    private static MockedStatic<IOUtils> ioUtils;

    private static S3Storage mockS3;
    private static StepFunctionConnector mockSfn;
    private static CloudWatchMetrics mockCWMetrics;

    @BeforeAll
    public static void setUp() throws Exception {
        // mocking the s3 storage
        mockS3 = mock(S3Storage.class);
        final InputStream inputStream = mock(InputStream.class);
        when(mockS3.getFile(anyString(), anyString())).thenReturn(inputStream);

        final List<Tag> tags = new ArrayList<>();
        when(mockS3.getObjectTags(anyString(), anyString())).thenReturn(tags);

        // note: this uglier format is required when mocking void methods
        Mockito.doNothing().when(mockS3).putFile(anyString(), anyString(), any(ByteArrayOutputStream.class));

        // mocking IOUtils class to convert input-stream to string
        ioUtils = mockStatic(IOUtils.class);
        Path redactFilePath = Path.of("src/test/java/resources/redactData.json");
        String redactData = Files.readString(redactFilePath);
        ioUtils.when(() -> IOUtils.toString(any(InputStream.class))).thenReturn(redactData);

        // mocking cloud watch metrics putMetric
        mockCWMetrics = mock(CloudWatchMetrics.class);
        Mockito.doNothing().when(mockCWMetrics).putMetricsData(anyString());

        // mocking the step function connector and methods
        mockSfn = mock(StepFunctionConnector.class);
        Mockito.doNothing().when(mockSfn).sendTaskSuccess(any(EventDataInput.class), anyString());
        Mockito.doNothing().when(mockSfn).sendTaskFailure(any(Exception.class), anyString());
        Mockito.doNothing().when(mockSfn).sendTaskHeartbeat(anyString());

        // creating test event to work with
        event = new SQSEvent();
        List<SQSMessage> messages = new ArrayList<SQSMessage>();

        // loading some fake testing data
        String[] bodyFiles = { "src/test/java/resources/eventBody1.json", "src/test/java/resources/eventBody2.json" };
        for (String file : bodyFiles) {
            Path filePath = Path.of(file);
            String eventBody = Files.readString(filePath);
            expectedEventBodies.add(new Gson().fromJson(eventBody, EventDataBody.class));
            SQSMessage fakeMessage = new SQSMessage();
            fakeMessage.setBody(eventBody);
            messages.add(fakeMessage);
        }
        event.setRecords(messages);

        // Use try-catch block for mockStatic in case of mocking multiple static
        // classes,
        // 'mocking is already registered in the current thread' will be thrown
        // otherwise
        // https://www.testim.io/blog/mocking-static-methods-mockito option3
        try (MockedStatic<LogManager> theMock = Mockito.mockStatic(LogManager.class)) {
            theMock.when(LogManager::getLogger).thenReturn(mock(Logger.class));
        }
    }

    @AfterEach
    public void clearMocks() throws Exception {
        clearInvocations(mockS3, mockSfn);
    }

    @AfterAll
    public static void tearDown() throws Exception {
        ioUtils.close();
    }

    @Test
    public void testProcessesRequestFailsWhenBucketEnvNotSet() throws Exception {
        assertThrows(IllegalStateException.class,
                () -> new SfnRequestProcessor(mockSfn, mockS3, mockCWMetrics).process(event));
    }

    @Test
    public void testProcessesRequestSuccessWithReuseRedactors() throws Exception {
        // mocking the redactor construction since it happens on the fly based on input
        MockedConstruction<ImageRedactor> mockedImageRedactorConstructor = Mockito
                .mockConstruction(ImageRedactor.class);
        MockedConstruction<PdfRedactor> mockedPdfRedactorConstructor = Mockito
                .mockConstruction(PdfRedactor.class);

        EnvironmentVariables environmentVariables = new EnvironmentVariables("DOCUMENT_BUCKET_NAME", "fake-bucket",
                "S3_INFERENCE_BUCKET_NAME", "fake-inference-bucket", "S3_UPLOAD_PREFIX", "initial",
                "S3_REDACTED_PREFIX", "redacted");
        // we have mocked environment vars inside this scope
        environmentVariables.execute(() -> {
            SfnRequestProcessor requestProcessor = new SfnRequestProcessor(mockSfn, mockS3, mockCWMetrics);
            requestProcessor.process(event);
            // each redactor is called once since we have 2 sqs events
            verify(mockedImageRedactorConstructor.constructed().get(0), times(1))
                    .processDocument(any(Document.class), any());
            verify(mockedPdfRedactorConstructor.constructed().get(0), times(1))
                    .processDocument(any(Document.class), any());

            verify(mockS3, times(1)).getFile("fake-bucket", "fake-prefix/file1.jpg");
            verify(mockS3, times(1)).getObjectTags("fake-bucket", "fake-prefix/file1.jpg");

            verify(mockS3, times(1)).getFile("fake-bucket", "fake-prefix/file1.pdf");
            verify(mockS3, times(1)).getObjectTags("fake-bucket", "fake-prefix/file1.pdf");

            verify(mockS3, times(2)).getFile("fake-inference-bucket",
                    "fake-user-id/fake-doc-id/textract-detectText-locations.json");

            // since redactor is mocked, the file it outputs is null
            verify(mockS3, times(1)).putFile("fake-bucket", "redacted/fakeCaseId/fakeDocId1-redacted.jpg", null);
            verify(mockS3, times(1)).setObjectTags("fake-bucket", "redacted/fakeCaseId/fakeDocId1-redacted.jpg",
                    new ArrayList<>());

            verify(mockS3, times(1)).putFile("fake-bucket", "redacted/fakeCaseId/fakeDocId2-redacted.pdf", null);
            verify(mockS3, times(1)).setObjectTags("fake-bucket", "redacted/fakeCaseId/fakeDocId2-redacted.pdf",
                    new ArrayList<>());

            // run process again and ensure we did not re-construct the redactors
            requestProcessor.process(event);
            assertEquals(1, mockedImageRedactorConstructor.constructed().size());
            assertEquals(1, mockedPdfRedactorConstructor.constructed().size());

            mockedImageRedactorConstructor.closeOnDemand();
            mockedPdfRedactorConstructor.closeOnDemand();
        });
    }

    @Test
    public void testProcessesRequestSuccessSendsToSfn() throws Exception {
        // mocking the redactor construction since it happens on the fly based on input
        MockedConstruction<ImageRedactor> mockedImageRedactorConstructor = Mockito
                .mockConstruction(ImageRedactor.class);
        MockedConstruction<PdfRedactor> mockedPdfRedactorConstructor = Mockito
                .mockConstruction(PdfRedactor.class);

        EnvironmentVariables environmentVariables = new EnvironmentVariables("DOCUMENT_BUCKET_NAME", "fake-bucket",
                "S3_INFERENCE_BUCKET_NAME", "fake-inference-bucket", "S3_UPLOAD_PREFIX", "initial",
                "S3_REDACTED_PREFIX", "redacted");
        // we have mocked environment vars inside this scope
        environmentVariables.execute(() -> {
            // running process with just 1 record
            SQSEvent singleRecordEvent = new SQSEvent();
            singleRecordEvent.setRecords(List.of(event.getRecords().get(0)));

            SfnRequestProcessor requestProcessor = new SfnRequestProcessor(mockSfn, mockS3, mockCWMetrics);
            requestProcessor.process(singleRecordEvent);

            // checking we sent task success with the right args
            ArgumentCaptor<EventDataInput> successPayloadCapture = ArgumentCaptor.forClass(EventDataInput.class);
            verify(mockSfn, times(1)).sendTaskSuccess(successPayloadCapture.capture(), eq("fakeToken"));
            EventDataInput actualEventBodyInput = successPayloadCapture.getValue();
            assertEquals(actualEventBodyInput, expectedEventBodies.get(0).getInput());
            verify(mockSfn, times(1)).sendTaskHeartbeat("fakeToken");

            mockedImageRedactorConstructor.closeOnDemand();
            mockedPdfRedactorConstructor.closeOnDemand();
        });
    }

    @Test
    public void testProcessesRequestFailsWithBadType() throws Exception {
        EnvironmentVariables environmentVariables = new EnvironmentVariables("DOCUMENT_BUCKET_NAME", "fake-bucket",
                "S3_INFERENCE_BUCKET_NAME", "fake-inference-bucket", "S3_UPLOAD_PREFIX", "initial",
                "S3_REDACTED_PREFIX", "redacted");
        // we have mocked environment vars inside this scope
        environmentVariables.execute(() -> {
            SQSEvent badEvent = new SQSEvent();
            List<SQSMessage> messages = new ArrayList<SQSMessage>();
            Path filePath = Path.of("src/test/java/resources/badEventBody1.json");
            String eventBody = Files.readString(filePath);
            SQSMessage fakeMessage = new SQSMessage();
            fakeMessage.setBody(eventBody);
            messages.add(fakeMessage);
            badEvent.setRecords(messages);

            SfnRequestProcessor requestProcessor = new SfnRequestProcessor(mockSfn, mockS3, mockCWMetrics);
            requestProcessor.process(badEvent);

            verify(mockSfn, times(1)).sendTaskFailure(any(IllegalArgumentException.class), eq("fakeToken"));
        });
    }
}
