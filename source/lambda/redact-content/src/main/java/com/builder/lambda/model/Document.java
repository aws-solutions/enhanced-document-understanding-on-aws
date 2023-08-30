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

import java.io.FileNotFoundException;
import java.io.InputStream;

import com.builder.lambda.utils.Redactor;

/**
 * This is a data class which is being used to populate necessary redaction
 * related information before
 * passing it the {@link Redactor} class
 */
public class Document {
    public final InputStream fileInputStream;
    public final FileType fileType;
    public final String caseId;
    public final String docId;

    /**
     * Populate all relevant data for a single file
     *
     * @param fileInputStream file as InputStream
     * @param fileType        type of the file
     * @throws FileNotFoundException if the proved file or filetype is not found
     */
    public Document(InputStream fileInputStream, FileType fileType, String caseId, String docId)
            throws FileNotFoundException {
        this.fileInputStream = fileInputStream;
        this.fileType = fileType;
        this.caseId = caseId;
        this.docId = docId;

        this.validateDocument();
    }

    /**
     * This method validates the input file
     *
     * @throws FileNotFoundException if the input file or its type is not found
     */
    private void validateDocument() throws FileNotFoundException {
        if (this.fileInputStream == null) {
            throw new FileNotFoundException("File is not found! DocId: " + docId + "CaseId: " + caseId);
        }
        if (this.fileType == null) {
            throw new FileNotFoundException("File-type is not found! DocId: " + docId + "CaseId: " + caseId);
        }
    }
}
