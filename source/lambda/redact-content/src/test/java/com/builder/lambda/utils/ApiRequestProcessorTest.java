// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package com.builder.lambda.utils;

import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPEvent;
import com.builder.lambda.model.BoundingBox;
import com.builder.lambda.model.Document;

import software.amazon.awssdk.services.s3.model.S3Object;
import software.amazon.awssdk.services.s3.model.Tag;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.MockedConstruction;
import org.mockito.MockedStatic;
import org.mockito.Mockito;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.matches;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.mockStatic;

import uk.org.webcompere.systemstubs.environment.EnvironmentVariables;

public class ApiRequestProcessorTest {
    private static APIGatewayV2HTTPEvent event;
    private static MockedStatic<LogManager> mockLogManager;
    private static EnvironmentVariables environmentVariables;

    @BeforeAll
    public static void setUp() throws Exception {
        // creating test event to work with
        event = new APIGatewayV2HTTPEvent();
        Path eventBodyFilePath = Path.of("src/test/java/resources/apiRequestBody.json");
        String eventBody = Files.readString(eventBodyFilePath);
        event.setBody(eventBody);
        event.setPathParameters(Map.of("caseId", "fake-case", "documentId", "fake-doc"));

        // mocking the logger
        mockLogManager = mockStatic(LogManager.class);
        final Logger logger = mock(Logger.class);
        mockLogManager.when(() -> LogManager.getLogger(any(Class.class))).thenReturn(logger);

        // mocking required environment variables
        environmentVariables = new EnvironmentVariables("DOCUMENT_BUCKET_NAME", "fake-bucket",
                "S3_INFERENCE_BUCKET_NAME", "fake-inference-bucket", "S3_UPLOAD_PREFIX", "initial",
                "S3_REDACTED_PREFIX", "redacted");
    }

    @AfterAll
    public static void tearDown() throws Exception {
        mockLogManager.close();
    }

    @Test
    public void testProcessesRequestFailsWhenBucketEnvNotSet() throws Exception {
        assertThrows(IllegalStateException.class, () -> new ApiRequestProcessor(mock(S3Storage.class)).process(event));
    }

