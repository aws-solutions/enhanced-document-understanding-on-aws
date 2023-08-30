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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.google.gson.annotations.SerializedName;

/**
 * Representing a single pages textract-detectText inference result. See:
 * https://docs.aws.amazon.com/textract/latest/dg/API_DetectDocumentText.html
 */
public class TextractDetectText {

    @SerializedName("Blocks")
    private ArrayList<TextractBlock> blocks;
    @SerializedName("DocumentMetadata")
    private HashMap<String, Integer> documentMetadata;
    @SerializedName("DetectDocumentTextModelVersion")
    private String detectDocumentTextModelVersion;

    // getters
    public List<TextractBlock> getBlocks() {
        return blocks;
    }

    public Map<String, Integer> getDocumentMetadata() {
        return documentMetadata;
    }

    public String getDetectDocumentTextModelVersion() {
        return detectDocumentTextModelVersion;
    }

    /**
     * gets a block with the
     * 
     * @param id
     * @return
     */
    public TextractBlock getBlockWithId(String id) {
        for (TextractBlock block : blocks) {
            if (block.getId().equals(id)) {
                return block;
            }
        }
        return null;
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == null) {
            return false;
        }

        if (obj.getClass() != this.getClass()) {
            return false;
        }

        final TextractDetectText other = (TextractDetectText) obj;
        return blocks.equals(other.blocks) && documentMetadata.equals(other.documentMetadata)
                && detectDocumentTextModelVersion.equals(other.detectDocumentTextModelVersion);
    }

    /**
     * Needed when equals is overridden. Generated definition.
     */
    @Override
    public int hashCode() {
        int hash = 7;
        hash = 31 * hash + blocks.hashCode();
        hash = 31 * hash + documentMetadata.hashCode();
        hash = 31 * hash + detectDocumentTextModelVersion.hashCode();
        return hash;
    }
}
