// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const SharedLib = require('common-node-lib');

exports.DEFAULT_LANGUAGE = 'en';

exports.SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ar', 'hi', 'ja', 'ko', 'zh', 'zh-TW'];

exports.INFERENCE_NAME_LOCATION_SUFFIX = 'locations';

exports.jobTypes = {
    STANDARD: SharedLib.WorkflowStageNames.ENTITY,
    MEDICAL: SharedLib.WorkflowStageNames.MEDICAL_ENTITY,
    PII: SharedLib.WorkflowStageNames.PII
};

/**
 * Given an instance of our output object (which contains all info about entity instances and their locations), this
 * function adds an entity to the output.
 *
 * @param {Object} entityLocations The object which will contain data about entities and their bounding box locations
 * @param {Object} entity The entity to add
 * @param {Array[Object]} offsetToLineIdMap array of objects which each map a starting character offset to a textract
 * output block Id. Expected to look like: [ { offset: 0, id: 'id1' }, { offset: 10, id: 'id2' }, ...]
 * @param {Object} blockDict An object derived from the textract output which maps block Id's to blocks.
 * @param {Number} pageNumber The page number of the entity. Note it is not 0 based, the first page is '1'
 */
exports.addEntityLocation = (entityLocations, entity, offsetToLineIdMap, blockDict, pageNumber) => {
    let entityInstance = {
        'Score': entity.Score,
        'BoundingBoxes': this.computeBoundingBoxes(entity, offsetToLineIdMap, blockDict)
    };

    // only for ComprehendMedical add 'Type' in the entity instance
    if (entity.MedicalType) {
        entityInstance.Type = entity.MedicalType;
    }

    // entites are kept case-insensitive
    let entityText = entity.Text.toUpperCase();

    // creating new empty sub-objects in the output object for first occurrences of entity type/content per page
    if (!(entity.Type in entityLocations)) {
        entityLocations[entity.Type] = {};
    }
    if (!(entityText in entityLocations[entity.Type])) {
        entityLocations[entity.Type][entityText] = {};
    }
    if (!(pageNumber in entityLocations[entity.Type][entityText])) {
        entityLocations[entity.Type][entityText][pageNumber] = [];
    }

    entityLocations[entity.Type][entityText][pageNumber].push(entityInstance);
};

/**
 * For a given entity, this function computes the bounding boxes of the entity on the source page, essentially working
 * to reconcile entity detection results (which give entity location as a character offset in a string) with textract
 * results (which give physical locations of the text within an input document image/pdf).
 *
 * @param {Object} entity A single entity as returned from Amazon Comprehend detectEntities
 * @param {Array[Object]} offsetToLineIdMap array of objects which each map a starting character offset to a textract
 * output block Id. Expected to look like: [ { offset: 0, id: 'id1' }, { offset: 10, id: 'id2' }, ...]
 * @param {Object} blockDict An object derived from the textract output which maps block Id's to blocks.
 */
exports.computeBoundingBoxes = (entity, offsetToLineIdMap, blockDict) => { // NOSONAR javascript:S3776 algo is inherently complex, refactoring will only add to confusion
    let bboxes = [];
    let startingLineIdx = this.findStartingLineIdx(entity.BeginOffset, offsetToLineIdMap);

    // split input string into arrays of words for matching
    const entityWords = entity.Text.split(' ');

    let entityWordIdx = 0; // index into the entityWords array
    let lineCounter = 0; // if our entity spans multiple lines, this handles the offset from startingLine

    try {
        while (entityWordIdx < entityWords.length) {
            // getting back here and continuing means we have not matched all words yet and go to next line to continue
            const currentLineId = offsetToLineIdMap[startingLineIdx + lineCounter].id;
            const currentLineBlock = blockDict[currentLineId];
            const lineWords = currentLineBlock.Text.split(' '); // array of words

            for (let j = 0; j < lineWords.length; j++) {
                // textract 'WORD' blocks include the enclosing punctuation, whereas comprehend entities do not.
                // hence, we use this regex which will match if the textract word is surrounded by some extra characters.
                const matchSurroundedEntityRegex = new RegExp(
                    `(?<!\w)${escapeRegExp(entityWords[entityWordIdx])}(?!\w)`
                );
                if (matchSurroundedEntityRegex.test(lineWords[j])) {
                    // The Relationships array of a 'LINE' block from detectText is always size 1, containing 'CHILD' types
                    // this is because the other option ('VALUE' type relationship) is only relevant to key:value pairs
                    // such as tables. Additionally, the children of the given 'LINE' block are ordered, so whatever word index
                    // we are at is the index of the child 'WORD' block.
                    const wordBlock = blockDict[currentLineBlock.Relationships[0].Ids[j]];

                    // box on same line gets merged with previous box
                    if (wordBlock !== undefined) {
                        bboxes[lineCounter] = this.mergeBoundingBoxes(
                            bboxes[lineCounter],
                            wordBlock.Geometry.BoundingBox
                        );
                    }
                    entityWordIdx++;

                    // we have matched all the words in the entity before the end of a line, we're done
                    if (entityWordIdx >= entityWords.length) {
                        break;
                    }
                } else {
                    // we partially matched the entity in the line, and then did not match, so we must restart matching
                    // the entity from the beginning at our current place in the line, throwing away the partial matches
                    j -= entityWordIdx; // NOSONAR javascript:S2310 this is a requirement of the algorithm and not a problem
                    entityWordIdx = 0;
                    bboxes[lineCounter] = undefined;
                }
            }

            lineCounter++;
        }
    } catch (error) {
        const errMsg = `Bounding box computation failed for entity '${entity.Text}' at offset ${entity.BeginOffset}. Got error: ${error.message}`;
        throw new Error(errMsg);
    }
    return bboxes;
};

