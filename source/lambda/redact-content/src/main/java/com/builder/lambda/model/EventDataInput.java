// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package com.builder.lambda.model;

import java.util.HashMap;
import java.util.Map;

/**
 * Data class representing the input field from the parsed json received via the
 * "body" field in the SQS payload.
 */
public class EventDataInput {
    private String stage;
    private EventDataDocument document;
    private HashMap<String, String> inferences;

    // getters
    public String getStage() {
        return stage;
    }

    public EventDataDocument getDocument() {
        return document;
    }

    public Map<String, String> getInferences() {
        return inferences;
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == null) {
            return false;
        }

        if (obj.getClass() != this.getClass()) {
            return false;
        }

        final EventDataInput other = (EventDataInput) obj;
        return stage.equals(other.stage) && document.equals(other.document) && inferences.equals(other.inferences);
    }

    /**
     * Needed when equals is overridden. Generated definition.
     */
    @Override
    public int hashCode() {
        int hash = 7;
        hash = 31 * hash + stage.hashCode();
        hash = 31 * hash + document.hashCode();
        hash = 31 * hash + inferences.hashCode();
        return hash;
    }
}
