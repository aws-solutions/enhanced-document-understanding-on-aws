// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Lens, either, flatten, indexBy, is, isEmpty, isNil, lensPath, path, prop, range, sortBy, view } from 'ramda';

// Location of Blocks within a document object
const lensDocumentBlocksDetect = lensPath(['textractDetectResponse', 'Blocks']);
const lensDocumentBlocksAnalyze = lensPath(['textractAnalyzeResponse', 'Blocks']);

// Location of page count within single/multi page document
const lensPageCountDetect = lensPath(['textractDetectResponse', 'DocumentMetadata', 'Pages']);
const lensPageCountAnalyze = lensPath(['textractAnalyzeResponse', 'DocumentMetadata', 'Pages']);
const lensMultiPageCountDetect = lensPath(['textractDetectResponse', 0, 'DocumentMetadata', 'Pages']);
const lensMultiPageCountAnalyze = lensPath(['textractAnalyzeResponse', 0, 'DocumentMetadata', 'Pages']);

/**
 * Get a PAGE block by page number
 * @param {Object} document A Textract document object
 * @param {Number} pageNumber A page number
 * @return {Object}
 */
function getPage(document: any, pageNumber: any, type: any) {
    const blocks = getDocumentBlocks(document, type);
    const pageBlocks = blocks.filter(
        ({ BlockType, Page }: any) =>
            // Single page docs only have one PAGE, and it doesn't include a Page prop
            BlockType === 'PAGE' && (Page === pageNumber || (pageNumber === 1 && !Page))
    );
    return isEmpty(pageBlocks) ? {} : pageBlocks[0];
}

/**
 * Get all Blocks for a given document.
 * @param {Object} document A Textract document object
 * @return {Array}
 */
function getDocumentBlocks(document: any, type: any) {
    let lensDocumentBlocks, inference;
    if (['LINE', 'WORD'].indexOf(type) > -1) {
        lensDocumentBlocks = lensDocumentBlocksDetect;
        inference = document.textractDetectResponse;
    } else if (['TABLE', 'KEY_VALUE_SET'].indexOf(type) > -1) {
        lensDocumentBlocks = lensDocumentBlocksAnalyze;
        inference = document.textractAnalyzeResponse;
    }
    if (either(isNil, isEmpty)(document) || !inference) return [];
    const isChunkedResponse = is(Array, inference);
    const combinedChunks =
        isChunkedResponse && inference.reduce((accumulator: any, { Blocks }: any) => accumulator.concat(Blocks), []);
    return isChunkedResponse ? combinedChunks : view(lensDocumentBlocks as Lens<any, any>, document) || [];
}

/**
 * Get all Blocks for a given document, in an object indexed by ID
 * @param {Object} document A Textract document object
 * @return {Object}
 */
function getIndexedDocumentBlocks(document: any, type:any) {
    const blocks = getDocumentBlocks(document, type);
    const props: any = prop('Id')
    const indexedBlocks = indexBy(props, blocks);
    return indexedBlocks;
}

/**
 * Get a list of Blocks matching the IDs provided.
 * @param {Object} document A Textract document object
 * @param {Array} ids An array of Block IDs to get
 * @return {Array}
 */
function getDocumentBlocksByIds(document: any, ids: any , type: any) {
    const indexedBlocks = getIndexedDocumentBlocks(document, type);
    return ids.reduce((accumulator: any, current: any) => {
        return indexedBlocks[current] ? [...accumulator, indexedBlocks[current]] : accumulator;
    }, []);
}

/**
 * Get text/boolean content of VALUE or CELL Blocks.
 * @param {Object} document A Textract document object
 * @param {Array} ids An array of Block IDs
 * @return {Boolean|String}
 */