    @Test
    public void testProcessesRequestSuccessWithReuseRedactors() throws Exception {

        // mocking the redactor construction since it happens on the fly based on input
        MockedConstruction<ImageRedactor> mockedImageRedactorConstructor = Mockito
                .mockConstruction(ImageRedactor.class);
        MockedConstruction<PdfRedactor> mockedPdfRedactorConstructor = Mockito
                .mockConstruction(PdfRedactor.class);

        // mocking the s3 storage to return the files we want to test
        S3Storage mockS3 = mock(S3Storage.class);

        // Returning the entity locations file
        File locationsFile = new File("src/test/java/resources/redactData.json");
        final InputStream locationsStream = new FileInputStream(locationsFile);
        when(mockS3.getFile(matches("fake-inference-bucket"), matches(".*-locations\\.json")))
                .thenReturn(locationsStream);

        // Returning the textract detectText file
        File textractFile = new File("src/test/java/resources/textract-detectText.json");
        final InputStream textractStream = new FileInputStream(textractFile);
        when(mockS3.getFile(matches("fake-inference-bucket"), matches(".*textract-detectText\\.json")))
                .thenReturn(textractStream);

        // an input file (e.g. image or pdf)
        final InputStream inputFileStream = new ByteArrayInputStream("fake data".getBytes());
        when(mockS3.getFile(matches("fake-bucket"), matches(".*\\.(jpg|pdf)"))).thenReturn(inputFileStream);

        final List<Tag> tags = new ArrayList<>();
        when(mockS3.getObjectTags(matches("fake-bucket"), matches(".*\\.(jpg|pdf)"))).thenReturn(tags);

        // do nothing when putting files
        Mockito.doNothing().when(mockS3).putFile(anyString(), anyString(), any(ByteArrayOutputStream.class));
        Mockito.doNothing().when(mockS3).setObjectTags(anyString(), anyString(), anyList());

        // return some fake file when listing objects
        ArrayList<S3Object> fakeObjects = new ArrayList<S3Object>();
        fakeObjects.add(S3Object.builder().key("initial/fake-case/fake-doc.jpg").build());
        when(mockS3.listObjects(anyString(), anyString())).thenReturn(fakeObjects);

        try {
            // we have mocked environment vars inside this scope
            environmentVariables.execute(() -> {

                ApiRequestProcessor requestProcessor = new ApiRequestProcessor(mockS3);

                // image redaction
                requestProcessor.process(event);

                @SuppressWarnings("unchecked")
                ArgumentCaptor<Map<String, List<BoundingBox>>> redactionBboxMapCapture = ArgumentCaptor
                        .forClass(Map.class);
                ;
                verify(mockedImageRedactorConstructor.constructed().get(0), times(1))
                        .processDocument(any(Document.class), redactionBboxMapCapture.capture());

                // ensuring we called the redactor with correct bboxes
                assertEquals(redactionBboxMapCapture.getValue().size(), 2);
                // page 1 will have 1 bbox from an entity, 2 bboxes from the mutli-line phrase,
                // and 2 bboxes from occurrences of the word "Seattle", and a null bbox
                assertEquals(redactionBboxMapCapture.getValue().get("1").size(), 6);
                // page 2 will have 3 bboxes from entities, and 2 from the multi-line phrase
                assertEquals(redactionBboxMapCapture.getValue().get("2").size(), 5);

                // Instance of "10/23/20, 3:28 PM" on pg 1
                assertEquals(redactionBboxMapCapture.getValue().get("1").get(4),
                        new BoundingBox(0.105522,
                                0.008879,
                                0.863852,
                                0.022901));

                // first instance of "type 2" on pg 2
                assertEquals(redactionBboxMapCapture.getValue().get("2").get(2),
                        new BoundingBox(0.053896,
                                0.0143939,
                                0.251179,
                                0.103189));
                // second instance of "type 2" on pg 2
                assertEquals(redactionBboxMapCapture.getValue().get("2").get(3),
                        new BoundingBox(0.053991,
                                0.014388,
                                0.555819,
                                0.128375));
                // Instance of "10/23/20, 3:28 PM" on pg 2
                assertEquals(redactionBboxMapCapture.getValue().get("2").get(4),
                        new BoundingBox(0.105479,
                                0.008942,
                                0.864218,
                                0.022893));

                // pdf redaction
                fakeObjects.set(0, S3Object.builder().key("initial/fake-case/fake-doc.pdf").build());
                requestProcessor.process(event);
                verify(mockedPdfRedactorConstructor.constructed().get(0), times(1))
                        .processDocument(any(Document.class), anyMap());

                // ensuring we pulled expected files from s3
                verify(mockS3, times(1)).getFile("fake-bucket", "initial/fake-case/fake-doc.jpg");
                verify(mockS3, times(1)).getObjectTags("fake-bucket", "initial/fake-case/fake-doc.jpg");

                verify(mockS3, times(1)).getFile("fake-bucket", "initial/fake-case/fake-doc.pdf");
                verify(mockS3, times(1)).getObjectTags("fake-bucket", "initial/fake-case/fake-doc.pdf");

                verify(mockS3, times(2)).getFile("fake-inference-bucket",
                        "fake-case/fake-doc/entity-standard-locations.json");
                verify(mockS3, times(2)).getFile("fake-inference-bucket",
                        "fake-case/fake-doc/entity-medical-locations.json");
                verify(mockS3, times(2)).getFile("fake-inference-bucket",
                        "fake-case/fake-doc/textract-detectText.json");

                // since redactor is mocked, the file it outputs is null
                verify(mockS3, times(1)).putFile("fake-bucket", "redacted/fake-case/fake-doc-redacted.jpg", null);
                verify(mockS3, times(1)).setObjectTags("fake-bucket", "redacted/fake-case/fake-doc-redacted.jpg", tags);

                verify(mockS3, times(1)).putFile("fake-bucket", "redacted/fake-case/fake-doc-redacted.pdf", null);
                verify(mockS3, times(1)).setObjectTags("fake-bucket", "redacted/fake-case/fake-doc-redacted.pdf", tags);

                // run process again and ensure we did not re-construct the redactors
                requestProcessor.process(event);
                assertEquals(1, mockedImageRedactorConstructor.constructed().size());
                assertEquals(1, mockedPdfRedactorConstructor.constructed().size());

                // run process with partial events
                APIGatewayV2HTTPEvent entitiesEvent = new APIGatewayV2HTTPEvent();
                Path eventBodyEntitiesFilePath = Path.of("src/test/java/resources/apiRequestBody-entities.json");
                String eventBodyEntities = Files.readString(eventBodyEntitiesFilePath);
                entitiesEvent.setBody(eventBodyEntities);
                entitiesEvent.setPathParameters(Map.of("caseId", "fake-case", "documentId", "fake-doc"));
                requestProcessor.process(entitiesEvent);

                APIGatewayV2HTTPEvent phrasesEvent = new APIGatewayV2HTTPEvent();
                Path eventBodyPhrasesFilePath = Path.of("src/test/java/resources/apiRequestBody-phrases.json");
                String eventBodyPhrases = Files.readString(eventBodyPhrasesFilePath);
                phrasesEvent.setBody(eventBodyPhrases);
                phrasesEvent.setPathParameters(Map.of("caseId", "fake-case", "documentId", "fake-doc"));
                requestProcessor.process(phrasesEvent);

                // after above executions, we should have run 4 times
                verify(mockS3, times(4)).putFile("fake-bucket", "redacted/fake-case/fake-doc-redacted.pdf", null);
                verify(mockS3, times(4)).setObjectTags("fake-bucket", "redacted/fake-case/fake-doc-redacted.pdf", tags);

                mockedImageRedactorConstructor.close();
                mockedPdfRedactorConstructor.close();
            });
        } finally {
            // close the mocked constructors
            mockedImageRedactorConstructor.closeOnDemand();
            mockedPdfRedactorConstructor.closeOnDemand();
            // close the file streams
            locationsStream.close();
            textractStream.close();
        }

    }

