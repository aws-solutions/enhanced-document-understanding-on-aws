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
import static org.junit.jupiter.api.Assertions.assertNotNull;

class EventDataInputTest {
    static String eventBody;

    @BeforeAll
    public static void setUp() throws Exception {
        Path eventBodyFilePath = Path.of("src/test/java/resources/eventBody1.json");
        eventBody = Files.readString(eventBodyFilePath);
    }

    @Test
    public void testEventDataInputData() {
        EventDataInput eventDataInput = new Gson().fromJson(eventBody, EventDataBody.class).getInput();
        assertEquals("entity", eventDataInput.getStage());
        assertNotNull(eventDataInput.getDocument());
        assertNotNull(eventDataInput.getInferences());
    }

    @Test
    public void testEqualsAndHashCode() {
        EventDataInput eventDataInput = new EventDataInput();
        assertFalse(eventDataInput.equals(null));
        assertFalse(eventDataInput.equals(new Object()));

        EventDataBody eventDataBody = new Gson().fromJson(eventBody, EventDataBody.class);

        eventDataInput = eventDataBody.getInput();
        EventDataInput anotherEventDataInput = eventDataBody.getInput();

        assertTrue(eventDataInput.equals(anotherEventDataInput) && anotherEventDataInput.equals(eventDataInput));
        assertEquals(eventDataInput.hashCode(), anotherEventDataInput.hashCode());
    }
}