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

/**
 * Representing the "BoundingBoxes" field of a single entity instance in an
 * <entity-type>-locations inference (as computed by the entity-detection
 * lambda).
 */
public class BoundingBox {
    private static final double COMPARISON_THRESHOLD = 1E-5;

    @SerializedName("Width")
    private double width;
    @SerializedName("Height")
    private double height;
    @SerializedName("Left")
    private double left;
    @SerializedName("Top")
    private double top;

    public BoundingBox(double width, double height, double left, double top) {
        this.width = width;
        this.height = height;
        this.left = left;
        this.top = top;
    }

    public double getWidth() {
        return width;
    }

    public double getHeight() {
        return height;
    }

    public double getLeft() {
        return left;
    }

    public double getTop() {
        return top;
    }

    /**
     * Merges this bounding box with another, resulting in this instance now
     * enclosing both its old boundaries and the passed bounding box.
     * 
     * @param other
     */
    public void merge(BoundingBox other) {
        if (other == null) {
            return;
        }

        double newLeft = Math.min(left, other.left);
        double newTop = Math.min(top, other.top);
        double newRight = Math.max(left + width, other.left + other.width);
        double newBottom = Math.max(top + height, other.top + other.height);

        left = newLeft;
        top = newTop;
        width = newRight - newLeft;
        height = newBottom - newTop;
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == null) {
            return false;
        }

        if (obj.getClass() != this.getClass()) {
            return false;
        }

        final BoundingBox other = (BoundingBox) obj;
        return Math.abs(width - other.width) < COMPARISON_THRESHOLD
                && Math.abs(height - other.height) < COMPARISON_THRESHOLD
                && Math.abs(left - other.left) < COMPARISON_THRESHOLD
                && Math.abs(top - other.top) < COMPARISON_THRESHOLD;
    }

    @Override
    public int hashCode() {
        return (int) (width * 100 + height * 100 + left * 100 + top * 100);
    }
}