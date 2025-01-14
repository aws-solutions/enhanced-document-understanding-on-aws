// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package com.builder.lambda.utils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.NavigableMap;
import java.util.TreeMap;
import java.util.Map.Entry;
import java.util.regex.Pattern;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import com.builder.lambda.model.BoundingBox;
import com.builder.lambda.model.TextractBlock;
import com.builder.lambda.model.TextractDetectText;

import software.amazon.lambda.powertools.logging.Logging;

public class PhraseFinder {

    private Logger log = LogManager.getLogger(PhraseFinder.class);

    /**
     * maps an offset in the text to the block id of the line containing text at
     * that offset. TreeMap is specifically used since we want to use the
     * lowerEntry() method to effeciently find the id of the starting line
     * containing words at a given offset, and be able to iterate to subsequent
     * lines in constant time.
     */
    private List<TreeMap<Integer, String>> offsetToLineIdMaps;

    /**
     * Indexed by page, then key is id of block, value is block itself
     */
    private List<Map<String, TextractBlock>> blockMap;

    /**
     * all text (lines) for each page concatendated
     */
    private List<String> pageTexts;

    /**
     * @param textractResults Multi-page results as returned from textract, pulled
     *                        from s3 and parsed. into the suitable java object
     */
    public PhraseFinder(List<TextractDetectText> textractResults) {
        // build the maps needed by this object for future processing
        offsetToLineIdMaps = new ArrayList<>();
        blockMap = new ArrayList<>();
        pageTexts = new ArrayList<>();
        for (int pageIdx = 0; pageIdx < textractResults.size(); pageIdx++) {
            StringBuilder pageTextBuilder = new StringBuilder();
            blockMap.add(new HashMap<>());
            offsetToLineIdMaps.add(new TreeMap<>());
            for (TextractBlock block : textractResults.get(pageIdx).getBlocks()) {
                if (block.getBlockType().equals("LINE")) {
                    offsetToLineIdMaps.get(pageIdx).put(pageTextBuilder.length(), block.getId());

                    // adding spaces between lines
                    if (pageTextBuilder.length() != 0) {
                        pageTextBuilder.append(" ");
                    }

                    pageTextBuilder.append(block.getText());
                }
                blockMap.get(pageIdx).put(block.getId(), block);
            }
            pageTexts.add(pageTextBuilder.toString());
        }
    }

    /**
     * Finds all bounding boxes for a phrase in the document
     * 
     * @param phrase
     * @param pageNumbers the pages where we will get phrases from. Expecting 1 to
     *                    be the
     *                    first page.
     * @return
     */
    @Logging
    public Map<String, List<BoundingBox>> findPhraseBoundingBoxes(String phrase, List<Integer> pageNumbers) {
        Map<String, List<BoundingBox>> boundingBoxes = new HashMap<>();

        for (int pageNumber : pageNumbers) {
            try {
                List<BoundingBox> boundingBoxesOnPage = findPhraseBoundingBoxesOnPage(phrase, pageNumber - 1);
                log.info("Found {} bounding boxes for phrase '{}' on page {}", boundingBoxesOnPage.size(), phrase,
                        pageNumber);
                boundingBoxes.put(String.valueOf(pageNumber), boundingBoxesOnPage);
            } catch (IndexOutOfBoundsException e) {
                log.warn("Page {} does not exist. Ignoring.", pageNumber);
            }

        }
        return boundingBoxes;
    }

    /**
     * Finds all instances of a phrase on a page and returns the bounding boxes
     * 
     * @param phrase
     * @param page
     * @return
     */
    @Logging
    public List<BoundingBox> findPhraseBoundingBoxesOnPage(String phrase, int page) throws IndexOutOfBoundsException {
        List<BoundingBox> boundingBoxes = new ArrayList<>();
        String[] phraseWords = phrase.split(" ");

        // perform this collection of bounding boxes over all instances of the phrase
        // found on page
        for (int offset : findAllPhraseStartOffsets(phrase, page)) {
            findPhraseInstanceBoundingBoxes(page, boundingBoxes, phraseWords, offset);
        }
        return boundingBoxes;
    }