/**
 * Performs a binary seaerch over the offsetToLineIdMap, which is an array of pairs mapping a character offset to the
 * Id of the 'LINE' block (from textract detectText) starting at that offset, in order to find the which 'LINE' block
 * the provided beginOffset is contained in.
 *
 * e.g. given offsetToLineMap = [ {offset:0, id:1}, {offset:10, id:2}]
 * findStartingLineIdx(0, offsetToLineMap) == 1
 * findStartingLineIdx(1, offsetToLineMap) == 1
 * findStartingLineIdx(2, offsetToLineMap) == 1
 * findStartingLineIdx(11, offsetToLineMap) == 2
 *
 * @param {int} desiredBeginOffset
 * @param {Array[Object]} offsetToLineIdMap
 */
exports.findStartingLineIdx = (desiredBeginOffset, offsetToLineIdMap) => {
    if (desiredBeginOffset < offsetToLineIdMap[0].offset) {
        throw Error(
            `attempting to find an offset of ${desiredBeginOffset}, which is below the minimum offset in the provided map.`
        );
    }

    let high = offsetToLineIdMap.length - 1;
    let low = 0;
    let mid;
    let currentOffset;
    let targetIdx;

    // base case where desired offset is above the last offset in our array, so we return the last index
    if (offsetToLineIdMap[high].offset < desiredBeginOffset) {
        return high;
    }

    // performs a bianry search, where we return the next lowest value if no exact match
    while (low <= high) {
        mid = Math.floor((low + high) / 2);
        currentOffset = offsetToLineIdMap[mid].offset;
        if (currentOffset > desiredBeginOffset) {
            high = mid - 1;
        } else if (currentOffset < desiredBeginOffset) {
            targetIdx = mid;
            low = mid + 1;
        } else {
            return mid;
        }
    }

    return targetIdx;
};

/**
 * Merges 2 bounding boxes, expected to be on the same line with each other.
 * Expects bounding boxes to be defined as they are in textraxt (i.e. object with Left, Top, Height, Width attributes)
 * If passed only 1 bounding box, will return the same box as output.
 *
 * @param {Optional[Object]} bbox1 The first bounding box
 * @param {Optional[Object]} bbox2 The second bounding box
 */
exports.mergeBoundingBoxes = (bbox1, bbox2) => {
    if (bbox2 && bbox1 == undefined) {
        return bbox2;
    } else if (bbox1 && bbox2 == undefined) {
        return bbox1;
    }

    const left = Math.min(bbox1.Left, bbox2.Left);
    const top = Math.min(bbox1.Top, bbox2.Top);
    const right = Math.max(bbox1.Left + bbox1.Width, bbox2.Left + bbox2.Width);
    const bottom = Math.max(bbox1.Top + bbox1.Height, bbox2.Top + bbox2.Height);

    if ([left, right, top, bottom].some(isNaN)) {
        throw TypeError('Bad input resulted in a NaN in the response');
    }

    return {
        'Width': right - left,
        'Height': bottom - top,
        'Left': left,
        'Top': top
    };
};

/**
 * escapes special characters from a string to make it valid in a regex
 *
 * @param {string} literal_string inputted string
 * @returns string with special characters escaped
 */
function escapeRegExp(literal_string) {
    return literal_string.replace(/[-[\]{}()*+!<=:?.\/\\^$|#\s,]/g, '\\$&');
}
