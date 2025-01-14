// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import createWrapper from '@cloudscape-design/components/test-utils/dom';
import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { API } from 'aws-amplify';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import kendraQueryResponse from '../test_data/kendra/kendraQueryResponse.json';
import SearchView from '../components/SearchView/SearchView';
import { renderWithProviders } from './utils/tesUtils';

const mockAPI = {
    get: jest.fn()
};
jest.mock('@aws-amplify/api');
API.get = mockAPI.get;

jest.mock('../components/DocumentTable/DocumentTable', () => ({
    generateToken: () => 'fake-jwt-token',
    getUsername: () => 'fake-username'
}));

describe('SearchView component', () => {
    const props = {
        searchValue: '',
        setSearchValue: jest.fn(),
        submittedSearchValue: '',
        setSubmittedSearchValue: jest.fn(),
        casesList: [],
        caseName: '',
        setSelectedCaseId: jest.fn(),
        setSelectedDocumentId: jest.fn(),
        setSelectedDocumentFileType: jest.fn(),
        enableKendra: true,
        enableOpenSearch: false
    };

    const propsWithCases = {
        searchValue: 'search-value',
        setSearchValue: jest.fn(),
        submittedSearchValue: '',
        setSubmittedSearchValue: jest.fn(),
        casesList: [
            {
                name: 'case1',
                caseId: 'case1-id',
                caseDocuments: [
                    { name: 'doc1', docId: 'doc-8613454d-537e-4d20-bd96-300890584d20' },
                    { name: 'doc2', docId: 'doc-cadec9c3-ea09-4157-a916-36532565dd12' }
                ]
            }
        ],
        setCasesList: jest.fn(),
        caseName: 'case1',
        setSelectedCaseId: jest.fn(),
        setSelectedDocumentId: jest.fn(),
        setSelectedDocumentFileType: jest.fn(),
        enableKendra: true,
        enableOpenSearch: false
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render correctly', async () => {
        renderWithProviders(
            <MemoryRouter initialEntries={['/search']}>
                <Routes>
                    <Route path="/search" element={<SearchView {...propsWithCases} />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(async () => {
            expect(screen.getByTestId('search-button')).toBeInTheDocument();
            expect(screen.getByTestId('search-view-form')).toBeInTheDocument();
            expect(screen.getByTestId('case-selection-field')).toBeInTheDocument();
            expect(screen.getByTestId('search-case-multiselect')).toBeInTheDocument();
            expect(screen.getByTestId('search-field')).toBeInTheDocument();
        });
    });

    it('should display "No documents found" message when documentsTotal is 0', async () => {
        props.casesList = [];
        renderWithProviders(
            <MemoryRouter initialEntries={['/search']}>
                <Routes>
                    <Route path="/uploadDocument" element={<div>upload document</div>} />
                    <Route path="/search" element={<SearchView {...props} />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(async () => {
            expect(screen.getByText('No documents found.')).toBeInTheDocument();
        });
    });

    it('should display "Add a new Document" button when documentsTotal is 0', async () => {
        props.casesList = [];
        renderWithProviders(
            <MemoryRouter initialEntries={['/search']}>
                <Routes>
                    <Route path="/uploadDocument" element={<div>upload document</div>} />
                    <Route path="/search" element={<SearchView {...props} />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(async () => {
            expect(screen.getByText('Add a new Document')).toBeInTheDocument();
        });
    });

    it('should call navigate when "Add a new Document" button is clicked', async () => {
        props.casesList = [];
        renderWithProviders(
            <MemoryRouter initialEntries={['/search']}>
                <Routes>
                    <Route path="/uploadDocument" element={<div>upload document</div>} />
                    <Route path="/search" element={<SearchView {...props} />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(async () => {
            fireEvent.click(screen.getByText('Add a new Document'));

            expect(screen.getByText('upload document')).toBeInTheDocument();
        });
    });

    it('should not display "No documents found" message when documentsTotal is not 0', async () => {
        renderWithProviders(
            <MemoryRouter initialEntries={['/search']}>
                <Routes>
                    <Route path="/uploadDocument" element={<div>upload document</div>} />
                    <Route path="/search" element={<SearchView {...propsWithCases} />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(async () => {
            expect(screen.queryByText('No documents found.')).toBeNull();
        });
    });

    it('should display search results when search is submitted', async () => {
        mockAPI.get.mockResolvedValueOnce(kendraQueryResponse);
        const { rerender } = renderWithProviders(
            <MemoryRouter initialEntries={['/search']}>
                <Routes>
                    <Route path="/uploadDocument" element={<div>upload document</div>} />
                    <Route path="/search" element={<SearchView {...propsWithCases} />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(async () => {
            expect(screen.getByTestId('search-field')).toBeInTheDocument();
            const searchFieldElement = screen.getByTestId('search-field');
            const searchInput = createWrapper(searchFieldElement).findInput();
            searchInput?.setInputValue('fake-search-name');
            fireEvent.click(screen.getByTestId('search-button'));
        });

        rerender(
            <MemoryRouter initialEntries={['/search']}>
                <Routes>
                    <Route path="/uploadDocument" element={<div>upload document</div>} />
                    <Route
                        path="/search"
                        element={<SearchView {...propsWithCases} submittedSearchValue="submitted-search-value" />}
                    />
                </Routes>
            </MemoryRouter>
        );
    });

    it('should not display error message when search query is long enough', async () => {
        props.searchValue = 'test';
        renderWithProviders(
            <MemoryRouter initialEntries={['/search']}>
                <Routes>
                    <Route path="/uploadDocument" element={<div>upload document</div>} />
                    <Route path="/search" element={<SearchView {...props} />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(async () => {
            expect(screen.queryByText('Enter a search query longer than')).not.toBeInTheDocument();
        });
    });

    it('should allow case selection', async () => {
        mockAPI.get.mockResolvedValueOnce(kendraQueryResponse);
        renderWithProviders(
            <MemoryRouter initialEntries={['/search']}>
                <Routes>
                    <Route path="/uploadDocument" element={<div>upload document</div>} />
                    <Route path="/search" element={<SearchView {...propsWithCases} />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(async () => {
            expect(screen.getByTestId('case-selection-field')).toBeInTheDocument();
            const caseSelectField = screen.getByTestId('case-selection-field');
            const caseSelect = createWrapper(caseSelectField).findMultiselect();
            caseSelect?.openDropdown();
            caseSelect?.selectOptionByValue('case1-id');
            caseSelect?.openDropdown();
            expect(caseSelect?.findDropdown().getElement().innerHTML).toContain('case1');
        });
    });
});
