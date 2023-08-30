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

'use strict';

const utils = require('../../utils/generic');
const SharedLib = require('common-node-lib');

const {
    textractDetectTextInference,
    pageText,
    expectedSyncComprehendResponse,
    expectedSyncComprehendMedicalResponse
} = require('../event-test-data');

describe('mergeBoundingBoxes', () => {
    it('bbox1 to the left of bbox2', () => {
        const bbox1 = { 'Width': 1, 'Height': 1, 'Left': 0, 'Top': 0 };
        const bbox2 = { 'Width': 1, 'Height': 1, 'Left': 2, 'Top': 0 };
        const res = utils.mergeBoundingBoxes(bbox1, bbox2);
        expect(res).toEqual({ 'Width': 3, 'Height': 1, 'Left': 0, 'Top': 0 });
    });

    it('bbox2 to the left of bbox1', () => {
        const bbox2 = { 'Width': 1, 'Height': 1, 'Left': 0, 'Top': 0 };
        const bbox1 = { 'Width': 1, 'Height': 1, 'Left': 2, 'Top': 0 };
        const res = utils.mergeBoundingBoxes(bbox1, bbox2);
        expect(res).toEqual({ 'Width': 3, 'Height': 1, 'Left': 0, 'Top': 0 });
    });

    it('bbox1 to the left of bbox2, offset heights', () => {
        const bbox1 = { 'Width': 1, 'Height': 1, 'Left': 0, 'Top': 0 };
        const bbox2 = { 'Width': 1, 'Height': 1, 'Left': 2, 'Top': 1 };
        const res = utils.mergeBoundingBoxes(bbox1, bbox2);
        expect(res).toEqual({ 'Width': 3, 'Height': 2, 'Left': 0, 'Top': 0 });
    });

    it('bbox2 to the left of bbox1, offset heights', () => {
        const bbox2 = { 'Width': 1, 'Height': 1, 'Left': 0, 'Top': 0 };
        const bbox1 = { 'Width': 1, 'Height': 1, 'Left': 2, 'Top': 1 };
        const res = utils.mergeBoundingBoxes(bbox1, bbox2);
        expect(res).toEqual({ 'Width': 3, 'Height': 2, 'Left': 0, 'Top': 0 });
    });

    it('bboxes overlapping', () => {
        const bbox1 = { 'Width': 1, 'Height': 1, 'Left': 0, 'Top': 0 };
        const bbox2 = { 'Width': 1, 'Height': 1, 'Left': 0.5, 'Top': 0.5 };
        const res = utils.mergeBoundingBoxes(bbox1, bbox2);
        expect(res).toEqual({ 'Width': 1.5, 'Height': 1.5, 'Left': 0, 'Top': 0 });
    });

    it('bboxes equal', () => {
        const bbox1 = { 'Width': 1, 'Height': 1, 'Left': 0, 'Top': 0 };
        const bbox2 = { 'Width': 1, 'Height': 1, 'Left': 0, 'Top': 0 };
        const res = utils.mergeBoundingBoxes(bbox1, bbox2);
        expect(res).toEqual({ 'Width': 1, 'Height': 1, 'Left': 0, 'Top': 0 });
    });

    it('bboxes stacked', () => {
        const bbox1 = { 'Width': 1, 'Height': 1, 'Left': 0, 'Top': 0 };
        const bbox2 = { 'Width': 1, 'Height': 1, 'Left': 0, 'Top': 1 };
        const res = utils.mergeBoundingBoxes(bbox1, bbox2);
        expect(res).toEqual({ 'Width': 1, 'Height': 2, 'Left': 0, 'Top': 0 });
    });

    it('passing only 1 bbox, bbox1', () => {
        const bbox1 = { 'Width': 1, 'Height': 1, 'Left': 0, 'Top': 0 };
        const res = utils.mergeBoundingBoxes(bbox1, undefined);
        expect(res).toEqual({ 'Width': 1, 'Height': 1, 'Left': 0, 'Top': 0 });
    });

    it('passing only 1 bbox, bbox2', () => {
        const bbox2 = { 'Width': 1, 'Height': 1, 'Left': 0, 'Top': 0 };
        const res = utils.mergeBoundingBoxes(undefined, bbox2);
        expect(res).toEqual({ 'Width': 1, 'Height': 1, 'Left': 0, 'Top': 0 });
    });

    it('bad input expect failure', () => {
        const bbox1 = { 'Width': 1, 'Height': 1, 'Left': 0 };
        const bbox2 = { 'Width': 1, 'Height': 1, 'Left': 0, 'Top': 1 };
        expect(() => {
            utils.mergeBoundingBoxes(bbox1, bbox2);
        }).toThrow(TypeError);
    });

    it('bad input expect failure 2', () => {
        const bbox1 = 1;
        const bbox2 = 'test';
        expect(() => {
            utils.mergeBoundingBoxes(bbox1, bbox2);
        }).toThrow(TypeError);
    });

    it('bad input expect failure 3', () => {
        expect(() => {
            utils.mergeBoundingBoxes(undefined, undefined);
        }).toThrow(TypeError);
    });
});

