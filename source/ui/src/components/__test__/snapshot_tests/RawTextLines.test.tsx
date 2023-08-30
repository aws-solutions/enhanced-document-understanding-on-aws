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

import '@testing-library/jest-dom';
import RawTextLines from '../../RawTextLines/RawTextLines';
import { StatusIndicatorProps } from '@cloudscape-design/components';
import renderer from 'react-test-renderer';

const lines2page = [
    {
        'text': 'A Simple PDF File',
        'boundingBox': {
            'Width': 0.35942351818084717,
            'Height': 0.03374946489930153,
            'Left': 0.10564745217561722,
            'Top': 0.061845697462558746
        },
        'id': '203aa417-f04d-481a-8584-179e4b80bb03',
        'pageNumber': 1
    },
    {
        'text': 'This is a small demonstration .pdf file -',
        'boundingBox': {
            'Width': 0.27912431955337524,
            'Height': 0.01252768374979496,
            'Left': 0.11701812595129013,
            'Top': 0.12050458043813705
        },
        'id': '04680e4d-b998-47d2-a8d6-9795cfbdc925',
        'pageNumber': 2
    }
];

const lines1page = [
    {
        'text': 'A Simple PDF File',
        'boundingBox': {
            'Width': 0.35942351818084717,
            'Height': 0.03374946489930153,
            'Left': 0.10564745217561722,
            'Top': 0.061845697462558746
        },
        'id': '203aa417-f04d-481a-8584-179e4b80bb03',
        'pageNumber': 1
    },
    {
        'text': 'This is a small demonstration .pdf file -',
        'boundingBox': {
            'Width': 0.27912431955337524,
            'Height': 0.01252768374979496,
            'Left': 0.11701812595129013,
            'Top': 0.12050458043813705
        },
        'id': '04680e4d-b998-47d2-a8d6-9795cfbdc925',
        'pageNumber': 1
    }
];

const rawTextLinesPropsNoLines = {
    currentPageNumber: 1,
    documentPageCount: 4,
    documentLines: [],
    switchPage: jest.fn(),
    currentStatus: 'success' as StatusIndicatorProps.Type
};

const rawTextLinesProps2Page = {
    currentPageNumber: 1,
    documentPageCount: 4,
    documentLines: lines2page,
    switchPage: jest.fn(),
    currentStatus: 'success' as StatusIndicatorProps.Type
};

jest.mock('@cloudscape-design/components', () => {
    const Components = jest.genMockFromModule('@cloudscape-design/components') as any;
    for (const componentName of Object.keys(Components)) {
        Components[componentName] = componentName;
    }
    return Components;
});

test('Renders without lines', async () => {
    const tree = renderer.create(<RawTextLines {...rawTextLinesPropsNoLines} />).toJSON();
    expect(tree).toMatchSnapshot();
});

test('Renders raw text lines with page number listed for multi-page', async () => {
    const tree = renderer.create(<RawTextLines {...rawTextLinesProps2Page} />).toJSON();
    expect(tree).toMatchSnapshot();
});
