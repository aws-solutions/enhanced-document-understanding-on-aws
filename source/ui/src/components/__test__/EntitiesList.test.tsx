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

import { StatusIndicatorProps } from '@cloudscape-design/components';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { API, Auth } from 'aws-amplify';
import { allSelectedEntities, entities, entitiesToRedact } from '../../__test__/test_data';
import { API_NAME, COMPREHEND_MEDICAL_SERVICE, COMPREHEND_SERVICE, EntityTypes } from '../../utils/constants';
import EntitiesList from '../EntitiesList';

const mockSetSelectedEntities = jest.fn();
const entitiesListProps = {
    currentPageNumber: 1,
    documentPageCount: 4,
    entities: entities,
    standardEntities: entities,
    medicalEntities: entities,
    piiEntities: entities,
    switchPage: jest.fn(),
    comprehendService: COMPREHEND_SERVICE,
    entityType: EntityTypes.ENTITY_STANDARD,
    level: 1,
    maxLevels: 3,
    selectedEntities: [],
    setSelectedEntities: mockSetSelectedEntities,
    selectedCaseId: 'fake-case-id',
    selectedDocumentId: 'fake-document-id',
    previewRedaction: '',
    setPreviewRedaction: jest.fn(),
    currentStatus: 'success' as StatusIndicatorProps.Type
};

const entitiesListPropsEmpty = {
    currentPageNumber: 1,
    documentPageCount: 3,
    entities: [],
    standardEntities: [],
    medicalEntities: [],
    piiEntities: [],
    switchPage: jest.fn(),
    comprehendService: COMPREHEND_SERVICE,
    entityType: EntityTypes.ENTITY_STANDARD,
    level: 1,
    maxLevels: 3,
    selectedEntities: [],
    setSelectedEntities: mockSetSelectedEntities,
    selectedCaseId: 'fake-case-id',
    selectedDocumentId: 'fake-document-id',
    previewRedaction: '',
    setPreviewRedaction: jest.fn(),
    currentStatus: 'success' as StatusIndicatorProps.Type
};

const entitiesListPropsError = {
    currentPageNumber: 0,
    documentPageCount: 0,
    entities: [],
    standardEntities: [],
    medicalEntities: [],
    piiEntities: [],
    switchPage: jest.fn(),
    comprehendService: COMPREHEND_SERVICE,
    entityType: EntityTypes.ENTITY_STANDARD,
    level: 0,
    maxLevels: 0,
    selectedEntities: [],
    setSelectedEntities: mockSetSelectedEntities,
    selectedCaseId: 'fake-case-id',
    selectedDocumentId: 'fake-document-id',
    previewRedaction: '',
    setPreviewRedaction: jest.fn(),
    currentStatus: 'error' as StatusIndicatorProps.Type
};

const entitiesListPropsLoading = {
    currentPageNumber: 1,
    documentPageCount: 4,
    entities: entities,
    standardEntities: [],
    medicalEntities: [],
    piiEntities: [],
    switchPage: jest.fn(),
    comprehendService: COMPREHEND_SERVICE,
    entityType: EntityTypes.ENTITY_STANDARD,
    level: 1,
    maxLevels: 3,
    selectedEntities: [],
    setSelectedEntities: mockSetSelectedEntities,
    selectedCaseId: 'fake-case-id',
    selectedDocumentId: 'fake-document-id',
    previewRedaction: '',
    setPreviewRedaction: jest.fn(),
    currentStatus: 'loading' as StatusIndicatorProps.Type
};

const entitiesListPropsEmptyMedical = {
    currentPageNumber: 1,
    documentPageCount: 4,
    entities: [],
    standardEntities: [],
    medicalEntities: [],
    piiEntities: [],
    switchPage: jest.fn(),
    comprehendService: COMPREHEND_MEDICAL_SERVICE,
    entityType: EntityTypes.MEDICAL_ENTITY,
    level: 1,
    maxLevels: 3,
    selectedEntities: [],
    setSelectedEntities: mockSetSelectedEntities,
    selectedCaseId: 'fake-case-id',
    selectedDocumentId: 'fake-document-id',
    previewRedaction: '',
    setPreviewRedaction: jest.fn(),
    currentStatus: 'success' as StatusIndicatorProps.Type
};

const entitiesListPropsMedicalError = {
    currentPageNumber: 0,
    documentPageCount: 0,
    entities: [],
    standardEntities: [],
    medicalEntities: [],
    piiEntities: [],
    switchPage: jest.fn(),
    comprehendService: COMPREHEND_MEDICAL_SERVICE,
    entityType: EntityTypes.MEDICAL_ENTITY,
    level: 0,
    maxLevels: 0,
    selectedEntities: [],
    setSelectedEntities: mockSetSelectedEntities,
    selectedCaseId: 'fake-case-id',
    selectedDocumentId: 'fake-document-id',
    previewRedaction: '',
    setPreviewRedaction: jest.fn(),
    currentStatus: 'error' as StatusIndicatorProps.Type
};

