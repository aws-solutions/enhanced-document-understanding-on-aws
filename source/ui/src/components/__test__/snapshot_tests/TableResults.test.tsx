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
import { screen } from '@testing-library/react';
import renderer from 'react-test-renderer';
import { StatusIndicatorProps } from '@cloudscape-design/components';
import { tables } from '../../../__test__/test_data';
import TableResults from '../../TableResults/TableResults';

const tableResultsPropsEmpty = {
    currentPageNumber: 1,
    documentPageCount: 4,
    tables: [],
    switchPage: jest.fn(),
    currentStatus: 'success' as StatusIndicatorProps.Type
};

const tableResultsProps = {
    currentPageNumber: 1,
    documentPageCount: 4,
    tables: tables,
    switchPage: jest.fn(),
    currentStatus: 'success' as StatusIndicatorProps.Type
};

const tableResultsPropsLoading = {
    currentPageNumber: 0,
    documentPageCount: 0,
    tables: [],
    switchPage: jest.fn(),
    currentStatus: 'loading' as StatusIndicatorProps.Type
};

const tableResultsPropsFailed = {
    currentPageNumber: 0,
    documentPageCount: 0,
    tables: [],
    switchPage: jest.fn(),
    currentStatus: 'error' as StatusIndicatorProps.Type
};

jest.mock('@cloudscape-design/components', () => {
    const Components = jest.genMockFromModule('@cloudscape-design/components') as any;
    for (const componentName of Object.keys(Components)) {
        Components[componentName] = componentName;
    }
    return Components;
});

test('Renders without tables', async () => {
    const tree = renderer.create(<TableResults {...tableResultsPropsEmpty} />).toJSON();
    expect(tree).toMatchSnapshot();
});

test('Renders error message when currentStatus is error', async () => {
    const tree = renderer.create(<TableResults {...tableResultsPropsFailed} />).toJSON();
    expect(tree).toMatchSnapshot();
});

test('Renders loading message when currentStatus is loading', async () => {
    const tree = renderer.create(<TableResults {...tableResultsPropsLoading} />).toJSON();
    expect(tree).toMatchSnapshot();
});

test('Renders tables with page numbers shown for multi-page', async () => {
    const tree = renderer.create(<TableResults {...tableResultsProps} />).toJSON();
    expect(tree).toMatchSnapshot();
});
