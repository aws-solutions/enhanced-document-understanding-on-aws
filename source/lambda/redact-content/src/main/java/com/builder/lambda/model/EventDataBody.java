// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package com.builder.lambda.model;

/**
 * Data class representing the json-encoded content in the "body" field of the
 * incoming SQS message. References nested classes.
 */
public class EventDataBody {
    private String taskToken;
    private EventDataInput input;

    public String getTaskToken() {
        return taskToken;
    }

    public EventDataInput getInput() {
        return input;
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == null) {
            return false;
        }

        if (obj.getClass() != this.getClass()) {
            return false;
        }

        final EventDataBody other = (EventDataBody) obj;
        return taskToken.equals(other.taskToken) && input.equals(other.input);
    }

    @Override
    public int hashCode() {
        return (taskToken + input).hashCode();
    }
}
