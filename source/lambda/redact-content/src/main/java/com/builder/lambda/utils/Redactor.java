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

package com.builder.lambda.utils;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Map;

import com.builder.lambda.model.BoundingBox;
import com.builder.lambda.model.Document;

/**
 * This is the base interface for redaction. Any type of Redaction class
 * implements this interface
 */
public interface Redactor {
    /**
     * This method will be called to apply redaction on a document.
     *
     * @param document            to be used to apply redactions on
     * @param boundingBoxesByPage to be used to identify the texts to be reacted on
     *                            the document
     * @return redacted document as a stream
     * @throws IOException if processing the document goes wrong
     */
    ByteArrayOutputStream processDocument(
            Document document,
            Map<String, List<BoundingBox>> boundingBoxesByPage) throws IOException;
}
