// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import KendraTopResults from '../components/SearchView/Kendra/KendraTopResults';

const mockResults = [
    {
        id: '1',
        AdditionalAttributes: [
            {
                Key: 'AnswerText',
                Value: {
                    TextWithHighlightsValue: { Text: 'First top result' }
                }
            }
        ],
        DocumentId: 'document1'
    },
    {
        id: '2',
        AdditionalAttributes: [
            {
                Key: 'AnswerText',
                Value: {
                    TextWithHighlightsValue: { Text: 'Second top result' }
                }
            }
        ],
        DocumentId: 'document2'
    }
];

const mockCasesList = [
    {
        name: 'case1',
        caseDocuments: [{ name: 'document1' }]
    },
    {
        name: 'case2',
        caseDocuments: [{ name: 'document2' }]
    }
];

const mockSetSelectedCaseId = jest.fn();
const mockSetSelectedDocumentId = jest.fn();
const mockSetSelectedDocumentFileType = jest.fn();

describe('KendraTopResults', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render KendraTopResults component', () => {
        render(
            <MemoryRouter>
                <KendraTopResults
                    results={mockResults}
                    casesList={mockCasesList}
                    setSelectedCaseId={mockSetSelectedCaseId}
                    setSelectedDocumentId={mockSetSelectedDocumentId}
                    setSelectedDocumentFileType={mockSetSelectedDocumentFileType}
                />
            </MemoryRouter>
        );

        expect(screen.getByText('Amazon Kendra suggested answers')).toBeInTheDocument();
        expect(screen.getByText('First top result')).toBeInTheDocument();
        expect(screen.getByText('More suggested answers (1)')).toBeInTheDocument();
    });

    it('should expand and collapse the list of suggested answers', () => {
        render(
            <MemoryRouter>
                <KendraTopResults
                    results={mockResults}
                    casesList={mockCasesList}
                    setSelectedCaseId={mockSetSelectedCaseId}
                    setSelectedDocumentId={mockSetSelectedDocumentId}
                    setSelectedDocumentFileType={mockSetSelectedDocumentFileType}
                />
            </MemoryRouter>
        );

        expect(screen.getByText('More suggested answers (1)')).toBeInTheDocument();
        expect(screen.queryByText('Second top result')).not.toBeInTheDocument();

        fireEvent.click(screen.getByText('More suggested answers (1)'));

        expect(mockSetSelectedCaseId).not.toHaveBeenCalled();
        expect(mockSetSelectedDocumentId).not.toHaveBeenCalled();
        expect(mockSetSelectedDocumentFileType).not.toHaveBeenCalled();

        expect(screen.getByText('Second top result')).toBeInTheDocument();

        fireEvent.click(screen.getByText('More suggested answers (1)'));

        expect(mockSetSelectedCaseId).not.toHaveBeenCalled();
        expect(mockSetSelectedDocumentId).not.toHaveBeenCalled();
        expect(mockSetSelectedDocumentFileType).not.toHaveBeenCalled();

        expect(screen.queryByText('Second top result')).not.toBeInTheDocument();
    });
});