    /**
     * Finds all the offsets (the character at which a phrase starts in the text) of
     * the given phrase in the text of the given page.
     *
     * @param phrase
     * @param pageIdx used to index into our pagetexts, so we would pass 0 for page
     *                1 here
     * @return
     */
    @Logging
    public List<Integer> findAllPhraseStartOffsets(String phrase, int pageIdx) throws IndexOutOfBoundsException {
        int index = 0;
        List<Integer> offsets = new ArrayList<>();
        while (true) {
            index = pageTexts.get(pageIdx).indexOf(phrase, index);
            if (index != -1) {
                offsets.add(index);
                index += phrase.length();
            } else {
                break;
            }
        }
        return offsets;
    }

    /**
     * Helper function for handling the complex logic of finding bounding box(es)
     * for a phrase on a page
     * 
     * @param page
     * @param boundingBoxes
     * @param phraseWords
     * @param offset
     */
    private void findPhraseInstanceBoundingBoxes(int page, List<BoundingBox> boundingBoxes, String[] phraseWords,
            int offset) {
        // matching words in the phrase to words in the line
        int phraseWordIdx = 0;

        // get the submap of the treemap with candidate lines for a phrase starting at
        // the offset.
        int startingLineOffset = offsetToLineIdMaps.get(page).floorKey(offset);
        NavigableMap<Integer, String> subOffsetToLineMap = offsetToLineIdMaps.get(page).tailMap(startingLineOffset,
                true);
        Iterator<Entry<Integer, String>> subOffsetToLineMapIterator = subOffsetToLineMap.entrySet()
                .iterator();

        while (phraseWordIdx < phraseWords.length) {
            // getting back here and continuing means we have not matched all words yet and
            // go to next line to continue. We do this by getting the next value in the map
            // using the iterator.

            String currentLineId = subOffsetToLineMapIterator.next().getValue();
            TextractBlock currentLineBlock = blockMap.get(page).get(currentLineId);

            // Getting the words of the current line separately to match them
            String[] lineWords = currentLineBlock.getText().split(" ");
            BoundingBox lineBbox = null;

            for (int lineWordIdx = 0; lineWordIdx < lineWords.length
                    && phraseWordIdx < phraseWords.length; lineWordIdx++) {

                // since the linewords may have leading or trailing punctuation attached to
                // them, we use this regex to still match
                Pattern matchWordWithSurroundingPunctuationRegex = Pattern
                        .compile("(?<!\\w)" + Pattern.quote(phraseWords[phraseWordIdx]) + "(?!\\w)");
                if (matchWordWithSurroundingPunctuationRegex.matcher(lineWords[lineWordIdx]).find()) {
                    // The Relationships array of a 'LINE' block from detectText is always size 1,
                    // containing 'CHILD' types this is because the other option ('VALUE' type
                    // relationship) is only relevant to key:value pairs such as tables.
                    // Additionally, the children of the given 'LINE' block are ordered, so whatever
                    // word index we are at is the index of the child 'WORD' block.
                    TextractBlock wordBlock = blockMap.get(page)
                            .get(currentLineBlock.getRelationships().get(0).getIds().get(lineWordIdx));

                    // box on same line gets merged with previous box
                    if (lineBbox != null) {
                        lineBbox.merge(wordBlock.getGeometry().getBoundingBox());
                    } else {
                        lineBbox = wordBlock.getGeometry().getBoundingBox();
                    }
                    phraseWordIdx++;
                } else {
                    // we partially matched the phrase, and then did not match, so we restart the
                    // matching sequence
                    phraseWordIdx = 0;
                    lineBbox = null;
                }
            }

            if (lineBbox != null) {
                boundingBoxes.add(lineBbox);
            }
        }
    }
}
