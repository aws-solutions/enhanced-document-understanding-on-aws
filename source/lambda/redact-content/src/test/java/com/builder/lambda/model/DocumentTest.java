// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package com.builder.lambda.model;

import com.google.gson.Gson;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.io.FileNotFoundException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

class DocumentTest {
    static EventDataBody eventDataBody;
    static InputStream mockInputStream;
    static Map<String, Map<String, Map<String, ArrayList<EntityDetails>>>> redactData;
    static List<Map<String, Map<String, Map<String, ArrayList<EntityDetails>>>>> redactDataList;

    @BeforeAll
    public static void setUp() throws Exception {
        mockInputStream = mock(InputStream.class);
        Path filePath = Path.of("src/test/java/resources/eventBody1.json");
        String eventBody = Files.readString(filePath);
        eventDataBody = new Gson().fromJson(eventBody, EventDataBody.class);
    }

    @Test
    public void testShouldSuccessWhenProvidedValidFileData() throws FileNotFoundException {
        Document document = new Document(mockInputStream, FileType.PDF, "fake-case", "fake-doc");
        assertEquals(mockInputStream, document.fileInputStream);
        assertEquals(FileType.PDF, document.fileType);
    }

    @Test
    public void testShouldFailWhenProvidedInvalidFileData() {
        assertThrows(FileNotFoundException.class, () -> new Document(null, FileType.PDF, "fake-case", "fake-doc"));
        assertThrows(FileNotFoundException.class, () -> new Document(mockInputStream, null, "fake-case", "fake-doc"));
    }
}