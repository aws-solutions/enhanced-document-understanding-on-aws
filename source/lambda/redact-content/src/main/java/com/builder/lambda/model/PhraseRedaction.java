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

/**
 * Represents phrases to be redacted as requested from the API gateway input.
 * Specifies some text to be redacted, and which pages to apply that redaction
 * to.
 */
public class PhraseRedaction {
    private String text;
    private ArrayList<Integer> pages;

    public String getText() {
        return text;
    }

    public List<Integer> getPages() {
        return pages;
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == null) {
            return false;
        }

        if (obj.getClass() != this.getClass()) {
            return false;
        }

        final PhraseRedaction other = (PhraseRedaction) obj;
        return text.equals(other.text) && pages.equals(other.pages);
    }

    /**
     * Needed when equals is overridden. Generated definition.
     */
    @Override
    public int hashCode() {
        return text.hashCode() + pages.hashCode();
    }
}
