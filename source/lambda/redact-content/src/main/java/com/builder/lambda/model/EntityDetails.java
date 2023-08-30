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

import com.google.gson.annotations.SerializedName;

import java.util.ArrayList;
import java.util.List;

/**
 * Representing the "EntityDetails" of a single entity instance in an
 * <entity-type>-locations inference (as computed by the entity-detection
 * lambda).
 */
public class EntityDetails {
    @SerializedName("Score")
    private double score;
    @SerializedName("BoundingBoxes")
    private ArrayList<BoundingBox> boundingBoxes;

    // add getters
    public double getScore() {
        return score;
    }

    public List<BoundingBox> getBoundingBoxes() {
        return boundingBoxes;
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == null) {
            return false;
        }

        if (obj.getClass() != this.getClass()) {
            return false;
        }

        final EntityDetails other = (EntityDetails) obj;
        return other.score == this.score && other.boundingBoxes.equals(this.boundingBoxes);
    }

    @Override
    public int hashCode() {
        return (int) (score * 100) + boundingBoxes.hashCode();
    }
}
