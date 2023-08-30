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
import java.util.List;

/**
 * Data class representing the input.document field from the parsed json
 * received via the "body" field in the SQS payload.
 */
public class EventDataDocument {
    private String id;
    private String caseId;
    private String piiFlag;
    private String runTextractAnalyzeAction;
    private String selfCertifiedDocType;
    private String processingType;
    private String s3Bucket;
    private String s3Prefix;
    private ArrayList<String> documentWorkflow;
    private String uploadedFileExtension;
    private String uploadedFileName;

    // getters for all private members

    public String getId() {
        return id;
    }

    public String getCaseId() {
        return caseId;
    }

    public String getPiiFlag() {
        return piiFlag;
    }

    public String getRunTextractAnalyzeAction() {
        return runTextractAnalyzeAction;
    }

    public String getSelfCertifiedDocType() {
        return selfCertifiedDocType;
    }

    public String getProcessingType() {
        return processingType;
    }

    public String getS3Bucket() {
        return s3Bucket;
    }

    public String getS3Prefix() {
        return s3Prefix;
    }

    public List<String> getDocumentWorkflow() {
        return documentWorkflow;
    }

    public String getUploadedFileExtension() {
        return uploadedFileExtension;
    }

    public String getUploadedFileName() {
        return uploadedFileName;
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == null) {
            return false;
        }

        if (obj.getClass() != this.getClass()) {
            return false;
        }

        final EventDataDocument other = (EventDataDocument) obj;
        return id.equals(other.id) && caseId.equals(other.caseId) && piiFlag.equals(other.piiFlag)
                && runTextractAnalyzeAction.equals(other.runTextractAnalyzeAction)
                && selfCertifiedDocType.equals(other.selfCertifiedDocType)
                && processingType.equals(other.processingType) && s3Bucket.equals(other.s3Bucket)
                && s3Prefix.equals(other.s3Prefix)
                && documentWorkflow.equals(other.documentWorkflow)
                && uploadedFileExtension.equals(other.uploadedFileExtension)
                && uploadedFileName.equals(other.uploadedFileName);
    }

    /**
     * Needed when equals is overridden. Generated definition.
     */
    @Override
    public int hashCode() {
        int hash = 7;
        hash = 31 * hash + id.hashCode();
        hash = 31 * hash + caseId.hashCode();
        hash = 31 * hash + piiFlag.hashCode();
        hash = 31 * hash + runTextractAnalyzeAction.hashCode();
        hash = 31 * hash + selfCertifiedDocType.hashCode();
        hash = 31 * hash + processingType.hashCode();
        hash = 31 * hash + s3Bucket.hashCode();
        hash = 31 * hash + s3Prefix.hashCode();
        hash = 31 * hash + documentWorkflow.hashCode();
        hash = 31 * hash + uploadedFileExtension.hashCode();
        hash = 31 * hash + uploadedFileName.hashCode();

        return hash;
    }
}
