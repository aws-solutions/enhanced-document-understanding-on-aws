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

import '@testing-library/jest-dom';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { API } from '@aws-amplify/api';
import { Auth } from '@aws-amplify/auth';
import createWrapper from '@cloudscape-design/components/test-utils/dom';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import { API_NAME, DISPLAY_DATE_FORMAT } from '../../utils/constants';
import CreateCaseView from '../CreateCaseView/CreateCaseView';
import DocumentTable from '../DocumentTable/DocumentTable';

dayjs.extend(timezone);
const defaultTimezone = dayjs.tz.guess();
const utcDateTime = dayjs.utc('2000-01-01T00:00:00.000Z');
const localDate = utcDateTime.clone().tz(defaultTimezone).format(DISPLAY_DATE_FORMAT);

const mockAPI = {
    get: jest.fn(),
    post: jest.fn()
};
jest.mock('@aws-amplify/api');
API.get = mockAPI.get;
API.post = mockAPI.post;

const getCasesResponse = {
    Count: 4,
    ScannedCount: 4,
    Items: [
        {
            CASE_ID: { S: 'fake-case-id' },
            CASE_NAME: { S: 'fake-case-name' },
            DOCUMENT_ID: { S: '0000' },
            STATUS: { S: 'success' },
            USER_ID: { S: 'fake-user-id' },
            CREATION_TIMESTAMP: { 'S': '2000-01-01T00:00:00.000Z' }
        },
        {
            BUCKET_NAME: { S: 'fake-bucket-name' },
            CASE_ID: { S: 'fake-case-id' },
            CASE_NAME: { S: 'fake-case-name' },
            DOCUMENT_ID: { S: 'fake-doc-id1' },
            DOCUMENT_TYPE: { S: 'passport' },
            S3_KEY: {
                S: 'fake-s3-key.jpg'
            },
            UPLOADED_FILE_EXTENSION: { S: 'jpg' },
            UPLOADED_FILE_NAME: { S: 'fake-file-name' },
            USER_ID: { S: 'fake-user-id' },
            CREATION_TIMESTAMP: { 'S': '2000-01-01T00:00:00.000Z' }
        },
        {
            BUCKET_NAME: { S: 'fake-bucket-name' },
            CASE_ID: { S: 'fake-case-id' },
            CASE_NAME: { S: 'fake-case-name' },
            DOCUMENT_ID: { S: 'fake-doc-id2' },
            DOCUMENT_TYPE: { S: 'passport' },
            S3_KEY: {
                S: 'fake-s3-key.jpg'
            },
            UPLOADED_FILE_EXTENSION: { S: 'jpg' },
            UPLOADED_FILE_NAME: { S: 'fake-file-name' },
            USER_ID: { S: 'fake-user-id' },
            CREATION_TIMESTAMP: { 'S': '2000-01-01T00:00:00.000Z' }
        },
        {
            BUCKET_NAME: { S: 'fake-bucket-name' },
            CASE_ID: { S: 'fake-case-id' },
            CASE_NAME: { S: 'fake-case-name' },
            DOCUMENT_ID: { S: 'fake-doc-id3' },
            DOCUMENT_TYPE: { S: 'passport' },
            S3_KEY: {
                S: 'fake-s3-key.jpg'
            },
            UPLOADED_FILE_EXTENSION: { S: 'jpg' },
            UPLOADED_FILE_NAME: { S: 'fake-file-name' },
            USER_ID: { S: 'fake-user-id' },
            CREATION_TIMESTAMP: { 'S': '2000-01-01T00:00:00.000Z' }
        }
    ]
};

let selectedDocumentId: string | null = null;
const setSelectedDocumentId = jest.fn();
let selectedCaseId: string | null = null;
const setSelectedCaseId = jest.fn();
let selectedDocumentFileType: string | null = null;
const setSelectedDocumentFileType = jest.fn();
let casesList: any[] | null = null;
const setCasesList = jest.fn();
const setSelectedCaseName = jest.fn();
const setSelectedDocumentName = jest.fn();
const documentTableProps = {
    selectedDocumentId: selectedDocumentId,
    setSelectedDocumentId: setSelectedDocumentId,
    selectedCaseId: selectedCaseId,
    setSelectedCaseId: setSelectedCaseId,
    selectedDocumentFileType: selectedDocumentFileType,
    setSelectedDocumentFileType: setSelectedDocumentFileType,
    casesList: casesList,
    setCasesList: setCasesList,
    setSelectedCaseName: setSelectedCaseName,
    numRequiredDocuments: 20,
    setSelectedDocumentName: setSelectedDocumentName
};

