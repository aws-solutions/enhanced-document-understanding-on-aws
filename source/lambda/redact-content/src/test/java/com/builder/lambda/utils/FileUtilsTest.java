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
**********************************************************************************************************************/

package com.builder.lambda.utils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

import com.builder.lambda.model.FileType;

public class FileUtilsTest {
    @Test
    public void testGetFileTypeSuccess() throws Exception {
        String[] fileNamesToCheck = { "test.jpg", "test.jpeg", "test.png", "test.pdf", "test.jpg.pdf" };
        FileType[] expectedTypes = { FileType.JPG, FileType.JPEG, FileType.PNG, FileType.PDF, FileType.PDF };
        for (int i = 0; i < fileNamesToCheck.length; i++) {
            FileType type = FileUtils.getFileType(fileNamesToCheck[i]);
            assertEquals(type, expectedTypes[i]);
        }
    }

    @Test
    public void testGetFileTypeFailureBadExtension() throws Exception {
        assertThrows(IllegalArgumentException.class, () -> FileUtils.getFileType("test.bad"));
    }

    @Test
    public void testGetFileTypeFailureNoExtension() throws Exception {
        assertThrows(IllegalArgumentException.class, () -> FileUtils.getFileType("no extension"));
    }
}
