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

import com.google.gson.Gson;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EventDataDocumentTest {
    static String eventBodyDocumentString;

    @BeforeAll
    public static void setup() {
        eventBodyDocumentString = "{\"caseId\": \"fakeCaseId\",\"id\": \"fakeDocId1\",\"selfCertifiedDocType\": \"Paystub\",\"s3Bucket\": \"fake-bucket\",\"s3Prefix\": \"fake-prefix/file1.jpg\",\"piiFlag\": false,\"processingType\": \"sync\",\"runTextractAnalyzeAction\": true,\"documentWorkflow\": [\"textract\",\"entity-standard\",\"entity-pii\",\"entity-medical\",\"redaction\"],\"uploadedFileExtension\": \".jpg\",\"uploadedFileName\": \"file1.jpg\"}";

    }

    @Test
    public void testEventDataDocumentData() {
        EventDataDocument eventDataDocument = new Gson().fromJson(eventBodyDocumentString, EventDataDocument.class);
        assertEquals("fakeCaseId", eventDataDocument.getCaseId());
        assertEquals("fakeDocId1", eventDataDocument.getId());
        assertEquals("fake-prefix/file1.jpg", eventDataDocument.getS3Prefix());
        assertEquals("Paystub", eventDataDocument.getSelfCertifiedDocType());
        assertEquals("false", eventDataDocument.getPiiFlag());
        assertEquals("sync", eventDataDocument.getProcessingType());
        assertEquals("true", eventDataDocument.getRunTextractAnalyzeAction());
        assertEquals("fake-bucket", eventDataDocument.getS3Bucket());
        assertEquals(".jpg", eventDataDocument.getUploadedFileExtension());
        assertEquals("file1.jpg", eventDataDocument.getUploadedFileName());
        assertEquals(5, eventDataDocument.getDocumentWorkflow().size());
    }

    @Test
    public void testEqualsAndHashCode() {
        EventDataDocument eventDataDocument = new EventDataDocument();
        assertFalse(eventDataDocument.equals(null));
        assertFalse(eventDataDocument.equals(new Object()));

        eventDataDocument = new Gson().fromJson(eventBodyDocumentString, EventDataDocument.class);
        EventDataDocument anotherEventDataDocument = new Gson().fromJson(eventBodyDocumentString,
                EventDataDocument.class);

        assertTrue(eventDataDocument.equals(anotherEventDataDocument)
                && anotherEventDataDocument.equals(eventDataDocument));
        assertEquals(eventDataDocument.hashCode(), anotherEventDataDocument.hashCode());
    }
}