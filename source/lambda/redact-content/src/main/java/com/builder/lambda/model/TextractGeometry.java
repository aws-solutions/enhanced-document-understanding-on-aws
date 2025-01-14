// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package com.builder.lambda.model;

import com.google.gson.annotations.SerializedName;

public class TextractGeometry {
    @SerializedName("BoundingBox")
    private BoundingBox boundingBox;

    public BoundingBox getBoundingBox() {
        return boundingBox;
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == null) {
            return false;
        }

        if (obj.getClass() != this.getClass()) {
            return false;
        }

        final TextractGeometry other = (TextractGeometry) obj;
        return this.boundingBox.equals(other.boundingBox);
    }

    /**
     * Needed when equals is overridden. Generated definition.
     */
    @Override
    public int hashCode() {
        int hash = 7;
        hash = 31 * hash + (this.boundingBox != null ? this.boundingBox.hashCode() : 0);
        return hash;
    }
}
