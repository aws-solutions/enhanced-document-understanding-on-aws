// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { marks1, tables } from './test_data';
import DocumentRenderer from '../components/DocumentRenderer/DocumentRenderer';

jest.mock('react-pdf', () => ({
    pdfjs: { GlobalWorkerOptions: { workerSrc: 'abc' } },
    Document: ({ onLoadSuccess = (pdf = { numPages: 4 }) => pdf.numPages }) => {
        return <div>PDF load failed. Retrying...{onLoadSuccess({ numPages: 4 })}</div>;
    },
    Outline: null,
    Page: () => <div>def</div>
}));

jest.mock('react-pdf', () => ({
    pdfjs: { GlobalWorkerOptions: { workerSrc: 'abc' } },
    Document: ({ onLoadSuccess = (pdf = { numPages: 4 }) => pdf.numPages }) => {
        return <div>PDF load failed. Retrying...{onLoadSuccess({ numPages: 4 })}</div>;
    },
    Outline: null,
    Page: () => <div>def</div>
}));

describe('DocumentRenderer component', () => {
    it('renders the correct component when selectedDocumentFileType is pdf', async () => {
        const selectedDocumentFileType = 'pdf';
        const selectedDocumentUrl = 'fake-url';
        const currentPageNumber = 1;
        const switchPage = jest.fn();
        render(
            <DocumentRenderer
                selectedDocumentFileType={selectedDocumentFileType}
                selectedDocumentUrl={selectedDocumentUrl}
                currentPageNumber={currentPageNumber}
                switchPage={switchPage}
                marks={marks1}
                tables={tables}
                retrieveSignedUrl={jest.fn()}
            />
        );
        expect(await screen.findByText('PDF load failed. Retrying...')).toBeInTheDocument();
    });
    it('renders the correct component when selectedDocumentFileType is jpg or png', () => {
        const selectedDocumentFileType = 'jpg';
        const selectedDocumentUrl = 'fake-url';
        render(
            <DocumentRenderer
                selectedDocumentFileType={selectedDocumentFileType}
                selectedDocumentUrl={selectedDocumentUrl}
                marks={marks1}
                tables={tables}
                retrieveSignedUrl={jest.fn()}
            />
        );
        expect(screen.getByTestId('image')).toBeInTheDocument();
    });

    it('renders an error message when selectedDocumentFileType is invalid', () => {
        const selectedDocumentFileType = 'invalid';
        const selectedDocumentUrl = 'fake-url';
        render(
            <DocumentRenderer
                selectedDocumentFileType={selectedDocumentFileType}
                selectedDocumentUrl={selectedDocumentUrl}
                retrieveSignedUrl={jest.fn()}
            />
        );
        expect(screen.getByText('Invalid file type')).toBeInTheDocument();
    });
});
