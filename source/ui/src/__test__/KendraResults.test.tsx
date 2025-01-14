// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import kendraQueryResponse from '../test_data/kendra/kendraQueryResponse.json';

import KendraResults from '../components/SearchView/Kendra/KendraResults';

const results = [
    {
        id: '1',
        AdditionalAttributes: [
            {
                Key: 'AnswerText',
                Value: {
                    TextWithHighlightsValue: 'This is a test answer'
                }
            }
        ]
    }
];

const casesList = [
    {
        caseDocuments: [{ name: 'doc-8613454d-537e-4d20-bd96-300890584d20' }],
        caseId: '1',
        caseName: 'Example case 1'
    },
    {
        caseDocuments: [{ name: 'doc3' }],
        caseId: '2',
        caseName: 'Example case 2'
    }
];

describe('KendraResults', () => {
    it('renders without results', () => {
        render(
            <KendraResults
                searchQuery=""
                results={[]}
                setSelectedCaseId={() => {}}
                setSelectedDocumentId={() => {}}
                setSelectedDocumentFileType={() => {}}
                casesList={[]}
            />
        );
        expect(screen.queryByText('Amazon Kendra Results')).not.toBeInTheDocument();
    });

    it('renders with empty results', () => {
        render(
            <KendraResults
                searchQuery="test"
                results={[]}
                setSelectedCaseId={() => {}}
                setSelectedDocumentId={() => {}}
                setSelectedDocumentFileType={() => {}}
                casesList={[]}
            />
        );
        expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('renders with results', () => {
        render(
            <MemoryRouter>
                <KendraResults
                    searchQuery="test"
                    results={kendraQueryResponse.ResultItems}
                    casesList={casesList}
                    setSelectedCaseId={() => {}}
                    setSelectedDocumentId={() => {}}
                    setSelectedDocumentFileType={() => {}}
                />
            </MemoryRouter>
        );
        expect(screen.getByText('Amazon Kendra Results')).toBeInTheDocument();
        expect(screen.getByText('doc-8613454d-537e-4d20-bd96-300890584d20')).toBeInTheDocument();
    });

    it('does not render with short search query', () => {
        render(
            <KendraResults
                searchQuery=""
                results={results}
                casesList={casesList}
                setSelectedCaseId={() => {}}
                setSelectedDocumentId={() => {}}
                setSelectedDocumentFileType={() => {}}
            />
        );
        expect(screen.queryByText('Amazon Kendra Results')).not.toBeInTheDocument();
    });
});
