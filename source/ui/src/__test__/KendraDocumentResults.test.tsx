// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import KendraDocumentResults from '../components/SearchView/Kendra/KendraDocumentResults';

describe('KendraDocumentResults', () => {
    const results = [
        { Id: 1, DocumentId: 'doc1', DocumentExcerpt: 'Document excerpt 1' },
        { Id: 2, DocumentId: 'doc2', DocumentExcerpt: 'Document excerpt 2' }
    ];
    const casesList = [
        {
            caseDocuments: [{ name: 'doc1' }],
            caseId: 1,
            caseName: 'Case 1'
        },
        {
            caseDocuments: [{ name: 'doc3' }],
            caseId: 2,
            caseName: 'Case 2'
        }
    ];
    const setSelectedCaseId = jest.fn();
    const setSelectedDocumentId = jest.fn();
    const setSelectedDocumentFileType = jest.fn();
    it('renders the KendraResultTitle and KendraHighlightedText for each result', () => {
        render(
            <MemoryRouter>
                <KendraDocumentResults
                    results={results}
                    casesList={casesList}
                    setSelectedCaseId={setSelectedCaseId}
                    setSelectedDocumentId={setSelectedDocumentId}
                    setSelectedDocumentFileType={setSelectedDocumentFileType}
                />
            </MemoryRouter>
        );
        expect(screen.getAllByTestId('kendra-result-title')).toHaveLength(2);
        expect(screen.getAllByTestId('kendra-highlighted-text')).toHaveLength(2);
    });
});
