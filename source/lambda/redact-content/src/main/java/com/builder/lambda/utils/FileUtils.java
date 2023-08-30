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

import java.util.Map;
import java.util.Set;

import com.builder.lambda.model.FileType;

import static java.util.Map.entry;

public final class FileUtils {

    /**
     * Maps file extensions in lowercase, as they appear in a filename to the
     * FileType
     */
    public static final Map<String, FileType> EXTENSION_TO_TYPE_MAP = Map.ofEntries(
            entry("jpg", FileType.JPG),
            entry("jpeg", FileType.JPEG),
            entry("png", FileType.PNG),
            entry("pdf", FileType.PDF));

    /**
     * A set of the FileType's which are allowed for image redaction
     */
    public static final Set<FileType> SUPPORTED_IMAGE_TYPES = Set.of(FileType.JPEG, FileType.JPG, FileType.PNG);

    /**
     * Private constructor to hide default public constructor for utility class
     */
    private FileUtils() {
        throw new IllegalStateException("Utility class");
    }

    /**
     * @param fileName
     * @return FileType
     */
    public static FileType getFileType(String fileName) throws IllegalArgumentException {
        String extension = getFileExtension(fileName);
        FileType type;

        type = EXTENSION_TO_TYPE_MAP.get(extension.toLowerCase());
        if (type == null) {
            throw new IllegalArgumentException(
                    String.format("Extension '%s' is not supported for filename '%s'", extension, fileName));
        }
        return type;
    }

    public static String getFileExtension(String fileName) throws IllegalArgumentException {
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex > 0) {
            return fileName.substring(dotIndex + 1);
        } else {
            throw new IllegalArgumentException(
                    String.format("No extension found for file %s", fileName));
        }
    }
}
