// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { StatusIndicatorProps } from '@cloudscape-design/components';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { tables } from './test_data';
import TableResults from '../components/TableResults/TableResults';

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

test('Renders without tables', async () => {
    const view = render(<TableResults {...tableResultsPropsEmpty} />);
    expect(view.container).toMatchSnapshot();
    expect(screen.getByTestId('tables-nodata')).toBeInTheDocument();
    expect(screen.getByTestId('tables-nodata').textContent).toBe('No Tables detected');
});

test('Renders error message when currentStatus is error', async () => {
    render(<TableResults {...tableResultsPropsFailed} />);
    expect(screen.getByTestId('tables-status-only').textContent).toBe(' An error occurred loading table results. ');
});

test('Renders loading message when currentStatus is loading', async () => {
    render(<TableResults {...tableResultsPropsLoading} />);
    expect(screen.getByTestId('tables-status-only').textContent).toBe(' Loading ');
});

test('Renders tables with page numbers shown for multi-page', async () => {
    render(<TableResults {...tableResultsProps} />);
    expect(await screen.findByText('Tables: 2 Found')).toBeInTheDocument();
    expect(await screen.findByText('Page 1')).toBeInTheDocument();
    expect(await screen.findByText('Table 1 : 2 rows')).toBeInTheDocument();
    expect(await screen.findByText('Page 2')).toBeInTheDocument();
    expect(await screen.findByText('Table 1 : 1 rows')).toBeInTheDocument();
});

test('calls switchPage when a line is clicked', async () => {
    render(<TableResults {...tableResultsProps} />);
    const line = await screen.findByText('Table 1 : 1 rows');
    line.click();
    expect(tableResultsProps.switchPage).toHaveBeenCalledWith(2);
});