describe('findStartingLineIdx', () => {
    let dummyOffsetToLineMap;

    beforeEach(() => {
        dummyOffsetToLineMap = [
            { offset: 0, id: 'id1' },
            { offset: 10, id: 'id2' },
            { offset: 20, id: 'id3' },
            { offset: 30, id: 'id4' },
            { offset: 40, id: 'id5' },
            { offset: 50, id: 'id6' },
            { offset: 100, id: 'id7' }
        ];
    });

    it('exactly on an offset', () => {
        let res;
        for (let i = 0; i < dummyOffsetToLineMap.length; i++) {
            res = utils.findStartingLineIdx(dummyOffsetToLineMap[i].offset, dummyOffsetToLineMap);
            expect(res).toEqual(i);
        }
    });

    it('between offsets', () => {
        let res;
        for (let i = 0; i < dummyOffsetToLineMap.length; i++) {
            res = utils.findStartingLineIdx(dummyOffsetToLineMap[i].offset + 1, dummyOffsetToLineMap);
            expect(res).toEqual(i);
        }
    });

    it('last offset', () => {
        let res = utils.findStartingLineIdx(200, dummyOffsetToLineMap);
        expect(res).toEqual(dummyOffsetToLineMap.length - 1);
    });

    it('middle offset', () => {
        let res = utils.findStartingLineIdx(33, dummyOffsetToLineMap);
        expect(res).toEqual(3);
    });

    it('first offset', () => {
        let res = utils.findStartingLineIdx(9, dummyOffsetToLineMap);
        expect(res).toEqual(0);
    });

    it('exactly on offset, even number', () => {
        dummyOffsetToLineMap = dummyOffsetToLineMap.slice(0, -1);
        let res;
        for (let i = 0; i < dummyOffsetToLineMap.length; i++) {
            res = utils.findStartingLineIdx(dummyOffsetToLineMap[i].offset, dummyOffsetToLineMap);
            expect(res).toEqual(i);
        }
    });

    it('between offsets, even number', () => {
        dummyOffsetToLineMap = dummyOffsetToLineMap.slice(0, -1);
        let res;
        for (let i = 0; i < dummyOffsetToLineMap.length; i++) {
            res = utils.findStartingLineIdx(dummyOffsetToLineMap[i].offset + 1, dummyOffsetToLineMap);
            expect(res).toEqual(i);
        }
    });

    it('below first offset should fail', () => {
        expect(() => {
            utils.findStartingLineIdx(-1, dummyOffsetToLineMap);
        }).toThrow();
    });
});

describe('computeBoundingBoxes', () => {
    let dummyOffsetToLineMap = [];
    let dummyBlockDict = {};

    beforeAll(() => {
        // needed input objects for all computations
        let currentText = '';
        textractDetectTextInference[0].Blocks.forEach((block) => {
            if (block.BlockType === SharedLib.TextractBlockTypes.LINE) {
                dummyOffsetToLineMap.push({ offset: currentText.length, id: block.Id });
                currentText = currentText.concat(block.Text, ' ');
            }

            dummyBlockDict[block.Id] = block;
        });
        console.debug(dummyOffsetToLineMap);
    });

    it('Single word entity', () => {
        let entity = expectedSyncComprehendResponse.Entities[0];
        let res = utils.computeBoundingBoxes(entity, dummyOffsetToLineMap, dummyBlockDict);
        expect(res).toEqual([{ 'Width': 1, 'Height': 1, 'Left': 3, 'Top': 0 }]);
    });

    it('Entity broken between 2 lines', () => {
        let entity = expectedSyncComprehendResponse.Entities[1];
        let res = utils.computeBoundingBoxes(entity, dummyOffsetToLineMap, dummyBlockDict);
        expect(res).toEqual([
            { 'Width': 1, 'Height': 1, 'Left': 6, 'Top': 0 },
            { 'Width': 1, 'Height': 1, 'Left': 0, 'Top': 1 }
        ]);
    });

    it('2 word entity on same line', () => {
        let entity = expectedSyncComprehendResponse.Entities[2];
        let res = utils.computeBoundingBoxes(entity, dummyOffsetToLineMap, dummyBlockDict);
        expect(res).toEqual([{ 'Width': 2, 'Height': 1, 'Left': 1, 'Top': 1 }]);
    });

    it('longer entity overlapping others', () => {
        let entity = expectedSyncComprehendResponse.Entities[3];
        let res = utils.computeBoundingBoxes(entity, dummyOffsetToLineMap, dummyBlockDict);
        expect(res).toEqual([{ 'Width': 4, 'Height': 1, 'Left': 0, 'Top': 0 }]);
    });

    it('should throw if we pass an entity that does not exist', () => {
        let entity = {
            'Score': 0.8919363021850586,
            'Type': 'DATE',
            'Text': '2024',
            'BeginOffset': 100,
            'EndOffset': 104
        };
        expect(() => {
            utils.computeBoundingBoxes(entity, dummyOffsetToLineMap, dummyBlockDict);
        }).toThrow();
    });
});

