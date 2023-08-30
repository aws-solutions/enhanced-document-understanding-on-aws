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

const { isUploadMissingDocument } = require('../../index');

describe('When comparing maps', () => {
    let map2 = new Map();
    beforeAll(() => {
        map2.set('A', 1);
        map2.set('B', 2);
        map2.set('C', 2);
    });

    it('should return true if map1 is missing a document type', () => {
        const map1 = new Map();
        map1.set('A', 1);
        map1.set('B', 2);
        expect(isUploadMissingDocument(map1, map2)).toBeTruthy();
    });

    it('should return true if map1 has a smaller count of a specific document type', () => {
        const map1 = new Map();
        map1.set('A', 1);
        map1.set('B', 1);
        map1.set('C', 2);
        expect(isUploadMissingDocument(map1, map2)).toBeTruthy();
    });

    it('should return false if they are exactly same, no more documents can be uploaded', () => {
        const map1 = new Map();
        map1.set('A', 1);
        map1.set('B', 2);
        map1.set('C', 2);
        expect(isUploadMissingDocument(map1, map2)).toBeFalsy();
    });

    it('if map1 is undefined, it should return false', () => {
        expect(isUploadMissingDocument(undefined, map2)).toBeFalsy();
    });

    it('should throw an error if map2 is undefined', () => {
        const map1 = new Map();
        map1.set('A', 1);
        map1.set('B', 2);
        map1.set('C', 2);

        try {
            isUploadMissingDocument(map1, undefined);
        } catch(error) {
            expect(error.message).toEqual('Cannot perform comparison')
        }
    });
});
