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

class TextractGeometryTest {
    static String textractString;

    @BeforeAll
    public static void setup() throws Exception {
        Path textractFilePath = Path.of("src/test/java/resources/textract-detectText.json");
        textractString = Files.readString(textractFilePath);
    }

    @Test
    public void testTextractGeometryData() {
        ArrayList<TextractDetectText> textractInference = new Gson().fromJson(textractString,
                new TypeToken<List<TextractDetectText>>() {
                }.getType());

        TextractGeometry textractGeometry = textractInference.get(0).getBlocks().get(1).getGeometry();
        assertNotNull(textractGeometry.getBoundingBox());
    }

    @Test
    public void testEqualsAndHashCode() {
        TextractGeometry textractGeometry = new TextractGeometry();
        assertFalse(textractGeometry.equals(null));
        assertFalse(textractGeometry.equals(new Object()));

        ArrayList<TextractDetectText> textractInference = new Gson().fromJson(textractString,
                new TypeToken<List<TextractDetectText>>() {
                }.getType());

        textractGeometry = textractInference.get(0).getBlocks().get(1).getGeometry();
        TextractGeometry anotherTextractGeometry = textractInference.get(0).getBlocks().get(1).getGeometry();

        assertTrue(
                textractGeometry.equals(anotherTextractGeometry) && anotherTextractGeometry.equals(textractGeometry));
        assertEquals(textractGeometry.hashCode(), anotherTextractGeometry.hashCode());
    }
}