    @Test
    public void testProcessesRequestFailsWithBadPathParams() throws Exception {
        // we have mocked environment vars inside this scope
        environmentVariables.execute(() -> {
            APIGatewayV2HTTPEvent badEvent = new APIGatewayV2HTTPEvent();
            badEvent.setBody(event.getBody());
            badEvent.setPathParameters(null);
            ApiRequestProcessor requestProcessor = new ApiRequestProcessor(mock(S3Storage.class));

            assertThrows(IllegalArgumentException.class, () -> requestProcessor.process(badEvent));
        });
    }

    @Test
    public void testProcessesRequestFailsWithBadJsonInput() throws Exception {
        // we have mocked environment vars inside this scope
        environmentVariables.execute(() -> {
            APIGatewayV2HTTPEvent badEvent = new APIGatewayV2HTTPEvent();
            badEvent.setPathParameters(Map.of("caseId", "fake-case", "documentId", "fake-doc"));
            badEvent.setBody("bad body");

            ApiRequestProcessor requestProcessor = new ApiRequestProcessor(mock(S3Storage.class));

            assertThrows(IllegalArgumentException.class, () -> requestProcessor.process(badEvent));
        });
    }

    @Test
    public void testProcessesRequestFailsWhenNoDocExists() throws Exception {
        // we have mocked environment vars inside this scope
        environmentVariables.execute(() -> {
            APIGatewayV2HTTPEvent badEvent = new APIGatewayV2HTTPEvent();
            badEvent.setBody(event.getBody());
            badEvent.setPathParameters(Map.of("caseId", "fake-case", "documentId", "fake-doc"));

            S3Storage mockS3 = mock(S3Storage.class);
            when(mockS3.listObjects(anyString(), anyString())).thenReturn(new ArrayList<>());

            ApiRequestProcessor requestProcessor = new ApiRequestProcessor(mockS3);

            assertThrows(IllegalArgumentException.class, () -> requestProcessor.process(badEvent));
        });
    }

    @Test
    public void testProcessesRequestFailsOnIllegalFileExtension() throws Exception {
        // we have mocked environment vars inside this scope
        environmentVariables.execute(() -> {
            APIGatewayV2HTTPEvent badEvent = new APIGatewayV2HTTPEvent();
            badEvent.setBody(event.getBody());
            badEvent.setPathParameters(Map.of("caseId", "fake-case", "documentId", "fake-doc"));

            ArrayList<S3Object> fakeObjects = new ArrayList<S3Object>();
            fakeObjects.add(S3Object.builder().key("bad-file.txt").build());
            S3Storage mockS3 = mock(S3Storage.class);
            when(mockS3.listObjects(anyString(), anyString())).thenReturn(fakeObjects);

            ApiRequestProcessor requestProcessor = new ApiRequestProcessor(mockS3);

            assertThrows(IllegalArgumentException.class, () -> requestProcessor.process(badEvent));
        });
    }

    @Test
    public void testProcessesRequestFailsOnGetFile() throws Exception {
        // we have mocked environment vars inside this scope
        environmentVariables.execute(() -> {
            APIGatewayV2HTTPEvent badEvent = new APIGatewayV2HTTPEvent();
            badEvent.setBody(event.getBody());
            badEvent.setPathParameters(Map.of("caseId", "fake-case", "documentId", "fake-doc"));

            ArrayList<S3Object> fakeObjects = new ArrayList<S3Object>();
            fakeObjects.add(S3Object.builder().key("fake-file.pdf").build());
            S3Storage mockS3 = mock(S3Storage.class);
            when(mockS3.listObjects(anyString(), anyString())).thenReturn(fakeObjects);
            when(mockS3.getFile(anyString(), anyString())).thenThrow(new FileNotFoundException());

            ApiRequestProcessor requestProcessor = new ApiRequestProcessor(mockS3);

            assertThrows(FileNotFoundException.class, () -> requestProcessor.process(badEvent));
        });
    }
}
