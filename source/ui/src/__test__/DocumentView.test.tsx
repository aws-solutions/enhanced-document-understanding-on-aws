// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import createWrapper from '@cloudscape-design/components/test-utils/dom';
import '@testing-library/jest-dom';
import { screen, waitFor } from '@testing-library/react';
import { API } from 'aws-amplify';
import { API_NAME, InferenceName } from '../utils/constants';
import DocumentView from '../components/DocumentView/DocumentView';
import { renderWithProviders } from './utils/tesUtils';

const mockAPI = {
    get: jest.fn(),
    post: jest.fn()
};
jest.mock('@aws-amplify/api');
API.get = mockAPI.get;
API.post = mockAPI.post;
const documentViewProps = {
    selectedDocumentId: 'fake-doc-id',
    selectedCaseId: 'fake-case-id',
    selectedDocumentFileType: 'jpg',
    selectedCaseName: 'fake-case-name',
    selectedDocumentName: 'fake-doc-name',
    setSelectedCaseId: jest.fn,
    setSelectedDocumentId: jest.fn,
    setSelectedDocumentFileType: jest.fn,
    setSelectedCaseName: jest.fn,
    setSelectedDocumentName: jest.fn
};
jest.mock('../components/DocumentTable/DocumentTable', () => ({
    generateToken: () => 'fake-jwt-token'
}));

jest.mock('react-pdf', () => ({
    pdfjs: { GlobalWorkerOptions: { workerSrc: 'abc' } },
    Document: ({ onLoadSuccess = (pdf = { numPages: 4 }) => pdf.numPages }) => {
        return <div>{onLoadSuccess({ numPages: 4 })}</div>;
    },
    Outline: null,
    Page: () => <div>def</div>
}));

beforeEach(() => {
    mockAPI.get.mockReset();
});

const getDocumentResponse = {
    key: 'fake-key'
};

const getSignedUrlResponse = {
    downloadUrl: 'fake-url'
};

test('API call to renderWithProviders default DocumentView', async () => {
    renderWithProviders(<DocumentView {...documentViewProps} />);

    expect(screen.getAllByText('Medical Entity Detection')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Entity Detection')[0]).toBeInTheDocument();
    expect(screen.getAllByText('PII Detection')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Raw Text')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Key-Value Pairs')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Tables')[0]).toBeInTheDocument();
});

test('API call to renderWithProviders default DocumentView with different set of inference combinations', async () => {
    renderWithProviders(<DocumentView {...documentViewProps} />);
    expect(screen.getAllByText('Entity Detection')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Medical Entity Detection')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Raw Text')[0]).toBeInTheDocument();
    expect(screen.getAllByText('PII Detection')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Key-Value Pairs')[0]).toBeInTheDocument();
});

test('switches between tabs successfully', async () => {
    mockAPI.get.mockResolvedValueOnce(getSignedUrlResponse).mockResolvedValueOnce(getSignedUrlResponse);
    mockAPI.get.mockResolvedValueOnce(getSignedUrlResponse).mockResolvedValueOnce(getSignedUrlResponse);
    renderWithProviders(<DocumentView {...documentViewProps} />);
    await waitFor(async () => {
        expect(screen.getByTestId('document-view-box')).toBeInTheDocument();
    });

    const boxElement = screen.getByTestId('document-view-box');
    const tabs = createWrapper(boxElement).findTabs();
    const tabLinks = tabs?.findTabLinks();
    const tabNames = [
        'Entity Detection',
        'Medical Entity Detection',
        'PII Detection',
        'Raw Text',
        'Key-Value Pairs',
        'Tables',
        'Redaction'
    ];
    for (let i = 0; i < tabLinks!.length - 1; i++) {
        tabLinks![i].click();
        expect(tabs?.findActiveTab()?.getElement().innerHTML).toContain(tabNames[i]);
    }
});

test('On clicking info tools panel should appear', async () => {
    mockAPI.get.mockResolvedValueOnce(getSignedUrlResponse).mockResolvedValueOnce(getSignedUrlResponse);
    mockAPI.get.mockResolvedValueOnce(getSignedUrlResponse).mockResolvedValueOnce(getSignedUrlResponse);
    renderWithProviders(<DocumentView {...documentViewProps} />);
    await waitFor(async () => {
        expect(screen.getByTestId('document-view-app-layout')).toBeInTheDocument();
    });

    const appLayout = screen.getByTestId('document-view-app-layout');
    const header = createWrapper(appLayout).findHeader();
    const infoLink = header?.findInfo();
    infoLink!.click();

    expect(screen.getByTestId('document-results-info-panel')).toBeInTheDocument();
});