beforeEach(() => {
    mockAPI.get.mockReset();
    Auth.currentAuthenticatedUser = jest.fn().mockImplementation(() => {
        return {
            getSignInUserSession: jest.fn().mockImplementation(() => {
                return {
                    getIdToken: jest.fn().mockImplementation(() => {
                        return {
                            getJwtToken: jest.fn().mockImplementation(() => {
                                return 'fake-jwt-token';
                            })
                        };
                    })
                };
            })
        };
    });
});

test('API call to render default DocumentTest', async () => {
    mockAPI.get.mockResolvedValueOnce(getCasesResponse);
    render(
        <MemoryRouter initialEntries={['/']}>
            <Routes>
                <Route path="/" element={<DocumentTable {...documentTableProps} />} />
            </Routes>
        </MemoryRouter>
    );
    await waitFor(async () => {
        expect(mockAPI.get).toHaveBeenCalledTimes(1);
    });
    expect(mockAPI.get).toHaveBeenCalledWith(API_NAME, 'cases', {
        headers: {
            Authorization: 'fake-jwt-token'
        }
    });
});

test('DocumentTable AppLayout split Panel testing', async () => {
    mockAPI.get.mockResolvedValueOnce(getCasesResponse);
    render(
        <MemoryRouter initialEntries={['/']}>
            <Routes>
                <Route path="/" element={<DocumentTable {...documentTableProps} />} />
            </Routes>
        </MemoryRouter>
    );
    await waitFor(async () => {
        expect(screen.getByTestId('document-table-applayout')).toBeInTheDocument();
    });

    const element = screen.getByTestId('document-table-applayout');
    const appLayout = createWrapper(element).findAppLayout();
    const table = createWrapper(element).findTable();
    table?.findRowSelectionArea(1)?.click();
    const splitPanel = appLayout?.findSplitPanel();

    // close button
    expect(splitPanel?.findCloseButton()).toBeDefined();
    // header
    expect(splitPanel?.findHeader().getElement().textContent).toEqual(getCasesResponse.Items[0].CASE_NAME.S);
    // assert panel is open
    expect(splitPanel?.findOpenPanelBottom()).toBeDefined();
    // table of documents
    const documentTable = createWrapper(element).findTable('[data-testid="document-table-splitpanel-table"]');
    // rows
    expect(documentTable?.findRows()).toHaveLength(3);
    // cells
    expect(documentTable?.findBodyCell(1, 1)?.getElement().textContent).toEqual(
        getCasesResponse.Items[1].UPLOADED_FILE_NAME!.S
    );
    expect(documentTable?.findBodyCell(1, 2)?.getElement().textContent).toEqual(
        getCasesResponse.Items[1].DOCUMENT_ID.S
    );
    expect(documentTable?.findBodyCell(1, 3)?.getElement()?.textContent).toEqual(localDate);
    expect(documentTable?.findBodyCell(1, 4)?.getElement().textContent).toEqual('jpg');
    expect(documentTable?.findBodyCell(1, 5)?.getElement().textContent).toEqual(undefined);
    // column headers
    expect(documentTable?.findColumnHeaders()).toHaveLength(4);
    expect(documentTable?.findColumnHeaders()[0].getElement().textContent).toEqual('Document Name');
    expect(documentTable?.findColumnHeaders()[1].getElement().textContent).toEqual('Document ID');
    expect(documentTable?.findColumnHeaders()[2].getElement().textContent).toEqual('Creation Date');
    expect(documentTable?.findColumnHeaders()[3].getElement().textContent).toEqual('File type');
});

