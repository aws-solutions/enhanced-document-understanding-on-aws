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
