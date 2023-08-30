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
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class EntityDetailsTest {
    static String redactDataString;

    @BeforeAll
    public static void setUp() throws Exception {
        Path redactFilePath = Path.of("src/test/java/resources/redactData.json");
        redactDataString = Files.readString(redactFilePath);
    }

    @Test
    public void testEntityDetailsData() {
        Map<String, Map<String, Map<String, ArrayList<EntityDetails>>>> redactData = new Gson().fromJson(
                redactDataString, new TypeToken<Map<String, Map<String, Map<String, ArrayList<EntityDetails>>>>>() {
                }.getType());

        EntityDetails entityDetails = redactData.get("DATE").get("10/23/20, 3:28 PM").get("1").get(0);
        assertTrue(entityDetails.getScore() > -1);
        assertNotNull(entityDetails.getBoundingBoxes());
    }

    @Test
    public void testEqualsAndHashCode() {
        EntityDetails entityDetails = new EntityDetails();
        assertFalse(entityDetails.equals(null));
        assertFalse(entityDetails.equals(new Object()));

        Map<String, Map<String, Map<String, ArrayList<EntityDetails>>>> redactData = new Gson().fromJson(
                redactDataString, new TypeToken<Map<String, Map<String, Map<String, ArrayList<EntityDetails>>>>>() {
                }.getType());

        entityDetails = redactData.get("DATE").get("10/23/20, 3:28 PM").get("1").get(0);
        EntityDetails anotherEntityDetails = redactData.get("DATE").get("10/23/20, 3:28 PM").get("1").get(0);

        assertTrue(entityDetails.equals(anotherEntityDetails) && anotherEntityDetails.equals(entityDetails));
        assertEquals(anotherEntityDetails.hashCode(), anotherEntityDetails.hashCode());
    }
}