test('Cases table testing', async () => {
    mockAPI.get.mockResolvedValueOnce(getCasesResponse);
    render(
        <MemoryRouter initialEntries={['/']}>
            <Routes>
                <Route path="/" element={<DocumentTable {...documentTableProps} />} />
            </Routes>
        </MemoryRouter>
    );
    await waitFor(async () => {
        expect(screen.getByTestId('document-table-cases-table')).toBeInTheDocument();
    });
    const element = screen.getByTestId('document-table-applayout');

    expect(await screen.findByText('fake-case-id')).toBeInTheDocument();
    const table = createWrapper(element).findTable();

    // rows
    expect(table?.findRows()[0].getElement().innerHTML).toContain('fake-case-id');
    expect(table?.findRows()).toHaveLength(1);
    // cells
    expect(table?.findBodyCell(1, 2)?.getElement().textContent).toEqual(getCasesResponse.Items[1].CASE_NAME.S);
    expect(table?.findBodyCell(1, 3)?.getElement().textContent).toEqual(getCasesResponse.Items[1].CASE_ID.S);
    expect(table?.findBodyCell(1, 4)?.getElement().textContent).toEqual(localDate);
    expect(table?.findBodyCell(1, 5)?.getElement().textContent).toEqual('3');
    // header
    expect(table?.findHeaderSlot()?.getElement()).toHaveTextContent('Cases (1)');
    expect(table?.findHeaderSlot()?.findButton('[data-testid="create-case-button"]')?.getElement()).toHaveTextContent(
        'Create case'
    );
    // pagination
    expect(table?.findPagination()?.findPageNumbers()).toHaveLength(1);
    // text filter (search)
    expect(table?.findTextFilter()).not.toBeNull();
    expect(table?.findTextFilter()?.getElement().innerHTML).toContain('Find cases');
    // column headers
    // 0th header is for the radio buttons
    expect(table?.findColumnHeaders()).toHaveLength(6);
    expect(table?.findColumnHeaders()[1].getElement().textContent).toEqual('Case Name');
    expect(table?.findColumnHeaders()[2].getElement().textContent).toEqual('Case ID');
    expect(table?.findColumnHeaders()[3].getElement().textContent).toEqual('Creation Date');
    expect(table?.findColumnHeaders()[4].getElement().textContent).toEqual('Number of documents');
    expect(table?.findColumnHeaders()[5].getElement().textContent).toEqual('Status');
    // row select radio button
    expect(table?.findRowSelectionArea(1)).toBeDefined();
});

test('navigate to document page when document is clicked', async () => {
    mockAPI.get.mockResolvedValueOnce(getCasesResponse);
    setSelectedDocumentId.mockImplementation((val) => (selectedDocumentId = val));
    setSelectedCaseId.mockImplementation((val) => (selectedCaseId = val));
    setSelectedDocumentFileType.mockImplementation((val) => (selectedDocumentFileType = val));
    render(
        <MemoryRouter initialEntries={['/']}>
            <Routes>
                <Route path="/" element={<DocumentTable {...documentTableProps} />} />
            </Routes>
        </MemoryRouter>
    );

    await waitFor(async () => {
        expect(screen.getByTestId('document-table-cases-table')).toBeInTheDocument();
    });
    const element = screen.getByTestId('document-table-applayout');
    const table = createWrapper(element).findTable();
    table?.findRowSelectionArea(1)?.click();
    const documentTable = createWrapper(element).findTable('[data-testid="document-table-splitpanel-table"]');
    documentTable?.findBodyCell(1, 1)?.findButton()?.click();
    expect(setSelectedDocumentId).toHaveBeenCalledWith(getCasesResponse.Items[1].DOCUMENT_ID.S);
    expect(selectedDocumentId).toBe(getCasesResponse.Items[1].DOCUMENT_ID.S);
    expect(setSelectedCaseId).toHaveBeenCalledWith(getCasesResponse.Items[1].CASE_ID.S);
    expect(selectedCaseId).toBe(getCasesResponse.Items[1].CASE_ID.S);
    expect(setSelectedDocumentFileType).toHaveBeenCalledWith(
        getCasesResponse.Items[1].UPLOADED_FILE_EXTENSION?.S.replace('.', '')
    );
    expect(selectedDocumentFileType).toBe(getCasesResponse.Items[1].UPLOADED_FILE_EXTENSION?.S.replace('.', ''));
});

test('navigate to upload document page when button is clicked', async () => {
    mockAPI.get.mockResolvedValueOnce(getCasesResponse);
    setSelectedDocumentId.mockImplementation((val) => (selectedDocumentId = val));
    setSelectedCaseId.mockImplementation((val) => (selectedCaseId = val));
    setSelectedDocumentFileType.mockImplementation((val) => (selectedDocumentFileType = val));
    render(
        <MemoryRouter initialEntries={['/']}>
            <Routes>
                <Route path="/" element={<DocumentTable {...documentTableProps} />} />
                <Route
                    path="/uploadDocument"
                    element={<div data-testid="upload-document-page">upload document page</div>}
                />
            </Routes>
        </MemoryRouter>
    );

    await waitFor(async () => {
        expect(screen.getByTestId('document-table-cases-table')).toBeInTheDocument();
    });
    const element = screen.getByTestId('document-table-applayout');
    const table = createWrapper(element).findTable();
    table?.findRowSelectionArea(1)?.click();

    createWrapper(element).findButton('[data-testid="document-table-upload-document"]')?.click();
    expect(screen.getByTestId('upload-document-page')).toBeInTheDocument();
});

