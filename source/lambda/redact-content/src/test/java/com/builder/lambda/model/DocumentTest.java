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
 *********************************************************************************************************************/

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