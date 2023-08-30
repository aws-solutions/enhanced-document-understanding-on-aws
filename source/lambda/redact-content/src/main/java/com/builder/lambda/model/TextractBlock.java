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

import java.util.ArrayList;
import java.util.List;

import com.google.gson.annotations.SerializedName;

public class TextractBlock {
    @SerializedName("BlockType")
    private String blockType;

    @SerializedName("Confidence")
    private Float confidence;

    @SerializedName("Text")
    private String text;

    @SerializedName("Geometry")
    private TextractGeometry geometry;

    @SerializedName("Id")
    private String id;

    @SerializedName("Relationships")
    private ArrayList<TextractRelationship> relationships;

    public String getBlockType() {
        return blockType;
    }

    public Float getConfidence() {
        return confidence;
    }

    public String getText() {
        return text;
    }

    public TextractGeometry getGeometry() {
        return geometry;
    }

    public String getId() {
        return id;
    }

    public List<TextractRelationship> getRelationships() {
        return relationships;
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == null) {
            return false;
        }

        if (obj.getClass() != this.getClass()) {
            return false;
        }

        final TextractBlock other = (TextractBlock) obj;
        return blockType.equals(other.blockType) && confidence.equals(other.confidence) && text.equals(other.text)
                && geometry.equals(other.geometry) && id.equals(other.id) && relationships.equals(other.relationships);
    }

    /**
     * Needed when equals is overridden. Generated definition.
     */
    @Override
    public int hashCode() {
        int hash = 7;
        hash = 31 * hash + blockType.hashCode();
        hash = 31 * hash + (confidence == null ? 0 : confidence.hashCode());
        hash = 31 * hash + (text == null ? 0 : text.hashCode());
        hash = 31 * hash + (geometry == null ? 0 : geometry.hashCode());
        hash = 31 * hash + (id == null ? 0 : id.hashCode());
        hash = 31 * hash + (relationships == null ? 0 : relationships.hashCode());
        return hash;
    }
}
