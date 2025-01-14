// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package com.builder.lambda.model;

import com.google.gson.Gson;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EventDataBodyTest {
    @Test
    public void testEqualsAndHashCode() throws Exception {
        EventDataBody eventDataBody = new EventDataBody();
        assertFalse(eventDataBody.equals(null));
        assertFalse(eventDataBody.equals(new Object()));

        Path filePath = Path.of("src/test/java/resources/eventBody1.json");
        String eventBody = Files.readString(filePath);
        eventDataBody = new Gson().fromJson(eventBody, EventDataBody.class);
        EventDataBody anotherEventDataBody = new Gson().fromJson(eventBody, EventDataBody.class);

        assertTrue(eventDataBody.equals(anotherEventDataBody) && anotherEventDataBody.equals(eventDataBody));
        assertEquals(eventDataBody.hashCode(), anotherEventDataBody.hashCode());
    }
}