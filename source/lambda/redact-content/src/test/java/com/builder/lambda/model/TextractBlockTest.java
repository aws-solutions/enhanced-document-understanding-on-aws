// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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

class TextractBlockTest {
    static String textractString;

    @BeforeAll
    public static void setup() throws Exception {
        Path textractFilePath = Path.of("src/test/java/resources/textract-detectText.json");
        textractString = Files.readString(textractFilePath);
    }

    @Test
    public void testTextractBlockData() {
        ArrayList<TextractDetectText> textractInference = new Gson().fromJson(textractString,
                new TypeToken<List<TextractDetectText>>() {
                }.getType());

        TextractBlock textractBlock = textractInference.get(0).getBlocks().get(1);
        assertEquals("LINE", textractBlock.getBlockType());
        assertEquals(99.52398681640625f, textractBlock.getConfidence());
        assertEquals("Amazon.com, Inc. is located in Seattle, WA", textractBlock.getText());
        assertNotNull(textractBlock.getGeometry());
        assertNotNull(textractBlock.getRelationships());
    }

    @Test
    public void testEqualsAndHashCode() {
        TextractBlock textractBlock = new TextractBlock();
        assertFalse(textractBlock.equals(null));
        assertFalse(textractBlock.equals(new Object()));

        ArrayList<TextractDetectText> textractInference = new Gson().fromJson(textractString,
                new TypeToken<List<TextractDetectText>>() {
                }.getType());

        textractBlock = textractInference.get(0).getBlocks().get(1);
        TextractBlock anotherTextractBlock = textractInference.get(0).getBlocks().get(1);

        assertTrue(textractBlock.equals(anotherTextractBlock) && anotherTextractBlock.equals(textractBlock));
        assertEquals(textractBlock.hashCode(), anotherTextractBlock.hashCode());
    }
}