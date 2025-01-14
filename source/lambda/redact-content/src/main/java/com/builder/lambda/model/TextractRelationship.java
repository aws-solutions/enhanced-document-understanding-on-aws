// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package com.builder.lambda.model;

import java.util.ArrayList;
import java.util.List;
import com.google.gson.annotations.SerializedName;

public class TextractRelationship {
    @SerializedName("Type")
    private String type;

    @SerializedName("Ids")
    private ArrayList<String> ids;

    public String getType() {
        return type;
    }

    public List<String> getIds() {
        return ids;
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == null) {
            return false;
        }

        if (obj.getClass() != this.getClass()) {
            return false;
        }

        final TextractRelationship other = (TextractRelationship) obj;

        return type.equals(other.type) && ids.equals(other.ids);
    }

    /**
     * Needed when equals is overridden. Generated definition.
     */
    @Override
    public int hashCode() {
        return (type + ids).hashCode();
    }
}
