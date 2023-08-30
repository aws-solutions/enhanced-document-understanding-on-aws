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
import com.google.gson.reflect.TypeToken;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class TextractDetectTextTest {
    static String textractString;

    @BeforeAll
    public static void setup() throws Exception {
        Path textractFilePath = Path.of("src/test/java/resources/textract-detectText.json");
        textractString = Files.readString(textractFilePath);
    }

    @Test
    public void testTextractDetectTextData() {
        ArrayList<TextractDetectText> textractInference = new Gson().fromJson(textractString,
                new TypeToken<List<TextractDetectText>>() {
                }.getType());

        TextractDetectText textractDetectText = textractInference.get(0);
        assertEquals("1.0", textractDetectText.getDetectDocumentTextModelVersion());
        assertTrue(textractDetectText.getBlocks().size() > 0);
        assertNotNull(textractDetectText.getDocumentMetadata());
        assertNotNull(textractDetectText.getBlockWithId("980fcd2b-1725-4260-be0d-5175cbd34e5c"));
        assertNull(textractDetectText.getBlockWithId("invalid-id"));
    }

    @Test
    public void testEqualsAndHashCode() {
        TextractDetectText textractDetectText = new TextractDetectText();
        assertFalse(textractDetectText.equals(null));
        assertFalse(textractDetectText.equals(new Object()));

        ArrayList<TextractDetectText> textractInference = new Gson().fromJson(textractString,
                new TypeToken<List<TextractDetectText>>() {
                }.getType());

        textractDetectText = textractInference.get(0);
        TextractDetectText anotherTextractDetectText = textractInference.get(0);

        assertTrue(textractDetectText.equals(anotherTextractDetectText)
                && anotherTextractDetectText.equals(textractDetectText));
        assertEquals(textractDetectText.hashCode(), anotherTextractDetectText.hashCode());
    }
}