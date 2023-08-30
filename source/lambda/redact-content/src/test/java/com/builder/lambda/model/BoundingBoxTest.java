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

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BoundingBoxTest {
    @Test
    public void testMergeBoundingBox() {
        BoundingBox boundingBox = new BoundingBox(5, 5, 0, 0);
        BoundingBox anotherBoundingBox = new BoundingBox(10, 5, 2, 2);
        boundingBox.merge(anotherBoundingBox);

        assertEquals(0, boundingBox.getLeft());
        assertEquals(0, boundingBox.getTop());
        assertEquals(7.0, boundingBox.getHeight());
        assertEquals(12.0, boundingBox.getWidth());
    }

    @Test
    public void testEqualsAndHashCode() {
        BoundingBox boundingBox = new BoundingBox(5, 5, 0, 0);
        assertFalse(boundingBox.equals(null));
        assertFalse(boundingBox.equals(new Object()));

        BoundingBox anotherBoundingBox = new BoundingBox(5, 5, 0, 0);
        assertTrue(boundingBox.equals(anotherBoundingBox) && anotherBoundingBox.equals(boundingBox));
        assertEquals(boundingBox.hashCode(), anotherBoundingBox.hashCode());
    }
}