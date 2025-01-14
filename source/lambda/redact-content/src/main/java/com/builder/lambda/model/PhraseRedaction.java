// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
