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