test('navigate to case creation page when button is clicked', async () => {
    mockAPI.get.mockResolvedValueOnce(getCasesResponse);
    setSelectedDocumentId.mockImplementation((val) => (selectedDocumentId = val));
    render(
        <MemoryRouter initialEntries={['/']}>
            <Routes>
                <Route path="/" element={<DocumentTable {...documentTableProps} />} />
                <Route path="/createCase" element={<CreateCaseView />} />
            </Routes>
        </MemoryRouter>
    );
    expect(await screen.findByText('Create case')).toBeInTheDocument();
    expect(await screen.findByTestId('document-table-header')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('create-case-button'));
    expect(await screen.findByText('Case name')).toBeInTheDocument();
});

test('On clicking info tools panel should apprear', async () => {
    mockAPI.get.mockResolvedValueOnce(getCasesResponse);

    render(
        <MemoryRouter initialEntries={['/']}>
            <Routes>
                <Route path="/" element={<DocumentTable {...documentTableProps} />} />
            </Routes>
        </MemoryRouter>
    );
    await waitFor(async () => {
        expect(screen.getByTestId('document-table-applayout')).toBeInTheDocument();
    });

    const appLayout = screen.getByTestId('document-table-applayout');
    const header = createWrapper(appLayout).findHeader();
    const infoLink = header?.findInfo();
    infoLink!.click();

    expect(screen.getByTestId('case-table-info-panel')).toBeInTheDocument();
});

test('refresh cases when refresh button is clicked', async () => {
    mockAPI.get.mockResolvedValueOnce(getCasesResponse);
    render(
        <MemoryRouter initialEntries={['/']}>
            <Routes>
                <Route path="/" element={<DocumentTable {...documentTableProps} />} />
            </Routes>
        </MemoryRouter>
    );
    await waitFor(async () => {
        expect(mockAPI.get).toHaveBeenCalledTimes(1);
    });
    expect(mockAPI.get).toHaveBeenCalledWith(API_NAME, 'cases', {
        headers: {
            Authorization: 'fake-jwt-token'
        }
    });

    // clicking refresh and getting new cases
    const addedCases = [
        {
            CASE_ID: { S: 'fake-case-id-2' },
            CASE_NAME: { S: 'fake-case-name' },
            DOCUMENT_ID: { S: '0000' },
            STATUS: { S: 'success' },
            USER_ID: { S: 'fake-user-id' },
            CREATION_TIMESTAMP: { 'S': '2000-01-01T00:00:00.000Z' }
        },
        {
            BUCKET_NAME: { S: 'fake-bucket-name' },
            CASE_ID: { S: 'fake-case-id' },
            CASE_NAME: { S: 'fake-case-name' },
            DOCUMENT_ID: { S: 'fake-doc-id1' },
            DOCUMENT_TYPE: { S: 'passport' },
            S3_KEY: {
                S: 'fake-s3-key.jpg'
            },
            UPLOADED_FILE_EXTENSION: { S: 'jpg' },
            UPLOADED_FILE_NAME: { S: 'fake-file-name' },
            USER_ID: { S: 'fake-user-id' },
            CREATION_TIMESTAMP: { 'S': '2000-01-01T00:00:00.000Z' }
        }
    ];
    const secondResponse = getCasesResponse;
    secondResponse.Items.push(...addedCases);
    mockAPI.get.mockResolvedValueOnce(secondResponse);
    fireEvent.click(screen.getByTestId('refresh-cases-button'));
    await waitFor(async () => {
        expect(mockAPI.get).toHaveBeenCalledTimes(2);
    });

    // cases table rows updated
    const element = screen.getByTestId('document-table-applayout');
    expect(await screen.findByText('fake-case-id')).toBeInTheDocument();
    const table = createWrapper(element).findTable();
    expect(table?.findRows()).toHaveLength(2);
    expect(table?.findRows()[1].getElement().innerHTML).toContain('fake-case-id-2');
});