function getCellOrValueContents(document: any, ids: any, type: any) {
    if (!ids) return '';
    const contentBlocks = getDocumentBlocksByIds(document, ids, type);

    let isCheckbox = false;
    const value = contentBlocks.map(({ Text, BlockType, SelectionStatus }: any) => {
        if (BlockType === 'SELECTION_ELEMENT') isCheckbox = true;
        return BlockType === 'WORD' ? Text : SelectionStatus === 'SELECTED';
    });

    // If the value is a checkbox, we want to retain it as a boolean value
    // instead of joining it, which converts it to a string
    const booleanValue = value[0] ? 'Yes' : 'No';
    return isCheckbox ? booleanValue : value.join(' ');
}

/**
 * Get a page's child Blocks of a given type.
 * @param {Object} document A Textract document object
 * @param {Number} pageNumber A page number
 * @param {String} type A BlockType
 * @return {Array}
 */
function getPageChildrenByType(document: any, pageNumber: any, type: any) {
    const Relationships = prop('Relationships', getPage(document, pageNumber, type)) || [];
    const childBlockIds = path([0, 'Ids'], Relationships) || [];
    const children = getDocumentBlocksByIds(document, childBlockIds, type);
    const filteredChildren = type ? filterBlocksByType(children, type) : children;

    return filteredChildren;
}

/**
 * Filter a list of Blocks with a given BlockType.
 * @param {Array} blocks An array of Blocks
 * @param {String} type A BlockType
 * @return {Array}
 */
function filterBlocksByType(blocks: any, type: any) {
    return blocks.filter(({ BlockType }: any) => BlockType === type);
}

/**
 * Get the total number of pages in a document.
 * @param {Object} document A Textract document object
 * @return {Number}
 */
export function getDocumentPageCount(document: any, type: any) {
    let inference, lensPageCount, lensMultiPageCount;
    if (['LINE', 'WORD'].indexOf(type) > -1) {
        inference = document.textractDetectResponse;
        lensPageCount = lensPageCountDetect;
        lensMultiPageCount = lensMultiPageCountDetect;
    } else if (['TABLE', 'KEY_VALUE_SET'].indexOf(type) > -1) {
        inference = document.textractAnalyzeResponse;
        lensPageCount = lensPageCountAnalyze;
        lensMultiPageCount = lensMultiPageCountAnalyze;
    }
    const isChunkedResponse = is(Array, inference);
    return view((isChunkedResponse ? lensMultiPageCount : lensPageCount) as Lens<any,any>, document);
}

export function getDocumentLines(document: any, type: any) {
    const totalPages = getDocumentPageCount(document, type);
    const linesByPage = range(1, totalPages + 1).map((pageNumber) => {
        const lines = getPageLines(document, pageNumber);
        return lines;
    });

    return flatten(linesByPage);
}

/**
 * Get lines of text found in a page.
 * @param {Object} document A Textract document object
 * @param {Number} pageNumber The page number to get results for
 * @return {Array}
 */
export function getPageLines(document: any, pageNumber: any) {
    const lines = getPageChildrenByType(document, pageNumber, 'LINE');
    return lines.map(({ Text, Geometry, Page }: any) => {
        return {
            text: Text,
            pageNumber: Page,
            boundingBox: Geometry.BoundingBox
        };
    });
}

/**
 * Get forms found in a page.
 * @param {Object} document A Textract document object
 * @param {Number} pageNumber The page number to get results for
 * @return {Array}
 */
export function getDocumentKeyValuePairs(document: any, type: any) {
    const totalPages = getDocumentPageCount(document, type);

    const blocksByPage = range(1, totalPages + 1).map((pageNumber) => {
        const blocks = getPageKeyValuePairs(document, pageNumber);
        return blocks.map((b: any) => {
            return {
                ...b,
                pageNumber
            };
        });
    });
    return flatten(blocksByPage);
}

/**
 * Get forms found in a page.
 * @param {Object} document A Textract document object
 * @param {Number} pageNumber The page number to get results for
 * @return {Array}
 */
