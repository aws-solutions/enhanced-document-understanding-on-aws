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

import org.apache.pdfbox.rendering.ImageType;

public final class Constants {
    /**
     * Default image rendering quality for pdf redaction, the value represents the
     * DPI.
     */
    public static final int DEFAULT_PDF_QUALITY = 100;

    /**
     * Default image rendering type for pdf redaction.
     */
    public static final ImageType DEFAULT_IMAGE_TYPE = ImageType.RGB;

    /**
     * The inference containing the textract detectText
     */
    public static final String TEXTRACT_DETECT_TEXT_INFERENCE_NAME = "textract-detectText.json";

    /**
     * CloudWatch Metric constants for Redaction API. Note: these constants are also defined in the
     * lambda 'common-node-lib' layer, and they are used to create the CloudWatch metrics dashboard.
     * It is important to note that the namespace, metric names and dimensions are defined in
     * 'common-node-lib' and here are consistent.
     */
    public static final String NAMESPACE_WORKFLOW_TYPES = "Workflows";
    public static final String METRIC_NAME = "RedactionWorkflow";
    public static final String DIMENSION_NAME = "RedactionAPI";
    public static final String REDACT_DOCUMENT_SUCCESS = "RedactDocument";
    public static final String REDACT_DOCUMENT_FAILURE = "Redaction-Failures";

    /**
     * The number of metrics data points to be aggregated in the CloudWatch metrics.
     * Note: this is value is set to 1 because the Redaction API is not designed to
     * handle 1 document at a time.
     */
    public static final double METRICS_DATA_COUNT = 1;

    /**
     * Private constructor to hide default public constructor for utility class
     */
    private Constants() {
        throw new IllegalStateException("Utility class");
    }
}