describe('addEntityLocation', () => {
    let entityLocations = {};
    let dummyOffsetToLineMap = [];
    let dummyBlockDict = {};

    beforeAll(() => {
        // needed input objects for all computations
        let currentText = '';
        textractDetectTextInference[0].Blocks.forEach((block) => {
            if (block.BlockType === SharedLib.TextractBlockTypes.LINE) {
                dummyOffsetToLineMap.push({ offset: currentText.length, id: block.Id });
                currentText = currentText.concat(block.Text, ' ');
            }

            dummyBlockDict[block.Id] = block;
        });
        console.debug(dummyOffsetToLineMap);
    });

    it('passing in an entity of a new type', () => {
        let entity = expectedSyncComprehendResponse.Entities[0];
        utils.addEntityLocation(entityLocations, entity, dummyOffsetToLineMap, dummyBlockDict, 1);
        expect(entityLocations).toEqual({
            'DATE': {
                '2023': {
                    '1': [
                        {
                            'Score': 0.8919363021850586,
                            'BoundingBoxes': [
                                {
                                    'Height': 1,
                                    'Left': 3,
                                    'Top': 0,
                                    'Width': 1
                                }
                            ]
                        }
                    ]
                }
            }
        });
    });

    it('passing in the same entity appearing on a 2nd page with existing output', () => {
        let entity = expectedSyncComprehendResponse.Entities[0];
        utils.addEntityLocation(entityLocations, entity, dummyOffsetToLineMap, dummyBlockDict, 2);
        expect(entityLocations).toEqual({
            'DATE': {
                '2023': {
                    '1': [
                        {
                            'Score': 0.8919363021850586,
                            'BoundingBoxes': [
                                {
                                    'Height': 1,
                                    'Left': 3,
                                    'Top': 0,
                                    'Width': 1
                                }
                            ]
                        }
                    ],
                    '2': [
                        {
                            'Score': 0.8919363021850586,
                            'BoundingBoxes': [
                                {
                                    'Height': 1,
                                    'Left': 3,
                                    'Top': 0,
                                    'Width': 1
                                }
                            ]
                        }
                    ]
                }
            }
        });
    });

    it('passing in another instance of the same entity on the same page with existing output', () => {
        let entity = expectedSyncComprehendResponse.Entities[0];
        utils.addEntityLocation(entityLocations, entity, dummyOffsetToLineMap, dummyBlockDict, 1);
        expect(entityLocations).toEqual({
            'DATE': {
                '2023': {
                    '1': [
                        {
                            'Score': 0.8919363021850586,
                            'BoundingBoxes': [
                                {
                                    'Height': 1,
                                    'Left': 3,
                                    'Top': 0,
                                    'Width': 1
                                }
                            ]
                        },
                        {
                            'Score': 0.8919363021850586,
                            'BoundingBoxes': [
                                {
                                    'Height': 1,
                                    'Left': 3,
                                    'Top': 0,
                                    'Width': 1
                                }
                            ]
                        }
                    ],
                    '2': [
                        {
                            'Score': 0.8919363021850586,
                            'BoundingBoxes': [
                                {
                                    'Height': 1,
                                    'Left': 3,
                                    'Top': 0,
                                    'Width': 1
                                }
                            ]
                        }
                    ]
                }
            }
        });
    });

    it('passing in 2 entites of different types', () => {
        entityLocations = {};
        let entity1 = expectedSyncComprehendResponse.Entities[0];
        let entity2 = expectedSyncComprehendResponse.Entities[1];
        utils.addEntityLocation(entityLocations, entity1, dummyOffsetToLineMap, dummyBlockDict, 1);
        utils.addEntityLocation(entityLocations, entity2, dummyOffsetToLineMap, dummyBlockDict, 1);
        expect(entityLocations).toEqual({
            'DATE': {
                '2023': {
                    '1': [
                        {
                            'Score': 0.8919363021850586,
                            'BoundingBoxes': [
                                {
                                    'Height': 1,
                                    'Left': 3,
                                    'Top': 0,
                                    'Width': 1
                                }
                            ]
                        }
                    ]
                }
            },
            'PERSON': {
                'JOHN DOE': {
                    '1': [
                        {
                            'Score': 0.8900869488716125,
                            'BoundingBoxes': [
                                {
                                    'Width': 1,
                                    'Height': 1,
                                    'Left': 6,
                                    'Top': 0
                                },
                                {
                                    'Width': 1,
                                    'Height': 1,
                                    'Left': 0,
                                    'Top': 1
                                }
                            ]
                        }
                    ]
                }
            }
        });
    });

    it('passing in 2 entites of the same type', () => {
        entityLocations = {};
        let entity1 = expectedSyncComprehendResponse.Entities[0];
        let entity2 = expectedSyncComprehendResponse.Entities[1];
        entity1.Type = 'PERSON';
        utils.addEntityLocation(entityLocations, entity1, dummyOffsetToLineMap, dummyBlockDict, 1);
        utils.addEntityLocation(entityLocations, entity2, dummyOffsetToLineMap, dummyBlockDict, 1);
        expect(entityLocations).toEqual({
            'PERSON': {
                '2023': {
                    '1': [
                        {
                            'Score': 0.8919363021850586,
                            'BoundingBoxes': [
                                {
                                    'Height': 1,
                                    'Left': 3,
                                    'Top': 0,
                                    'Width': 1
                                }
                            ]
                        }
                    ]
                },
                'JOHN DOE': {
                    '1': [
                        {
                            'Score': 0.8900869488716125,
                            'BoundingBoxes': [
                                {
                                    'Width': 1,
                                    'Height': 1,
                                    'Left': 6,
                                    'Top': 0
                                },
                                {
                                    'Width': 1,
                                    'Height': 1,
                                    'Left': 0,
                                    'Top': 1
                                }
                            ]
                        }
                    ]
                }
            }
        });
    });

    it('passing in 2 entites with different capitalization, but same content', () => {
        entityLocations = {};
        let entity1 = expectedSyncComprehendResponse.Entities[1];
        let entity2 = expectedSyncComprehendResponse.Entities[4];
        utils.addEntityLocation(entityLocations, entity1, dummyOffsetToLineMap, dummyBlockDict, 1);
        utils.addEntityLocation(entityLocations, entity2, dummyOffsetToLineMap, dummyBlockDict, 1);
        expect(entityLocations).toEqual({
            'PERSON': {
                'JOHN DOE': {
                    '1': [
                        {
                            'Score': 0.8900869488716125,
                            'BoundingBoxes': [
                                {
                                    'Width': 1,
                                    'Height': 1,
                                    'Left': 6,
                                    'Top': 0
                                },
                                {
                                    'Width': 1,
                                    'Height': 1,
                                    'Left': 0,
                                    'Top': 1
                                }
                            ]
                        },
                        {
                            'Score': 0.8900869488716125,
                            'BoundingBoxes': [
                                {
                                    'Width': 2,
                                    'Height': 1,
                                    'Left': 3,
                                    'Top': 1
                                }
                            ]
                        }
                    ]
                }
            }
        });
    });

    it('passing in an entity of a new type for Comprehend Medical', () => {
        entityLocations = {};
        let entity = expectedSyncComprehendMedicalResponse.Entities[0];
        entity.MedicalType = entity.Type;
        entity.Type = entity.Category;
        utils.addEntityLocation(entityLocations, entity, dummyOffsetToLineMap, dummyBlockDict, 1);
        expect(entityLocations).toEqual({
            'MEDICATION': {
                '2023': {
                    '1': [
                        {
                            'Score': 0.8919363021850586,
                            'BoundingBoxes': [
                                {
                                    'Height': 1,
                                    'Left': 3,
                                    'Top': 0,
                                    'Width': 1
                                }
                            ],
                            'Type': 'DX_NAME'
                        }
                    ]
                }
            }
        });
    });
});