export function getPageKeyValuePairs(document: any, pageNumber: any) {
    // Get all blocks of BlockType KEY_VALUE_SET for a PAGE
    const keyValueSetBlocks = getPageChildrenByType(document, pageNumber, 'KEY_VALUE_SET');

    // Filter those down to get the blocks of EntityType KEY
    // NOTE: EntityTypes is an array, even though it only ever contains one value
    const keyBlocks = keyValueSetBlocks.filter(({ EntityTypes }: any) => EntityTypes.indexOf('KEY') >= 0);

    // Iterate over each KEY block
    const pairs = keyBlocks.map(({ Id, Relationships, Geometry }: any) => {
        // Get related VALUE blocks and WORD blocks for this KEY block
        const valueBlockIds = path([0, 'Ids'], Relationships) || [];
        const keyWordIds = path([1, 'Ids'], Relationships) || [];
        const keyWordBlocks = getDocumentBlocksByIds(document, keyWordIds, 'KEY_VALUE_SET');
        const valueBlocks = getDocumentBlocksByIds(document, valueBlockIds, 'KEY_VALUE_SET');

        // Get WORD blocks for each VALUE block
        const valueWordIds = valueBlocks.reduce((accumulator: any, { Relationships }: any) => {
            const childIds = Relationships ? Relationships[0].Ids : [];
            return [...accumulator, ...childIds];
        }, []);
        // Finally, return a simple object containing joined KEY and VALUE words
        const key = keyWordBlocks.map(({ Text }: any) => Text).join(' ');
        const value = getCellOrValueContents(document, valueWordIds, 'KEY_VALUE_SET');

        return {
            id: Id,
            key,
            value,
            keyBoundingBox: Geometry.BoundingBox,
            valueBoundingBox: valueBlocks[0].Geometry.BoundingBox
        };
    });

    return sortBy((x: any) => x.keyBoundingBox.Top + 0.05 * x.keyBoundingBox.Left)(pairs.filter((p: any) => p.key || p.value));
}

export function getDocumentTables(document: any, type: any) {
    const totalPages = getDocumentPageCount(document, type);

    const blocksByPage = range(1, totalPages + 1).map((pageNumber) => {
        const blocks = getPageTables(document, pageNumber);
        return blocks.map((b: any) => {
            return {
                ...b,
                pageNumber
            };
        });
    });
    return isEmpty(blocksByPage) ? [] : [].concat.apply([], blocksByPage);
}

/**
 * Get tables/rows/cells found in a page.
 * @param {Number} pageNumber The page number to get results for
 * @param {Object} document A Textract document object
 * @return {Array}
 */
export function getPageTables(document: any, pageNumber: any) {
    // Get all blocks of BlockType TABLE for a PAGE
    const tableBlocks = getPageChildrenByType(document, pageNumber, 'TABLE');

    // Iterate each TABLE in order to build a new data structure
    const tables = tableBlocks.map((table: any) => {
        const { Relationships } = table;
        // Get all blocks of BlockType CELL within this TABLE
        const cellBlockIds = path([0, 'Ids'], Relationships) || [];
        const cellBlocks = getDocumentBlocksByIds(document, cellBlockIds, 'TABLE');

        // Iterate each CELL in order to build an array for each row containing an object for each cell
        const rowData = cellBlocks.reduce((accumulator: any, current: any) => {
            const { RowIndex, ColumnIndex, RowSpan, ColumnSpan, Relationships, Geometry } = current;
            const contentBlockIds = path([0, 'Ids'], Relationships) || [];
            const row = accumulator[RowIndex - 1] || [];
            row[ColumnIndex - 1] = {
                RowIndex,
                ColumnIndex,
                RowSpan,
                ColumnSpan,
                content: getCellOrValueContents(document, contentBlockIds, 'TABLE'),
                Geometry
            };
            accumulator[RowIndex - 1] = row;
            return accumulator;
        }, []);

        return { table, rows: rowData };
    });

    return tables;
}

export const exportedForTesting = {
    getPage,
    getDocumentBlocks,
    getIndexedDocumentBlocks,
    getDocumentBlocksByIds,
    getCellOrValueContents,
    getPageChildrenByType,
    filterBlocksByType
};
