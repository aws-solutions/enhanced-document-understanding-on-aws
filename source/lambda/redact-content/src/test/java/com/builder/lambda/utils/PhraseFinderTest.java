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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

import com.builder.lambda.model.BoundingBox;
import com.builder.lambda.model.TextractDetectText;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

public class PhraseFinderTest {
    private static PhraseFinder phraseFinder;
    private static MockedStatic<LogManager> mockLogManager;

    @BeforeAll
    public static void setUp() throws IOException {
        // loading the test data from the json file
        Path textractFilePath = Path.of("src/test/java/resources/textract-detectText.json");
        String textractString = Files.readString(textractFilePath);
        ArrayList<TextractDetectText> textractInference = new Gson().fromJson(textractString,
                new TypeToken<List<TextractDetectText>>() {
                }.getType());

        phraseFinder = new PhraseFinder(textractInference);

        // mocking the logger
        mockLogManager = mockStatic(LogManager.class);
        final Logger logger = mock(Logger.class);
        mockLogManager.when(() -> LogManager.getLogger(any(Class.class))).thenReturn(logger);
    }

    @BeforeEach
    public void clear() throws Exception {
    }

    @AfterAll
    public static void tearDown() throws Exception {
        mockLogManager.close();
    }

    @Test
    public void testFindPhraseBoundingBoxes_Success() throws Exception {
        Map<String, List<BoundingBox>> boundingBoxes = phraseFinder.findPhraseBoundingBoxes("is located in Seattle",
                Arrays.asList(1, 2));
        BoundingBox expectedBoundingBox = new BoundingBox(.24222, 0.060148, 0.280634, 0.200699);
        Assertions.assertEquals(2, boundingBoxes.size());
        Assertions.assertEquals(boundingBoxes.get("1").size(), boundingBoxes.get("2").size());
        Assertions.assertEquals(expectedBoundingBox, boundingBoxes.get("1").get(0));
        Assertions.assertEquals(expectedBoundingBox, boundingBoxes.get("2").get(0));
    }

    @Test
    public void testFindPhraseBoundingBoxes_SuccessSinglePage() throws Exception {
        Map<String, List<BoundingBox>> boundingBoxes = phraseFinder.findPhraseBoundingBoxes("is located in Seattle",
                Arrays.asList(2));
        BoundingBox expectedBoundingBox = new BoundingBox(.24222, 0.060148, 0.280634, 0.200699);
        Assertions.assertEquals(1, boundingBoxes.size());
        Assertions.assertEquals(expectedBoundingBox, boundingBoxes.get("2").get(0));
    }

    @Test
    public void testFindPhraseBoundingBoxesOnPage_SuccessSingle() throws Exception {
        List<BoundingBox> boundingBoxes = phraseFinder.findPhraseBoundingBoxesOnPage("is located in Seattle", 0);
        BoundingBox expectedBoundingBox = new BoundingBox(.24222, 0.060148, 0.280634, 0.200699);
        Assertions.assertEquals(1, boundingBoxes.size());
        Assertions.assertEquals(expectedBoundingBox, boundingBoxes.get(0));
    }

    @Test
    public void testFindPhraseBoundingBoxesOnPage_SuccessMultiLine() throws Exception {
        List<BoundingBox> boundingBoxes = phraseFinder.findPhraseBoundingBoxesOnPage("to blenders Seattle", 0);
        BoundingBox expectedBoundingBox1 = new BoundingBox(.142247, 0.052656, 0.803834, 0.525217);
        BoundingBox expectedBoundingBox2 = new BoundingBox(0.0803089, 0.04780400, 0.0752244, 0.682288);
        Assertions.assertEquals(2, boundingBoxes.size());
        Assertions.assertEquals(expectedBoundingBox1, boundingBoxes.get(0));
        Assertions.assertEquals(expectedBoundingBox2, boundingBoxes.get(1));
    }

    @Test
    public void testFindPhraseBoundingBoxesOnPage_NoPhrase() throws Exception {
        List<BoundingBox> boundingBoxes = phraseFinder.findPhraseBoundingBoxesOnPage("not a phrase", 0);
        Assertions.assertEquals(0, boundingBoxes.size());
    }

    @Test
    public void testFindAllPhraseOffsets_Success() throws Exception {
        // single phrase
        List<Integer> offsets = phraseFinder.findAllPhraseStartOffsets("is located in Seattle", 0);
        Assertions.assertEquals(1, offsets.size());
        Assertions.assertEquals(17, offsets.get(0));

        // phrase appearing multiple times
        offsets = phraseFinder.findAllPhraseStartOffsets("is", 0);
        List<Integer> expected = Arrays.asList(17, 164);
        Assertions.assertIterableEquals(offsets, expected);

        // on 2nd page
        offsets = phraseFinder.findAllPhraseStartOffsets("is located in Seattle", 1);
        Assertions.assertEquals(1, offsets.size());
        Assertions.assertEquals(17, offsets.get(0));
    }

    @Test
    public void testFindAllPhraseOffsets_NoPhrase() throws Exception {
        List<Integer> offsets = phraseFinder.findAllPhraseStartOffsets("not a phrase", 0);
        Assertions.assertEquals(0, offsets.size());
    }

    @Test
    public void testFindAllPhraseOffsets_IndexOutOfBounds() throws Exception {
        Assertions.assertThrows(IndexOutOfBoundsException.class,
                () -> phraseFinder.findAllPhraseStartOffsets("is located in Seattle", 2));
    }
}
