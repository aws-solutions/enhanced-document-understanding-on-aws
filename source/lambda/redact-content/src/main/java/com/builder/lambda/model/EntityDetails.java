// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
