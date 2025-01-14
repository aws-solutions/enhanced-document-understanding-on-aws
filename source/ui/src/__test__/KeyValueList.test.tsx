// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
