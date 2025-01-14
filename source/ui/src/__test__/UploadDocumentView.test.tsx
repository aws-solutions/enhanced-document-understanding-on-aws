// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import '@testing-library/jest-dom';

import { fireEvent, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { API } from '@aws-amplify/api';
import { Auth } from '@aws-amplify/auth';
import createWrapper from '@cloudscape-design/components/test-utils/dom';
import { FileSize } from '../components/FileUpload/interfaces';
import { formatFileSize } from '../components/FileUpload/internal';
import UploadDocumentView from '../components/UploadDocumentView';
import { MAX_UPLOAD_FILE_SIZE } from '../utils/constants';
import { renderWithProviders, renderWithProvidersAndUserSetup } from './utils/tesUtils';

const mockAPI = {
    post: jest.fn(),
    get: jest.fn()
};
jest.mock('@aws-amplify/api');
API.post = mockAPI.post;
API.get = mockAPI.get;

jest.mock('../components/DocumentTable/DocumentTable', () => ({
    generateToken: () => 'fake-jwt-token',
    getUsername: () => 'fake-username'
}));

const getCasesResponse = {
    Count: 1,
    ScannedCount: 1,
    Items: [
        {
            CASE_ID: { S: 'example-caseId1' },
            CASE_NAME: { S: 'example-case1' },
            DOCUMENT_ID: { S: '0000' },
            STATUS: { S: 'initiate' },
            USER_ID: { S: 'fake-user-id' },
            CREATION_TIMESTAMP: { 'S': '2000-01-01T00:00:00.000Z' }
        }
    ]
};

beforeEach(() => {
    mockAPI.post.mockReset();
});

describe('UploadDocumentView', () => {
    const workflowConfig = {
        NumRequiredDocuments: 1,
        UniqueDocumentTypes: ['generic'],
        WorkflowConfigName: 'default'
    };
    beforeEach(() => {
        mockAPI.post.mockReset();
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

    test('renders component with default props', async () => {
        renderWithProviders(
            <MemoryRouter initialEntries={['/uploadDocument']}>
                <Routes>
                    <Route
                        path="/uploadDocument"
                        element={
                            <UploadDocumentView
                                casesList={[
                                    {
                                        name: 'example-case1',
                                        caseId: 'example-caseId1',
                                        caseDocuments: [],
                                        dateCreated: '2000-01-01T00:00:00.000Z'
                                    },
                                    {
                                        name: 'example-case2',
                                        caseId: 'example-caseId2',
                                        caseDocuments: [],
                                        dateCreated: '2000-01-01T00:00:00.000Z'
                                    }
                                ]}
                                caseName="example-case1"
                                caseId="example-caseId1"
                                workflowConfig={workflowConfig}
                                selectedCaseRemainingRequiredDocs={{}}
                            />
                        }
                    />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId('case-name-field')).toBeInTheDocument();
            expect(screen.getByTestId('upload-doc-case-select')).toBeInTheDocument();
        });
    });

    test('does not allow upload click if no documents are selected', async () => {
        renderWithProviders(
            <MemoryRouter initialEntries={['/uploadDocument']}>
                <Routes>
                    <Route
                        path="/uploadDocument"
                        element={
                            <UploadDocumentView
                                casesList={[{ name: 'Case1' }, { name: 'Case2' }]}
                                workflowConfig={workflowConfig}
                                selectedCaseRemainingRequiredDocs={{}}
                            />
                        }
                    />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            const uploadDocsButtonElement = screen.getByTestId('upload-documents-button');
            expect(uploadDocsButtonElement).toBeDisabled();
        });
    });

    test('calls the API to upload files when upload button is clicked', async () => {
        mockAPI.get.mockResolvedValueOnce(getCasesResponse);
        const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
        renderWithProviders(
            <MemoryRouter initialEntries={['/uploadDocument']}>
                <Routes>
                    <Route
                        path="/uploadDocument"
                        element={
                            <UploadDocumentView
                                casesList={[
                                    {
                                        name: 'example-case1',
                                        caseId: 'example-caseId1',
                                        caseDocuments: [],
                                        dateCreated: '2000-01-01T00:00:00.000Z'
                                    },
                                    {
                                        name: 'example-case2',
                                        caseId: 'example-caseId2',
                                        caseDocuments: [],
                                        dateCreated: '2000-01-01T00:00:00.000Z'
                                    }
                                ]}
                                caseName="example-case1"
                                caseId="example-caseId1"
                                workflowConfig={workflowConfig}
                                selectedCaseRemainingRequiredDocs={{}}
                            />
                        }
                    />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            // buttons are disabled prior to case selection
            const uploadDocsButtonElement = screen.getByTestId('upload-documents-button');
            expect(uploadDocsButtonElement).toBeDisabled();

            // selecting a file to upload
            Object.defineProperty(screen.getByTestId('choose-file-input'), 'files', {
                value: [file]
            });
            fireEvent.change(screen.getByTestId('choose-file-input'));

            // can now upload files, but not select other files
            expect(uploadDocsButtonElement).toBeEnabled();

            // click upload button, ensuring post gets called
            fireEvent.click(screen.getByTestId('upload-documents-button'));
            const uploadDocsButton = createWrapper(uploadDocsButtonElement);
            uploadDocsButton?.click();
        });
    });

    test('Does not allow files greater than the maxSizeLimit to be uploaded', async () => {
        const content = new Uint8Array(MAX_UPLOAD_FILE_SIZE + 1);
        const blob = new Blob([content], { type: 'application/pdf' });
        const fileName = 'dummy_file.pdf';
        const file = new File([blob], fileName);
        const { user, getByTestId } = renderWithProvidersAndUserSetup(
            <MemoryRouter initialEntries={['/uploadDocument']}>
                <Routes>
                    <Route
                        path="/uploadDocument"
                        element={
                            <UploadDocumentView
                                casesList={[
                                    {
                                        name: 'example-case1',
                                        caseId: 'example-caseId1',
                                        caseDocuments: [],
                                        dateCreated: '2000-01-01T00:00:00.000Z'
                                    },
                                    {
                                        name: 'example-case2',
                                        caseId: 'example-caseId2',
                                        caseDocuments: [],
                                        dateCreated: '2000-01-01T00:00:00.000Z'
                                    }
                                ]}
                                caseName="example-case1"
                                caseId="example-caseId1"
                                workflowConfig={workflowConfig}
                                selectedCaseRemainingRequiredDocs={{}}
                            />
                        }
                    />
                </Routes>
            </MemoryRouter>
        );

        // selecting a file to upload
        await waitFor(
            async () => {
                const fileUploader: any = getByTestId('choose-file-input');
                await user.upload(fileUploader, file);
                expect(fileUploader.files).toHaveLength(1);
                expect(getByTestId('choose-file-form-field')).toBeInTheDocument();
                expect(createWrapper(getByTestId('choose-file-form-field')).getElement().innerHTML).toContain(
                    'File size must be less than ' + formatFileSize(MAX_UPLOAD_FILE_SIZE, { size: FileSize.MB })
                );
            },
            { timeout: 3000 }
        );
    });

    test('displays the progress bar when files are being uploaded', async () => {
        mockAPI.get.mockResolvedValueOnce(getCasesResponse);
        const file = new File(['hello'], 'hello.pdf', { type: 'application/pdf' });
        renderWithProviders(
            <MemoryRouter initialEntries={['/uploadDocument']}>
                <Routes>
                    <Route
                        path="/uploadDocument"
                        element={
                            <UploadDocumentView
                                casesList={[
                                    {
                                        name: 'example-case1',
                                        caseId: 'example-caseId1',
                                        caseDocuments: [],
                                        dateCreated: '2000-01-01T00:00:00.000Z'
                                    }
                                ]}
                                caseName="example-case1"
                                caseId="example-caseId1"
                                workflowConfig={workflowConfig}
                                selectedCaseRemainingRequiredDocs={{}}
                            />
                        }
                    />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            Object.defineProperty(screen.getByTestId('choose-file-input'), 'files', {
                value: [file, file]
            });
            fireEvent.change(screen.getByTestId('choose-file-input'));
            fireEvent.click(screen.getByTestId('upload-documents-button'));
            expect(screen.getByTestId('upload-document-progress-bar')).toBeInTheDocument();
        });
    });
});
