// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package com.builder.lambda.utils;

import com.builder.lambda.model.BoundingBox;
import com.builder.lambda.model.Document;
import com.builder.lambda.model.EntityDetails;
import com.builder.lambda.model.EventDataBody;
import com.builder.lambda.model.FileType;
import com.drew.imaging.ImageMetadataReader;
import com.drew.imaging.ImageProcessingException;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifIFD0Directory;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class ImageRedactorTest {
    static ImageRedactor imageRedactor;
    static EventDataBody eventDataBody;
    static Map<String, List<BoundingBox>> boundingBoxesByPage = new HashMap<>();

    @BeforeAll
    public static void setUp() throws Exception {
        imageRedactor = new ImageRedactor();
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
    public void testImageLoading() throws IOException, ImageProcessingException {
        int expectedWidth = 4032;
        int expectedHeight = 3024;
        File imgFile = new File("src/test/java/resources/patient_intake_form_sample.jpg");

        try (MockedStatic<ImageMetadataReader> mockedImageMetadataReader = Mockito.mockStatic(ImageMetadataReader.class,
                Mockito.CALLS_REAL_METHODS)) {
            // ensuring the other orientation tags work
            for (int i = 0; i <= 8; i++) {
                final InputStream imgStream = new FileInputStream(imgFile);
                Document imgDoc = new Document(imgStream, FileType.JPG, "fake-case", "fake-doc");

                // setting up the mock data to be returned
                Metadata fakeMetadata = new Metadata();
                ExifIFD0Directory exifIFD0Directory = new ExifIFD0Directory();
                exifIFD0Directory.setInt(ExifIFD0Directory.TAG_ORIENTATION, i);
                fakeMetadata.addDirectory(exifIFD0Directory);

                mockedImageMetadataReader.when(() -> ImageMetadataReader.readMetadata(any(InputStream.class)))
                        .thenReturn(fakeMetadata);

                BufferedImage rotatedImg = imageRedactor.loadImageWithCorrection(imgDoc);
                // no changes to dims
                if (i < 5) {
                    assertEquals(rotatedImg.getWidth(), expectedWidth);
                    assertEquals(rotatedImg.getHeight(), expectedHeight);
                } // odd number rotations flip dims
                else {
                    assertEquals(rotatedImg.getWidth(), expectedHeight);
                    assertEquals(rotatedImg.getHeight(), expectedWidth);
                }
            }
        }
    }

    @Test
    public void testImageLoadingWithExifFailure() throws IOException, ImageProcessingException {
        int expectedWidth = 4032;
        int expectedHeight = 3024;
        File imgFile = new File("src/test/java/resources/patient_intake_form_sample.jpg");

        try (MockedStatic<ImageMetadataReader> mockedImageMetadataReader = Mockito.mockStatic(ImageMetadataReader.class,
                Mockito.CALLS_REAL_METHODS)) {
            // ensuring the other orientation tags work
            for (int i = 0; i <= 8; i++) {
                final InputStream imgStream = new FileInputStream(imgFile);
                Document imgDoc = new Document(imgStream, FileType.JPG, "fake-case", "fake-doc");

                mockedImageMetadataReader.when(() -> ImageMetadataReader.readMetadata(any(InputStream.class)))
                        .thenThrow(new RuntimeException("fake error"));

                // should have loaded just the image without taking into acount orientation
                BufferedImage rotatedImg = imageRedactor.loadImageWithCorrection(imgDoc);
                assertEquals(rotatedImg.getWidth(), expectedWidth);
                assertEquals(rotatedImg.getHeight(), expectedHeight);
            }
        }
    }

    @Test
    public void testProcessDocumentNullFile() {
        assertThrows(FileNotFoundException.class, () -> imageRedactor.processDocument(
                new Document(null, FileType.PNG, "case-id", "doc-id"), mock()));
    }

    @Test
    public void testProcessDocumentNullFileType() {
        InputStream mockInputStream = mock(InputStream.class);
        assertThrows(FileNotFoundException.class, () -> imageRedactor.processDocument(
                new Document(mockInputStream, null, "case-id", "doc-id"), boundingBoxesByPage));
    }

    @Test
    public void testProcessDocumentShouldPassWithoutError() throws IOException {
        try (MockedStatic<ImageIO> mockedImageIO = Mockito.mockStatic(ImageIO.class, Mockito.CALLS_REAL_METHODS)) {
            InputStream mockInputStream = mock(InputStream.class);
            BufferedImage bufferedImage = mock(BufferedImage.class);
            Graphics2D graphics = mock(Graphics2D.class);
            mockedImageIO.when(() -> ImageIO.read(any(InputStream.class))).thenReturn(bufferedImage);
            mockedImageIO.when(() -> ImageIO.write(any(), anyString(), any(ByteArrayOutputStream.class)))
                    .thenReturn(true);
            when(bufferedImage.createGraphics()).thenReturn(graphics);

            imageRedactor.processDocument(
                    new Document(mockInputStream, FileType.PNG, "case-id", "doc-id"),
                    boundingBoxesByPage);
        }
    }

    @Test
    public void testProcessDocumentShouldThrowError() {
        try (MockedStatic<ImageIO> mockedImageIO = Mockito.mockStatic(ImageIO.class, Mockito.CALLS_REAL_METHODS)) {
            InputStream mockInputStream = mock(InputStream.class);
            BufferedImage bufferedImage = mock(BufferedImage.class);
            Graphics2D graphics = mock(Graphics2D.class);
            mockedImageIO.when(() -> ImageIO.read(any(InputStream.class))).thenThrow(IOException.class);
            when(bufferedImage.createGraphics()).thenReturn(graphics);

            assertThrows(IOException.class, () -> imageRedactor.processDocument(
                    new Document(mockInputStream, FileType.PNG, "case-id", "doc-id"), boundingBoxesByPage));
        }
    }
}
