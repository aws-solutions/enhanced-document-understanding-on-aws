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

class TextractRelationshipTest {
        static String textractString;

        @BeforeAll
        public static void setup() throws Exception {
                Path textractFilePath = Path.of("src/test/java/resources/textract-detectText.json");
                textractString = Files.readString(textractFilePath);
        }

        @Test
        public void testTextractRelationshipData() {
                ArrayList<TextractDetectText> textractInference = new Gson().fromJson(textractString,
                                new TypeToken<List<TextractDetectText>>() {
                                }.getType());

                TextractRelationship textractRelationship = textractInference.get(0).getBlocks().get(1)
                                .getRelationships().get(0);
                assertEquals("CHILD", textractRelationship.getType());
                assertEquals(7, textractRelationship.getIds().size());
        }

        @Test
        public void testEqualsAndHashCode() {
                TextractRelationship textractRelationship = new TextractRelationship();
                assertFalse(textractRelationship.equals(null));
                assertFalse(textractRelationship.equals(new Object()));

                ArrayList<TextractDetectText> textractInference = new Gson().fromJson(textractString,
                                new TypeToken<List<TextractDetectText>>() {
                                }.getType());

                textractRelationship = textractInference.get(0).getBlocks().get(1).getRelationships().get(0);
                TextractRelationship anotherTextractRelationship = textractInference.get(0).getBlocks().get(1)
                                .getRelationships().get(0);

                assertTrue(textractRelationship.equals(anotherTextractRelationship) &&
                                anotherTextractRelationship.equals(textractRelationship));
                assertEquals(textractRelationship.hashCode(), anotherTextractRelationship.hashCode());
        }
}