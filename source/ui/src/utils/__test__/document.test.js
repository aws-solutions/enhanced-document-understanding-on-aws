// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as docUtils from '../document';

const {
    getPage,
    getDocumentBlocks,
    getIndexedDocumentBlocks,
    getDocumentBlocksByIds,
    getCellOrValueContents,
    getPageChildrenByType,
    filterBlocksByType
} = docUtils.exportedForTesting;

describe('getDocumentPageCount', () => {
    it('should return the correct page count for a single page document', () => {
        const document = { textractDetectResponse: { DocumentMetadata: { Pages: 1 } } };
        expect(docUtils.getDocumentPageCount(document, 'LINE')).toBe(1);
    });

    it('should return the correct page count for a multi page document', () => {
        const document = {
            textractDetectResponse: [{ DocumentMetadata: { Pages: 2 } }, { DocumentMetadata: { Pages: 3 } }]
        };
        expect(docUtils.getDocumentPageCount(document, 'LINE')).toBe(2);
    });
});

describe('getPage', () => {
    let mockGetDocumentBlocks;
    beforeEach(() => {
        mockGetDocumentBlocks = jest.spyOn(docUtils.exportedForTesting, 'getDocumentBlocks');
    });
    it('should return an empty object if the page number does not exist in the document', () => {
        mockGetDocumentBlocks.mockReturnValue([]);
        const document = { textractDetectResponse: { Blocks: [{ BlockType: 'PAGE', Page: 2 }] } };
        expect(getPage(document, 3)).toEqual({});
    });

    it('should return the correct page if the page number exists in the document', () => {
        mockGetDocumentBlocks.mockReturnValue([
            { BlockType: 'PAGE', Page: 2 },
            { BlockType: 'PAGE', Page: 3 }
        ]);
        const document = {
            textractAnalyzeResponse: {
                Blocks: [
                    { BlockType: 'PAGE', Page: 2 },
                    { BlockType: 'PAGE', Page: 3 }
                ]
            }
        };
        expect(getPage(document, 2, 'KEY_VALUE_SET')).toEqual({ BlockType: 'PAGE', Page: 2 });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });
});

describe('getDocumentBlocks', () => {
    it('should return an empty array if the document object is nil or empty', () => {
        expect(getDocumentBlocks({})).toEqual([]);
        expect(getDocumentBlocks(null)).toEqual([]);
    });

    it('should return an empty array if the textractDetectResponse property does not exist in the document object', () => {
        expect(getDocumentBlocks({ notTextractDetectResponse: [{ Blocks: [1, 2, 3] }] })).toEqual([]);
    });

    it('should return the combined Blocks of a chunked response', () => {
        const document = { textractDetectResponse: [{ Blocks: [1, 2, 3] }, { Blocks: [4, 5, 6] }] };
        expect(getDocumentBlocks(document, 'LINE')).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should return the Blocks of a non-chunked response', () => {
        const document = { textractDetectResponse: { Blocks: [1, 2, 3] } };
        expect(getDocumentBlocks(document, 'LINE')).toEqual([1, 2, 3]);
    });
});

describe('getIndexedDocumentBlocks', () => {
    let mockGetDocumentBlocks;
    beforeEach(() => {
        mockGetDocumentBlocks = jest.spyOn(docUtils.exportedForTesting, 'getDocumentBlocks');
    });
    it('should return an object indexed by block id', () => {
        mockGetDocumentBlocks.mockReturnValue([
            {
                Id: '1',
                Text: 'text1'
            },
            {
                Id: '2',
                Text: 'text2'
            }
        ]);
        const document = {
            textractDetectResponse: {
                Blocks: [
                    {
                        Id: '1',
                        Text: 'text1'
                    },
                    {
                        Id: '2',
                        Text: 'text2'
                    }
                ]
            }
        };
        const expectedResult = {
            '1': {
                Id: '1',
                Text: 'text1'
            },
            '2': {
                Id: '2',
                Text: 'text2'
            }
        };
        expect(getIndexedDocumentBlocks(document, 'LINE')).toEqual(expectedResult);
    });

    it('should return an empty object when document is empty', () => {
        mockGetDocumentBlocks.mockReturnValue([]);
        const document = {};
        expect(getIndexedDocumentBlocks(document)).toEqual({});
    });
});

describe('getDocumentBlocksByIds', () => {
    let mockGetIndexedDocumentBlocks;
    beforeEach(() => {
        mockGetIndexedDocumentBlocks = jest.spyOn(docUtils.exportedForTesting, 'getDocumentBlocksByIds');
    });
    it('should return an array of blocks matching the IDs provided', () => {
        mockGetIndexedDocumentBlocks.mockReturnValue({
            '1': {
                Id: '1',
                Text: 'Hello'
            },
            '2': {
                Id: '2',
                Text: 'World'
            }
        });
        const document = {
            textractDetectResponse: {
                Blocks: [
                    { Id: '1', Text: 'Hello' },
                    { Id: '2', Text: 'World' }
                ]
            }
        };
        const ids = ['1'];

        const result = getDocumentBlocksByIds(document, ids, 'LINE');
        expect(result).toEqual([{ Id: '1', Text: 'Hello' }]);
    });
});

describe('getCellOrValueContents', () => {
    it('returns the text/boolean content of VALUE or CELL Blocks', () => {
        const document = {
            textractDetectResponse: {
                Blocks: [
                    {
                        Id: '0',
                        Text: 'test',
                        BlockType: 'WORD',
                        SelectionStatus: 'NOT_SELECTED'
                    },
                    {
                        Id: '1',
                        Text: 'yes',
                        BlockType: 'SELECTION_ELEMENT',
                        SelectionStatus: 'SELECTED'
                    }
                ]
            }
        };
        const ids = ['0', '1'];
        const result = getCellOrValueContents(document, ids, 'LINE');
        expect(result).toEqual('Yes');
    });

    it('returns an empty string if no ids are provided', () => {
        const document = {
            textractDetectResponse: {
                Blocks: [
                    {
                        Text: 'test',
                        BlockType: 'WORD',
                        SelectionStatus: 'NOT_SELECTED'
                    },
                    {
                        Text: 'yes',
                        BlockType: 'SELECTION_ELEMENT',
                        SelectionStatus: 'SELECTED'
                    }
                ]
            }
        };
        const result = getCellOrValueContents(document, null);
        expect(result).toEqual('');
    });
});

describe('getPageChildrenByType', () => {
    test('returns correct child blocks of given type', () => {
        const document = {
            textractDetectResponse: {
                Blocks: [
                    {
                        Id: '1',
                        BlockType: 'PAGE',
                        Relationships: [
                            {
                                Ids: ['2', '3']
                            }
                        ]
                    },
                    {
                        Id: '2',
                        BlockType: 'WORD',
                        Text: 'Hello'
                    },
                    {
                        Id: '3',
                        BlockType: 'WORD',
                        Text: 'world'
                    }
                ]
            }
        };

        expect(getPageChildrenByType(document, 1, 'WORD')).toEqual([
            {
                Id: '2',
                BlockType: 'WORD',
                Text: 'Hello'
            },
            {
                Id: '3',
                BlockType: 'WORD',
                Text: 'world'
            }
        ]);
    });
});
