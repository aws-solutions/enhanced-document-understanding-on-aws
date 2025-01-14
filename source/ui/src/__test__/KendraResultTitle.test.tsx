// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import KendraResultTitle from '../components/SearchView/Kendra/KendraResultTitle';

const mockResult = {
    DocumentTitle: { Text: 'Example title' },
    DocumentId: 'doc-id-1',
    DocumentURI: 'fake-uri'
};

const mockCaseObject = {
    name: 'Example case',
    caseDocuments: [
        { name: 'doc-1', fileType: 'pdf', docId: 'doc-id-1' },
        { name: 'doc-2', fileType: 'docx', docId: 'doc-id-2' }
    ],
    caseId: 'case-id-1'
};

const mockSetSelectedCaseId = jest.fn();
const mockSetSelectedDocumentId = jest.fn();
const mockSetSelectedDocumentFileType = jest.fn();

jest.mock('react-router-dom', () => ({
    useNavigate: () => jest.fn()
}));

describe('KendraResultTitle', () => {
    it('renders the document title if present', () => {
        render(
            <KendraResultTitle
                result={mockResult}
                caseObject={null}
                setSelectedCaseId={mockSetSelectedCaseId}
                setSelectedDocumentId={mockSetSelectedDocumentId}
                setSelectedDocumentFileType={mockSetSelectedDocumentFileType}
            />
        );
        expect(screen.getByText('Example title')).toBeInTheDocument();
    });

    it('renders the document URI if title is not present', () => {
        const mockResultWithoutTitle = { ...mockResult, DocumentTitle: null };
        render(
            <KendraResultTitle
                result={mockResultWithoutTitle}
                caseObject={null}
                setSelectedCaseId={mockSetSelectedCaseId}
                setSelectedDocumentId={mockSetSelectedDocumentId}
                setSelectedDocumentFileType={mockSetSelectedDocumentFileType}
            />
        );
        expect(screen.getByText('fake-uri')).toBeInTheDocument();
    });

    it('does not render if neither document title nor URI is present', () => {
        const mockResultWithoutTitle = { ...mockResult, DocumentTitle: null, DocumentURI: null };
        render(
            <KendraResultTitle
                result={mockResultWithoutTitle}
                caseObject={null}
                setSelectedCaseId={mockSetSelectedCaseId}
                setSelectedDocumentId={mockSetSelectedDocumentId}
                setSelectedDocumentFileType={mockSetSelectedDocumentFileType}
            />
        );
        expect(screen.queryByText('Example title')).not.toBeInTheDocument();
        expect(screen.queryByText('fake-uri')).not.toBeInTheDocument();
    });

    it('calls the setSelectedCaseId, setSelectedDocumentId, setSelectedDocumentFileType, and navigate functions when document title is clicked', () => {
        const mockNavigate = jest.fn();
        jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);
        render(
            <KendraResultTitle
                result={mockResult}
                caseObject={mockCaseObject}
                setSelectedCaseId={mockSetSelectedCaseId}
                setSelectedDocumentId={mockSetSelectedDocumentId}
                setSelectedDocumentFileType={mockSetSelectedDocumentFileType}
            />
        );
        const button = screen.getByRole('button');
        fireEvent.click(button);
        expect(mockSetSelectedCaseId).toHaveBeenCalledWith('case-id-1');
        expect(mockSetSelectedDocumentId).toHaveBeenCalledWith('doc-id-1');
        expect(mockSetSelectedDocumentFileType).toHaveBeenCalledWith('pdf');
        expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/case-id-1/document/doc-id-1'));
    });
});
