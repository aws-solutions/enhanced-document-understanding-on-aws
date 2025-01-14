// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { StatusIndicatorProps } from '@cloudscape-design/components';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import RawTextLines from '../components/RawTextLines/RawTextLines';
import { renderWithProviders } from './utils/tesUtils';

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

const rawTextLinesProps2PageFailed = {
    currentPageNumber: 0,
    documentPageCount: 0,
    documentLines: [],
    switchPage: jest.fn(),
    currentStatus: 'error' as StatusIndicatorProps.Type
};

const rawTextLinesProps2PageLoading = {
    currentPageNumber: 0,
    documentPageCount: 0,
    documentLines: [],
    switchPage: jest.fn(),
    currentStatus: 'loading' as StatusIndicatorProps.Type
};

test('Renders without lines', async () => {
    renderWithProviders(<RawTextLines {...rawTextLinesPropsNoLines} />, { routerProvided: false });
    await waitFor(async () => {
        expect((await screen.findByTestId('raw-text-nodata')).textContent).toBe('No Raw Text detected');
    });
});

test('Renders error message when status is error', async () => {
    renderWithProviders(<RawTextLines {...rawTextLinesProps2PageFailed} />, { routerProvided: false });
    await waitFor(async () => {
        expect(screen.getByTestId('raw-text-status-only').textContent).toBe(' An error occurred loading raw text. ');
    });
});

test('Renders loading message when status is loading', async () => {
    renderWithProviders(<RawTextLines {...rawTextLinesProps2PageLoading} />, { routerProvided: false });
    await waitFor(async () => {
        expect(screen.getByTestId('raw-text-status-only').textContent).toBe(' Loading ');
    });
});

test('Renders raw text lines with page number listed for multi-page', async () => {
    renderWithProviders(<RawTextLines {...rawTextLinesProps2Page} />, { routerProvided: false });

    await waitFor(async () => {
        expect(await screen.findByText('Page 1')).toBeInTheDocument();
        expect(await screen.findByText('A Simple PDF File')).toBeInTheDocument();
        expect(await screen.findByText('Page 2')).toBeInTheDocument();
        expect(await screen.findByText('This is a small demonstration .pdf file -')).toBeInTheDocument();
    });
});

test('Renders failed for multi-page', async () => {
    renderWithProviders(<RawTextLines {...rawTextLinesProps2PageFailed} />, { routerProvided: false });
    await waitFor(async () => {
        expect(screen.getByTestId('raw-text-status-only').textContent).toBe(' An error occurred loading raw text. ');
    });
});

test('Renders loading for multi-page', async () => {
    renderWithProviders(<RawTextLines {...rawTextLinesProps2PageLoading} />, { routerProvided: false });
    await waitFor(async () => {
        expect(screen.getByTestId('raw-text-status-only').textContent).toBe(' Loading ');
    });
});

test('calls switchPage when a line is clicked', async () => {
    renderWithProviders(<RawTextLines {...rawTextLinesProps2Page} />, { routerProvided: false });
    await waitFor(async () => {
        const line = await screen.findByText('A Simple PDF File');
        line.click();
        expect(rawTextLinesProps2Page.switchPage).toHaveBeenCalledWith(1);
    });
});
