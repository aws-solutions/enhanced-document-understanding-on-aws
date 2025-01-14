// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import createWrapper from '@cloudscape-design/components/test-utils/dom';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { marks1, tables } from './test_data';
import PDF, { DocumentMarks } from '../components/Pdf/Pdf';

const pdfPropsPage1 = {
    pdfUrl: 'fake-url',
    currentPageNumber: 1,
    switchPage: jest.fn(),
    marks: marks1,
    retrieveSignedUrl: jest.fn()
};

const pdfPropsPage2 = {
    pdfUrl: 'fake-url',
    currentPageNumber: 2,
    switchPage: jest.fn(),
    marks: marks1,
    retrieveSignedUrl: jest.fn()
};

pdfPropsPage1.switchPage = jest.fn().mockImplementation((newPage) => {
    pdfPropsPage1.currentPageNumber = newPage;
});

jest.mock('react-pdf', () => ({
    pdfjs: { GlobalWorkerOptions: { workerSrc: 'abc' } },
    Document: ({ onLoadSuccess = (pdf = { numPages: 4 }) => pdf.numPages }) => {
        return <div>{onLoadSuccess({ numPages: 4 })}</div>;
    },
    Outline: null,
    Page: () => <div>def</div>
}));

test('PDF component renders document with navigation buttons', async () => {
    render(<PDF {...pdfPropsPage1} />);
    await waitFor(async () => {
        expect(screen.getByTestId('pdf-box')).toBeInTheDocument();
    });
    const pdfDivElement = screen.getByTestId('pdf-box');
    const pagination = createWrapper(pdfDivElement).findPagination();
    expect(pagination?.findPageNumbers()).toHaveLength(4);
});

test('PDF should display appropriate page based on changing page number prop', async () => {
    const { rerender } = render(<PDF {...pdfPropsPage1} />);
    await waitFor(async () => {
        expect(screen.getByTestId('pdf-box')).toBeInTheDocument();
    });
    const pdfDivElement = screen.getByTestId('pdf-box');
    const pagination = createWrapper(pdfDivElement).findPagination();
    expect(pagination?.findCurrentPage().getElement().innerHTML).toContain('1');
    pagination?.findNextPageButton().click();
    expect(pdfPropsPage1.switchPage).toHaveBeenCalledTimes(1);
    expect(pdfPropsPage1.switchPage).toHaveBeenCalledWith(2);
    rerender(<PDF {...pdfPropsPage2} />);
    expect(pagination?.findCurrentPage().getElement().innerHTML).toContain('2');
    pagination?.findPreviousPageButton().click();
    expect(pdfPropsPage2.switchPage).toHaveBeenCalledTimes(1);
    expect(pdfPropsPage2.switchPage).toHaveBeenCalledWith(1);
    rerender(<PDF {...pdfPropsPage1} />);
    expect(pagination?.findCurrentPage().getElement().innerHTML).toContain('2');
});

describe('DocumentMarks', () => {
    it('renders without crashing', () => {
        render(<DocumentMarks>Test Content</DocumentMarks>);
        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders marks', () => {
        render(<DocumentMarks marks={marks1}>Test Content</DocumentMarks>);
        const marksElements = screen.getAllByTestId('document-marks');
        expect(marksElements.length).toEqual(6);
        expect(marksElements[0]).toHaveStyle({
            width: '32.5%',
            height: '0.8%',
            left: '2.9000000000000004%',
            top: '2.1999999999999997%'
        });
    });

    it('renders tables', () => {
        render(<DocumentMarks tables={tables}>Test Content</DocumentMarks>);
        const tableHighlightElements = screen.getAllByTestId('table');
        expect(tableHighlightElements.length).toEqual(2);
    });
});
