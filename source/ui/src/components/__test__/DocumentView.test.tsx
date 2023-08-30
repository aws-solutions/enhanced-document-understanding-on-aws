/**********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the "license" file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

import createWrapper from '@cloudscape-design/components/test-utils/dom';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { API } from 'aws-amplify';
import { API_NAME, InferenceName } from '../../utils/constants';
import DocumentView from '../DocumentView/DocumentView';

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
jest.mock('../DocumentTable/DocumentTable', () => ({
    generateToken: () => 'fake-jwt-token'
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

test('API call to render default DocumentView', async () => {
    mockAPI.get
        .mockResolvedValueOnce([
            'textract-detectText',
            'entity-standard-locations',
            'entity-pii-locations',
            'entity-medical-locations'
        ])
        .mockResolvedValueOnce(getDocumentResponse)
        .mockResolvedValueOnce(getSignedUrlResponse);

    render(<DocumentView {...documentViewProps} />);

    expect(screen.getAllByText('Medical Entity Detection')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Entity Detection')[0]).toBeInTheDocument();
    expect(screen.getAllByText('PII Detection')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Raw Text')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Key-Value Pairs')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Tables')[0]).toBeInTheDocument();

    await waitFor(async () => {
        expect(mockAPI.get).toHaveBeenCalledTimes(7);
    });

    expect(mockAPI.get).toHaveBeenCalledWith(
        API_NAME,
        `inferences/${documentViewProps.selectedCaseId}/${documentViewProps.selectedDocumentId}`,
        {
            headers: {
                Authorization: 'fake-jwt-token'
            },
            queryStringParameters: {}
        }
    );

    expect(mockAPI.get).toHaveBeenCalledWith(
        API_NAME,
        `document/${documentViewProps.selectedCaseId}/${documentViewProps.selectedDocumentId}`,
        {
            headers: {
                Authorization: 'fake-jwt-token'
            },
            queryStringParameters: { redacted: false }
        }
    );

    expect(mockAPI.get).toHaveBeenCalledWith(API_NAME, `document/download`, {
        headers: {
            Authorization: 'fake-jwt-token'
        },
        queryStringParameters: { key: 'fake-key' }
    });

    expect(mockAPI.get).toHaveBeenCalledWith(
        API_NAME,
        `inferences/${documentViewProps.selectedCaseId}/${documentViewProps.selectedDocumentId}/${InferenceName.TEXTRACT_DETECT_TEXT}`,
        {
            headers: {
                Authorization: 'fake-jwt-token'
            },
            queryStringParameters: {}
        }
    );

    expect(mockAPI.get).toHaveBeenCalledWith(
        API_NAME,
        `inferences/${documentViewProps.selectedCaseId}/${documentViewProps.selectedDocumentId}/${InferenceName.COMPREHEND_GENERIC}`,
        {
            headers: {
                Authorization: 'fake-jwt-token'
            },
            queryStringParameters: {}
        }
    );

    expect(mockAPI.get).toHaveBeenCalledWith(
        API_NAME,
        `inferences/${documentViewProps.selectedCaseId}/${documentViewProps.selectedDocumentId}/${InferenceName.COMPREHEND_PII}`,
        {
            headers: {
                Authorization: 'fake-jwt-token'
            },
            queryStringParameters: {}
        }
    );

    expect(mockAPI.get).toHaveBeenCalledWith(
        API_NAME,
        `inferences/${documentViewProps.selectedCaseId}/${documentViewProps.selectedDocumentId}/${InferenceName.COMPREHEND_MEDICAL}`,
        {
            headers: {
                Authorization: 'fake-jwt-token'
            },
            queryStringParameters: {}
        }
    );
});

test('API call to render default DocumentView with different set of inference combinations', async () => {
    mockAPI.get
        .mockResolvedValueOnce(['textract-detectText', 'entity-medical-locations'])
        .mockResolvedValueOnce(getDocumentResponse)
        .mockResolvedValueOnce(getSignedUrlResponse);
    render(<DocumentView {...documentViewProps} />);

    expect(screen.getAllByText('Entity Detection')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Medical Entity Detection')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Raw Text')[0]).toBeInTheDocument();
    expect(screen.getAllByText('PII Detection')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Key-Value Pairs')[0]).toBeInTheDocument();

    await waitFor(async () => {
        expect(mockAPI.get).toHaveBeenCalledTimes(5);
    });

    expect(mockAPI.get).toHaveBeenCalledWith(
        API_NAME,
        `inferences/${documentViewProps.selectedCaseId}/${documentViewProps.selectedDocumentId}`,
        {
            headers: {
                Authorization: 'fake-jwt-token'
            },
            queryStringParameters: {}
        }
    );

    expect(mockAPI.get).toHaveBeenCalledWith(
        API_NAME,
        `document/${documentViewProps.selectedCaseId}/${documentViewProps.selectedDocumentId}`,
        {
            headers: {
                Authorization: 'fake-jwt-token'
            },
            queryStringParameters: { redacted: false }
        }
    );

    expect(mockAPI.get).toHaveBeenCalledWith(API_NAME, `document/download`, {
        headers: {
            Authorization: 'fake-jwt-token'
        },
        queryStringParameters: { key: 'fake-key' }
    });

    expect(mockAPI.get).toHaveBeenCalledWith(
        API_NAME,
        `inferences/${documentViewProps.selectedCaseId}/${documentViewProps.selectedDocumentId}/${InferenceName.TEXTRACT_DETECT_TEXT}`,
        {
            headers: {
                Authorization: 'fake-jwt-token'
            },
            queryStringParameters: {}
        }
    );

    expect(mockAPI.get).toHaveBeenCalledWith(
        API_NAME,
        `inferences/${documentViewProps.selectedCaseId}/${documentViewProps.selectedDocumentId}/${InferenceName.COMPREHEND_MEDICAL}`,
        {
            headers: {
                Authorization: 'fake-jwt-token'
            },
            queryStringParameters: {}
        }
    );
});

test('switches between tabs successfully', async () => {
    mockAPI.get.mockResolvedValueOnce(getSignedUrlResponse).mockResolvedValueOnce(getSignedUrlResponse);
    mockAPI.get.mockResolvedValueOnce(getSignedUrlResponse).mockResolvedValueOnce(getSignedUrlResponse);
    render(<DocumentView {...documentViewProps} />);
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

test('On clicking info tools panel should apprear', async () => {
    mockAPI.get.mockResolvedValueOnce(getSignedUrlResponse).mockResolvedValueOnce(getSignedUrlResponse);
    mockAPI.get.mockResolvedValueOnce(getSignedUrlResponse).mockResolvedValueOnce(getSignedUrlResponse);
    render(<DocumentView {...documentViewProps} />);
    await waitFor(async () => {
        expect(screen.getByTestId('document-view-app-layout')).toBeInTheDocument();
    });

    const appLayout = screen.getByTestId('document-view-app-layout');
    const header = createWrapper(appLayout).findHeader();
    const infoLink = header?.findInfo();
    infoLink!.click();

    expect(screen.getByTestId('document-results-info-panel')).toBeInTheDocument();
});
