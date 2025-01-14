// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import kendraQueryResponse from '../test_data/kendra/kendraQueryResponse.json';
import KendraResultPage from '../components/SearchView/Kendra/KendraResultPage';

describe('KendraResultPage', () => {
    it('renders the title if provided', () => {
        const title = 'Example Title';
        render(
            <MemoryRouter>
                <KendraResultPage
                    title={title}
                    results={kendraQueryResponse.ResultItems}
                    casesList={[]}
                    setSelectedCaseId={() => {}}
                    setSelectedDocumentId={() => {}}
                    setSelectedDocumentFileType={() => {}}
                />
            </MemoryRouter>
        );
        expect(screen.getByText(title)).toBeInTheDocument();
    });

    it('renders the KendraDocumentResults component with filtered results and cases list', () => {
        const casesList = [
            {
                caseDocuments: [{ name: 'doc-8613454d-537e-4d20-bd96-300890584d20' }],
                caseId: 1,
                caseName: 'Example case 1'
            },
            {
                caseDocuments: [{ name: 'doc3' }],
                caseId: 2,
                caseName: 'Example case 2'
            }
        ];
        render(
            <MemoryRouter>
                <KendraResultPage
                    title="Example Title"
                    results={kendraQueryResponse.ResultItems}
                    casesList={casesList}
                    setSelectedCaseId={() => {}}
                    setSelectedDocumentId={() => {}}
                    setSelectedDocumentFileType={() => {}}
                />
            </MemoryRouter>
        );
        expect(screen.getByText('doc-8613454d-537e-4d20-bd96-300890584d20')).toBeInTheDocument();
    });
});
