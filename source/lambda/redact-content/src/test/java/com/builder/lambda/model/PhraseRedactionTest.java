// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package com.builder.lambda.model;

import com.google.gson.Gson;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PhraseRedactionTest {
    static String eventBody;

    @BeforeAll
    public static void setup() throws Exception {
        Path eventBodyFilePath = Path.of("src/test/java/resources/apiRequestBody.json");
        eventBody = Files.readString(eventBodyFilePath);
    }

    @Test
    public void testPhraseRedactionData() {
        ApiRequestBody apiRequestBody = new Gson().fromJson(eventBody, ApiRequestBody.class);
        PhraseRedaction phraseRedaction = apiRequestBody.getPhrases().get(0);
        assertEquals("to blenders Seattle", phraseRedaction.getText());
        assertEquals(2, phraseRedaction.getPages().size());
    }

    @Test
    public void testEqualsAndHashCode() throws Exception {
        PhraseRedaction phraseRedaction = new PhraseRedaction();
        assertFalse(phraseRedaction.equals(null));
        assertFalse(phraseRedaction.equals(new Object()));

        ApiRequestBody apiRequestBody = new Gson().fromJson(eventBody, ApiRequestBody.class);
        phraseRedaction = apiRequestBody.getPhrases().get(0);
        PhraseRedaction anotherPhraseRedaction = apiRequestBody.getPhrases().get(0);

        assertTrue(phraseRedaction.equals(anotherPhraseRedaction) && anotherPhraseRedaction.equals(phraseRedaction));
        assertEquals(phraseRedaction.hashCode(), anotherPhraseRedaction.hashCode());
    }
}