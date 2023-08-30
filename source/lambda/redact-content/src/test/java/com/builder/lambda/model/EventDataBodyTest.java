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