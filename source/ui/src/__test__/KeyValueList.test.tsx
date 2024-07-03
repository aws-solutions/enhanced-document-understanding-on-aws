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

import { StatusIndicatorProps } from '@cloudscape-design/components';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { kvPairs } from './test_data';
import KeyValueList from '../components/KeyValueList';

const kvProps = {
    currentPageNumber: 1,
    documentPageCount: 4,
    kvPairs: kvPairs,
    switchPage: jest.fn(),
    currentStatus: 'success' as StatusIndicatorProps.Type
};

test('Renders key-value pairs with count and page separation', async () => {
    render(<KeyValueList {...kvProps} />);
    expect(await screen.findByText('Key-Value Pairs: 2 Found')).toBeInTheDocument();
    expect(await screen.findByText('Page 1')).toBeInTheDocument();
    expect(await screen.findByText('first name')).toBeInTheDocument();
    expect(await screen.findByText('fake-name')).toBeInTheDocument();
    expect(await screen.findByText('Page 2')).toBeInTheDocument();
    expect(await screen.findByText('last name')).toBeInTheDocument();
    expect(await screen.findByText('fake-last-name')).toBeInTheDocument();
});

test('calls switchPage when a line is clicked', async () => {
    render(<KeyValueList {...kvProps} />);
    const line = await screen.findByText('last name');
    line.click();
    expect(kvProps.switchPage).toHaveBeenCalledWith(2);
});
