/**********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/
import createWrapper from '@cloudscape-design/components/test-utils/dom';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { API } from 'aws-amplify';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import kendraQueryResponse from '../../test_data/kendra/kendraQueryResponse.json';
import SearchView from '../SearchView/SearchView';

const mockAPI = {
    get: jest.fn()
};
jest.mock('@aws-amplify/api');
API.get = mockAPI.get;

jest.mock('../DocumentTable/DocumentTable', () => ({
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
        setCasesList: jest.fn(),
        caseName: '',
        setSelectedCaseId: jest.fn(),
        setSelectedDocumentId: jest.fn(),
        setSelectedDocumentFileType: jest.fn()
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

    it('should render correctly', () => {
        render(
            <MemoryRouter initialEntries={['/search']}>
                <Routes>
                    <Route path="/search" element={<SearchView {...propsWithCases} />} />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByTestId('kendra-search-button')).toBeInTheDocument();
        expect(screen.getByTestId('search-view-form')).toBeInTheDocument();
        expect(screen.getByTestId('case-selection-field')).toBeInTheDocument();
        expect(screen.getByTestId('search-case-multiselect')).toBeInTheDocument();
        expect(screen.getByTestId('search-field')).toBeInTheDocument();
    });

    it('should display "No documents found" message when documentsTotal is 0', () => {
        props.casesList = [];
        render(
            <MemoryRouter initialEntries={['/search']}>
                <Routes>
                    <Route path="/uploadDocument" element={<div>upload document</div>} />
                    <Route path="/search" element={<SearchView {...props} />} />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByText('No documents found.')).toBeInTheDocument();
    });

    it('should display "Add a new Document" button when documentsTotal is 0', () => {
        props.casesList = [];
        render(
            <MemoryRouter initialEntries={['/search']}>
                <Routes>
                    <Route path="/uploadDocument" element={<div>upload document</div>} />
                    <Route path="/search" element={<SearchView {...props} />} />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByText('Add a new Document')).toBeInTheDocument();
    });

    it('should call navigate when "Add a new Document" button is clicked', async () => {
        props.casesList = [];
        render(
            <MemoryRouter initialEntries={['/search']}>
                <Routes>
                    <Route path="/uploadDocument" element={<div>upload document</div>} />
                    <Route path="/search" element={<SearchView {...props} />} />
                </Routes>
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText('Add a new Document'));

        await waitFor(async () => {
            expect(screen.getByText('upload document')).toBeInTheDocument();
        });
    });

    it('should not display "No documents found" message when documentsTotal is not 0', () => {
        render(
            <MemoryRouter initialEntries={['/search']}>
                <Routes>
                    <Route path="/uploadDocument" element={<div>upload document</div>} />
                    <Route path="/search" element={<SearchView {...propsWithCases} />} />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.queryByText('No documents found.')).toBeNull();
    });

    it('should display search results when search is submitted', async () => {
        mockAPI.get.mockResolvedValueOnce(kendraQueryResponse);
        const { rerender } = render(
            <MemoryRouter initialEntries={['/search']}>
                <Routes>
                    <Route path="/uploadDocument" element={<div>upload document</div>} />
                    <Route path="/search" element={<SearchView {...propsWithCases} />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(async () => {
            expect(screen.getByTestId('search-field')).toBeInTheDocument();
        });
        const searchFieldElement = screen.getByTestId('search-field');
        const searchInput = createWrapper(searchFieldElement).findInput();
        searchInput?.setInputValue('fake-search-name');
        fireEvent.click(screen.getByTestId('kendra-search-button'));

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

        await waitFor(async () => {
            expect(mockAPI.get).toHaveBeenCalledTimes(1);
        });
    });

    it('should not display error message when search query is long enough', () => {
        props.searchValue = 'test';
        render(
            <MemoryRouter initialEntries={['/search']}>
                <Routes>
                    <Route path="/uploadDocument" element={<div>upload document</div>} />
                    <Route path="/search" element={<SearchView {...props} />} />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.queryByText('Enter a search query longer than')).not.toBeInTheDocument();
    });

    it('should allow case selection', async () => {
        mockAPI.get.mockResolvedValueOnce(kendraQueryResponse);
        render(
            <MemoryRouter initialEntries={['/search']}>
                <Routes>
                    <Route path="/uploadDocument" element={<div>upload document</div>} />
                    <Route path="/search" element={<SearchView {...propsWithCases} />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(async () => {
            expect(screen.getByTestId('case-selection-field')).toBeInTheDocument();
        });
        const caseSelectField = screen.getByTestId('case-selection-field');
        const caseSelect = createWrapper(caseSelectField).findMultiselect();
        caseSelect?.openDropdown();
        caseSelect?.selectOptionByValue('case1-id');
        caseSelect?.openDropdown();
        expect(caseSelect?.findDropdown().getElement().innerHTML).toContain('case1');
    });
});
