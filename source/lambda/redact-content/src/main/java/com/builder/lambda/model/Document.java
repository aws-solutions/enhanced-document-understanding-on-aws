// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
