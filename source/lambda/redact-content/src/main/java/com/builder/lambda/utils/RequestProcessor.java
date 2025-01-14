// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package com.builder.lambda.utils;

import java.io.IOException;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import com.builder.lambda.model.FileType;

import software.amazon.lambda.powertools.logging.Logging;

public abstract class RequestProcessor<T> {
    protected Logger log = LogManager.getLogger(RequestProcessor.class);
    protected ImageRedactor imageRedactor = null;
    protected PdfRedactor pdfRedactor = null;

    protected final S3Storage s3;

    protected final String s3InputBucketName;
    protected final String s3InferenceBucketName;
    protected final String s3InputPrefix;
    protected final String s3OutputPrefix;

    protected RequestProcessor(S3Storage s3Storage) {
        this.s3 = s3Storage;

        s3InputBucketName = System.getenv("DOCUMENT_BUCKET_NAME");
        if (s3InputBucketName == null) {
            throw new IllegalStateException(
                    "The environment variable 'DOCUMENT_BUCKET_NAME' is not set, and is required.");
        }

        s3InferenceBucketName = System.getenv("S3_INFERENCE_BUCKET_NAME");
        if (s3InferenceBucketName == null) {
            throw new IllegalStateException(
                    "The environment variable 'S3_INFERENCE_BUCKET_NAME' is not set, and is required.");
        }

        s3InputPrefix = System.getenv("S3_UPLOAD_PREFIX");
        if (s3InputPrefix == null) {
            throw new IllegalStateException(
                    "The environment variable 'S3_UPLOAD_PREFIX' is not set, and is required.");
        }

        s3OutputPrefix = System.getenv("S3_REDACTED_PREFIX");
        if (s3OutputPrefix == null) {
            throw new IllegalStateException(
                    "The environment variable 'S3_REDACTED_PREFIX' is not set, and is required.");
        }
    }

    /**
     * Abstract method declaration for the function meant to process the incoming
     * event. Implemented in child classes.
     * 
     * @param event
     * @throws IOException
     * @throws IllegalArgumentException
     */
    public abstract void process(T event) throws IllegalArgumentException, IOException;

    /**
     * Factory method which creates/returns the redactor specific to the inputted
     * file type.
     * Re-uses instance of each redactor type
     *
     * @param fileType
     * @return Redactor
     * @throws IllegalArgumentException if the fileType provided is not supported
     */
    @Logging
    protected Redactor getRedactor(FileType fileType) {
        if (FileUtils.SUPPORTED_IMAGE_TYPES.contains(fileType)) {
            if (imageRedactor == null) {
                imageRedactor = new ImageRedactor();
            }
            return imageRedactor;
        } else if (fileType == FileType.PDF) {
            if (pdfRedactor == null) {
                pdfRedactor = new PdfRedactor();
            }
            return pdfRedactor;
        } else {
            throw new IllegalArgumentException("Unsupported FileType provided");
        }
    }

}
