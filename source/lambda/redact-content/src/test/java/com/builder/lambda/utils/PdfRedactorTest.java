// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package com.builder.lambda.utils;

import com.builder.lambda.model.BoundingBox;
import com.builder.lambda.model.Document;
import com.builder.lambda.model.EntityDetails;
import com.builder.lambda.model.EventDataBody;
import com.builder.lambda.model.FileType;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.rendering.ImageType;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;

import java.io.ByteArrayOutputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Field;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;

public class PdfRedactorTest {
    static PdfRedactor pdfRedactor;
    static EventDataBody eventDataBody;
    static Map<String, List<BoundingBox>> boundingBoxesByPage = new HashMap<>();

    @BeforeAll
    public static void setUp() throws Exception {
        pdfRedactor = new PdfRedactor();
        Path filePath = Path.of("src/test/java/resources/eventBody1.json");
        String eventBody = Files.readString(filePath);
        eventDataBody = new Gson().fromJson(eventBody, EventDataBody.class);

        Path redactFilePath = Path.of("src/test/java/resources/redactData.json");
        String redactDataString = Files.readString(redactFilePath);
        Map<String, Map<String, Map<String, ArrayList<EntityDetails>>>> redactData = new Gson().fromJson(
                redactDataString, new TypeToken<Map<String, Map<String, Map<String, ArrayList<EntityDetails>>>>>() {
                }.getType());
        boundingBoxesByPage.put("1",
                redactData.get("DATE").get("10/23/20, 3:28 PM").get("1").get(0).getBoundingBoxes());
    }

    @Test
    public void testCheckPdfQualityEnvSetup() throws Exception {
        PdfRedactor redactor = new PdfRedactor();

        Field pdfQualityField = PdfRedactor.class.getDeclaredField("pdfQuality");
        pdfQualityField.setAccessible(true);
        Integer defaultPdfQuality = pdfQualityField.getInt(redactor);
        assertEquals(100, defaultPdfQuality);

        Field imageTypeField = PdfRedactor.class.getDeclaredField("imageType");
        imageTypeField.setAccessible(true);
        ImageType defaultImageType = (ImageType) imageTypeField.get(redactor);
        assertEquals(ImageType.RGB, defaultImageType);
    }

    @Test
    public void testProcessDocumentNullFile() {
        assertThrows(FileNotFoundException.class, () -> pdfRedactor.processDocument(
                new Document(null, FileType.PDF, "fake-case", "fake-doc"), boundingBoxesByPage));
    }

    @Test
    public void testProcessDocumentNullFileType() {
        InputStream mockInputStream = mock(InputStream.class);
        assertThrows(FileNotFoundException.class, () -> pdfRedactor.processDocument(
                new Document(mockInputStream, null, "fake-case", "fake-doc"), boundingBoxesByPage));
    }

    @Test
    public void testProcessDocumentSuccess() throws IOException {
        try (MockedStatic<PDDocument> mocked = Mockito.mockStatic(PDDocument.class, Mockito.CALLS_REAL_METHODS)) {
            PDDocument doc = new PDDocument();
            doc.addPage(new PDPage());
            InputStream mockInputStream = mock(InputStream.class);
            mocked.when(() -> PDDocument.load(any(InputStream.class))).thenReturn(doc);
            assertEquals(doc, PDDocument.load(mockInputStream)); // mocked
            assertEquals(1, doc.getPages().getCount());

            ByteArrayOutputStream output = pdfRedactor.processDocument(
                    new Document(mockInputStream, FileType.PDF, "fake-case", "fake-doc"), boundingBoxesByPage);
            assertNotNull(output);
            doc.close();
        }
    }

    @Test
    public void testProcessDocumentShouldThrowError() throws IOException {
        try (MockedStatic<PDDocument> mocked = Mockito.mockStatic(PDDocument.class, Mockito.CALLS_REAL_METHODS)) {
            PDDocument doc = new PDDocument();
            doc.addPage(new PDPage());
            InputStream mockInputStream = mock(InputStream.class);
            mocked.when(() -> PDDocument.load(any(InputStream.class))).thenThrow(IOException.class);

            assertThrows(IOException.class, () -> pdfRedactor.processDocument(
                    new Document(mockInputStream, FileType.PDF, "fake-case", "fake-doc"), boundingBoxesByPage));
            doc.close();
        }
    }
}
