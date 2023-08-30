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
