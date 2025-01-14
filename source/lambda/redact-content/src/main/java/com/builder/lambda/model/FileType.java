// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package com.builder.lambda.model;

/**
 * This enum file defines different types of input documents as constants.
 * The redaction lambda will only process these type of files, throws error
 * otherwise
 */
public enum FileType {
    PDF,
    JPEG,
    JPG,
    PNG;
}
