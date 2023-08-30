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
import renderer from 'react-test-renderer';
import { StatusIndicatorProps } from '@cloudscape-design/components';
import KeyValueList from '../../KeyValueList';
import { kvPairs } from '../../../__test__/test_data';

const kvProps = {
    currentPageNumber: 1,
    documentPageCount: 4,
    kvPairs: kvPairs,
    switchPage: jest.fn(),
    currentStatus: 'success' as StatusIndicatorProps.Type
};

const kvPropsEmpty = {
    currentPageNumber: 1,
    documentPageCount: 4,
    kvPairs: [],
    switchPage: jest.fn(),
    currentStatus: 'success' as StatusIndicatorProps.Type
};

const kvPropsFailed = {
    currentPageNumber: 0,
    documentPageCount: 0,
    kvPairs: [],
    switchPage: jest.fn(),
    currentStatus: 'error' as StatusIndicatorProps.Type
};

const kvPropsLoading = {
    currentPageNumber: 0,
    documentPageCount: 0,
    kvPairs: [],
    switchPage: jest.fn(),
    currentStatus: 'loading' as StatusIndicatorProps.Type
};

jest.mock('@cloudscape-design/components', () => {
    const Components = jest.genMockFromModule('@cloudscape-design/components') as any;
    for (const componentName of Object.keys(Components)) {
        Components[componentName] = componentName;
    }
    return Components;
});

test('Renders without key-value pairs', async () => {
    const tree = renderer.create(<KeyValueList {...kvPropsEmpty} />).toJSON();
    expect(tree).toMatchSnapshot();
});

test('Renders key-value pairs', async () => {
    const tree = renderer.create(<KeyValueList {...kvProps} />).toJSON();
    expect(tree).toMatchSnapshot();
});

test('Renders error when currentStatus is error', async () => {
    const tree = renderer.create(<KeyValueList {...kvPropsFailed} />).toJSON();
    expect(tree).toMatchSnapshot();
});

test('Renders loading when currentStatus is loading', async () => {
    const tree = renderer.create(<KeyValueList {...kvPropsLoading} />).toJSON();
    expect(tree).toMatchSnapshot();
});

test('Renders key-value pairs with count and page separation', async () => {
    const tree = renderer.create(<KeyValueList {...kvProps} />).toJSON();
    expect(tree).toMatchSnapshot();
});
