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

/**
 * Class representing the body of the API Gateway request for redaction. This
 * body is composed of 2 main sections: First the "entities" field contains a
 * nested structure describing the entities to be redacted, and second is the
 * "phrases" field which contains an array of objects indicating specific
 * phrases to be redacted.
 */
public class ApiRequestBody {
    private Map<String, Map<String, Map<String, List<Integer>>>> entities;
    private ArrayList<PhraseRedaction> phrases;

    public Map<String, Map<String, Map<String, List<Integer>>>> getEntities() {
        if (entities == null) {
            entities = new HashMap<>();
        }
        return entities;
    }

    public List<PhraseRedaction> getPhrases() {
        if (phrases == null) {
            phrases = new ArrayList<>();
        }
        return phrases;
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == null) {
            return false;
        }

        if (obj.getClass() != this.getClass()) {
            return false;
        }

        final ApiRequestBody other = (ApiRequestBody) obj;
        return phrases.equals(other.phrases) && entities.equals(other.entities);
    }

    @Override
    public int hashCode() {
        return phrases.hashCode() + entities.hashCode();
    }
}
