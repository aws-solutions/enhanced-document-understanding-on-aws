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

class ApiRequestBodyTest {
    @Test
    public void testEqualsAndHashCode() throws Exception {
        ApiRequestBody apiRequestBody = new ApiRequestBody();
        assertFalse(apiRequestBody.equals(null));
        assertFalse(apiRequestBody.equals(new Object()));

        Path eventBodyFilePath = Path.of("src/test/java/resources/apiRequestBody.json");
        String eventBody = Files.readString(eventBodyFilePath);

        apiRequestBody = new Gson().fromJson(eventBody, ApiRequestBody.class);
        ApiRequestBody anotherApiRequestBody = new Gson().fromJson(eventBody, ApiRequestBody.class);
        assertTrue(apiRequestBody.equals(anotherApiRequestBody) && anotherApiRequestBody.equals(apiRequestBody));
        assertEquals(apiRequestBody.hashCode(), anotherApiRequestBody.hashCode());
    }

    public void testEntities() throws Exception {
        ApiRequestBody apiRequestBody = new ApiRequestBody();
        Path eventBodyFilePath = Path.of("src/test/java/resources/apiRequestBody-entities.json");
        String eventBody = Files.readString(eventBodyFilePath);
        apiRequestBody = new Gson().fromJson(eventBody, ApiRequestBody.class);

        assertEquals(apiRequestBody.getPhrases().size(), 0);
        assertEquals(apiRequestBody.getEntities().size(), 2);
    }

    public void testPhrases() throws Exception {
        ApiRequestBody apiRequestBody = new ApiRequestBody();
        Path eventBodyFilePath = Path.of("src/test/java/resources/apiRequestBody-phrases.json");
        String eventBody = Files.readString(eventBodyFilePath);
        apiRequestBody = new Gson().fromJson(eventBody, ApiRequestBody.class);

        assertEquals(apiRequestBody.getPhrases().size(), 0);
        assertEquals(apiRequestBody.getEntities().size(), 2);
    }
}