const entitiesListPropsMedicalLoading = {
    currentPageNumber: 0,
    documentPageCount: 0,
    entities: [],
    standardEntities: [],
    medicalEntities: [],
    piiEntities: [],
    switchPage: jest.fn(),
    comprehendService: COMPREHEND_MEDICAL_SERVICE,
    entityType: EntityTypes.MEDICAL_ENTITY,
    level: 0,
    maxLevels: 0,
    selectedEntities: [],
    setSelectedEntities: mockSetSelectedEntities,
    selectedCaseId: 'fake-case-id',
    selectedDocumentId: 'fake-document-id',
    previewRedaction: '',
    setPreviewRedaction: jest.fn(),
    currentStatus: 'loading' as StatusIndicatorProps.Type
};

const getDocumentResponse = {
    key: 'fake-key'
};

const getSignedUrlResponse = {
    downloadUrl: 'fake-url'
};

const mockAPI = {
    get: jest.fn(),
    post: jest.fn()
};
jest.mock('@aws-amplify/api');
API.get = mockAPI.get;
API.post = mockAPI.post;

beforeEach(() => {
    mockAPI.get.mockReset();
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

test('Renders without entities', async () => {
    render(<EntitiesList {...entitiesListPropsEmpty} />);
    expect(await screen.findByTestId('entities-nodata')).toHaveTextContent('No Entities detected');
});

test('Renders error message when error status is returned for entities', async () => {
    render(<EntitiesList {...entitiesListPropsError} />);
    expect(await screen.findByTestId('entities-status-only')).toHaveTextContent('An error occurred loading Entities.');
});

test('Renders loading message when loading status is returned for entities', async () => {
    render(<EntitiesList {...entitiesListPropsLoading} />);
    expect(await screen.findByTestId('entities-status-only')).toHaveTextContent('Loading');
});

test('Renders without medical entities', async () => {
    render(<EntitiesList {...entitiesListPropsEmptyMedical} />);
    expect(await screen.findByTestId('medical-entities-nodata')).toHaveTextContent('No Medical Entities detected');
});

test('Renders error message when error status is returned for medical entities', async () => {
    render(<EntitiesList {...entitiesListPropsMedicalError} />);
    expect(await screen.findByTestId('medical-entities-status-only')).toHaveTextContent(
        'An error occurred loading Medical Entities.'
    );
});

test('Renders loading message when loading status is returned for medical entities', async () => {
    render(<EntitiesList {...entitiesListPropsMedicalLoading} />);
    expect(await screen.findByTestId('medical-entities-status-only')).toHaveTextContent('Loading');
});

test('Renders entities', async () => {
    render(<EntitiesList {...entitiesListProps} />);
    expect(await screen.findByText('Select All')).toBeInTheDocument();
    expect(await screen.findByText('Deselect All')).toBeInTheDocument();
    expect(await screen.findByText('DATE')).toBeInTheDocument();
    expect(await screen.findByText('OTHER')).toBeInTheDocument();
});

test('calls switchPage when a line is clicked', async () => {
    render(<EntitiesList {...entitiesListProps} />);
    fireEvent.click(screen.getByTestId('entities-list-expandable-10/23/20, 3:28 PM'));
    const line = await screen.findByText('Page 2');
    line.click();
    expect(entitiesListProps.switchPage).toHaveBeenCalledWith(2);
});

test('selects all checkboxes when Select All button clicked', async () => {
    render(<EntitiesList {...entitiesListProps} />);
    fireEvent.click(screen.getByTestId('select-all-entities'));
    expect(mockSetSelectedEntities).toHaveBeenCalledTimes(1);
    expect(mockSetSelectedEntities).toHaveBeenCalledWith(allSelectedEntities);
});

test('deselects all checkboxes when Deselect All button clicked', async () => {
    render(<EntitiesList {...entitiesListProps} />);
    fireEvent.click(screen.getByTestId('deselect-all-entities'));
    expect(mockSetSelectedEntities).toHaveBeenCalledTimes(1);
    expect(mockSetSelectedEntities).toHaveBeenCalledWith({ 'entity-standard': [] });
});

test('handles download redacted document button click', async () => {
    mockAPI.get.mockResolvedValueOnce(getDocumentResponse).mockResolvedValueOnce(getSignedUrlResponse);
    global.URL.createObjectURL = jest.fn();
    render(
        <EntitiesList
            {...entitiesListProps}
            selectedEntities={{
                'entity-standard': [['DATE'], ['OTHER', 'type 2', '2'], ['ORGANIZATION', 'NIDDK']]
            }}
        />
    );
    fireEvent.click(screen.getByTestId('redact-all-entities'));
    await waitFor(async () => {
        expect(mockAPI.post).toHaveBeenCalledTimes(1);
    });
    expect(mockAPI.post).toHaveBeenCalledWith(
        API_NAME,
        `redact/${entitiesListProps.selectedCaseId}/${entitiesListProps.selectedDocumentId}`,
        {
            headers: {
                Authorization: 'fake-jwt-token'
            },
            body: entitiesToRedact
        }
    );
    await waitFor(async () => {
        expect(mockAPI.get).toHaveBeenCalledTimes(2);
    });

    expect(mockAPI.get).toHaveBeenCalledWith(
        API_NAME,
        `document/${entitiesListProps.selectedCaseId}/${entitiesListProps.selectedDocumentId}`,
        {
            headers: {
                Authorization: 'fake-jwt-token'
            },
            queryStringParameters: { redacted: true }
        }
    );

    expect(mockAPI.get).toHaveBeenCalledWith(API_NAME, `document/download`, {
        headers: {
            Authorization: 'fake-jwt-token'
        },
        queryStringParameters: { key: 'fake-key' }
    });
});
