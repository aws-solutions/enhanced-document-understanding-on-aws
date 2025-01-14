// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { StatusIndicatorProps } from '@cloudscape-design/components';
import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { API, Auth } from 'aws-amplify';
import { allSelectedEntities, entities } from './test_data';
import { COMPREHEND_MEDICAL_SERVICE, COMPREHEND_SERVICE, EntityTypes } from '../utils/constants';
import EntitiesList from '../components/EntitiesList';
import { renderWithProviders } from './utils/tesUtils';
import { server } from '../mock/api/server';
import { rest } from 'msw';
import { MOCK_CONFIG } from '../mock/api/handler';
import userEvent from '@testing-library/user-event';

let windowSpy = jest.spyOn(window, 'open');

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
    renderWithProviders(<EntitiesList {...entitiesListPropsEmpty} />, {
        routerProvided: false
    });
    await waitFor(async () => {
        expect(await screen.findByTestId('entities-nodata')).toHaveTextContent('No Entities detected');
    });
});

test('Renders error message when error status is returned for entities', async () => {
    renderWithProviders(<EntitiesList {...entitiesListPropsError} />, {
        routerProvided: false
    });
    await waitFor(async () => {
        expect(await screen.findByTestId('entities-status-only')).toHaveTextContent(
            'An error occurred loading Entities.'
        );
    });
});

test('Renders loading message when loading status is returned for entities', async () => {
    renderWithProviders(<EntitiesList {...entitiesListPropsLoading} />, {
        routerProvided: false
    });
    await waitFor(async () => {
        expect(await screen.findByTestId('entities-status-only')).toHaveTextContent('Loading');
    });
});

test('Renders without medical entities', async () => {
    renderWithProviders(<EntitiesList {...entitiesListPropsEmptyMedical} />, {
        routerProvided: false
    });

    await waitFor(async () => {
        expect(await screen.findByTestId('medical-entities-nodata')).toHaveTextContent('No Medical Entities detected');
    });
});

test('Renders error message when error status is returned for medical entities', async () => {
    renderWithProviders(<EntitiesList {...entitiesListPropsMedicalError} />, {
        routerProvided: false
    });

    await waitFor(async () => {
        expect(await screen.findByTestId('medical-entities-status-only')).toHaveTextContent(
            'An error occurred loading Medical Entities.'
        );
    });
});

test('Renders loading message when loading status is returned for medical entities', async () => {
    renderWithProviders(<EntitiesList {...entitiesListPropsMedicalLoading} />, {
        routerProvided: false
    });
    await waitFor(async () => {
        expect(await screen.findByTestId('medical-entities-status-only')).toHaveTextContent('Loading');
    });
});

test('Renders entities', async () => {
    renderWithProviders(<EntitiesList {...entitiesListProps} />, {
        routerProvided: false
    });
    await waitFor(async () => {
        expect(await screen.findByText('Select All')).toBeInTheDocument();
        expect(await screen.findByText('Deselect All')).toBeInTheDocument();
        expect(await screen.findByText('DATE')).toBeInTheDocument();
        expect(await screen.findByText('OTHER')).toBeInTheDocument();
    });
});

test('calls switchPage when a line is clicked', async () => {
    renderWithProviders(<EntitiesList {...entitiesListProps} />, {
        routerProvided: false
    });

    await waitFor(async () => {
        fireEvent.click(screen.getByTestId('entities-list-expandable-10/23/20, 3:28 PM'));
        const line = await screen.findByText('Page 2');
        line.click();
        expect(entitiesListProps.switchPage).toHaveBeenCalledWith(2);
    });
});

test('selects all checkboxes when Select All button clicked', async () => {
    renderWithProviders(<EntitiesList {...entitiesListProps} />, {
        routerProvided: false
    });

    await waitFor(async () => {
        fireEvent.click(screen.getByTestId('select-all-entities'));
        expect(mockSetSelectedEntities).toHaveBeenCalledTimes(1);
        expect(mockSetSelectedEntities).toHaveBeenCalledWith(allSelectedEntities);
    });
});

test('deselects all checkboxes when Deselect All button clicked', async () => {
    renderWithProviders(<EntitiesList {...entitiesListProps} />, {
        routerProvided: false
    });
    await waitFor(async () => {
        fireEvent.click(screen.getByTestId('deselect-all-entities'));
        expect(mockSetSelectedEntities).toHaveBeenCalledTimes(2);
        expect(mockSetSelectedEntities).toHaveBeenCalledWith({ 'entity-standard': [] });
    });
});

test('handles download redacted document button click', async () => {
    windowSpy.mockImplementation(jest.fn());
    server.use(
        rest.post(`${MOCK_CONFIG.ApiEndpoint}redact/:caseId/:documentId`, (_, res, ctx) => {
            return res(ctx.status(200));
        })
    );

    global.URL.createObjectURL = jest.fn();
    const renderer: any = renderWithProviders(
        <EntitiesList
            {...entitiesListProps}
            selectedEntities={{
                'entity-standard': [['DATE'], ['OTHER', 'type 2', '2'], ['ORGANIZATION', 'NIDDK']]
            }}
        />,
        {
            routerProvided: false
        }
    );

    await waitFor(async () => {
        const statusBeforeClick = renderer.store.getState().entity.status;
        expect(statusBeforeClick).toBeUndefined();
        const downloadRedactButton = screen.getByTestId('redact-all-entities');
        await userEvent.click(downloadRedactButton);

        const status = renderer.store.getState().entity.status;

        expect(status).toEqual('success');
    });
});

test('disables download redacted document button', async () => {
    windowSpy.mockImplementation(jest.fn());
    server.use(
        rest.post(`${MOCK_CONFIG.ApiEndpoint}redact/:caseId/:documentId`, (_, res, ctx) => {
            return res(ctx.status(200));
        })
    );

    global.URL.createObjectURL = jest.fn();
    const renderer: any = renderWithProviders(
        <EntitiesList
            {...entitiesListProps}
            selectedEntities={{
                'entity-standard': [],
                'entity-pii': [],
                'entity-medical': []
            }}
        />,
        {
            routerProvided: false
        }
    );

    await waitFor(async () => {
        const statusBeforeClick = renderer.store.getState().entity.status;
        expect(statusBeforeClick).toBeUndefined();
        const downloadRedactButton = screen.getByTestId('redact-all-entities');
        expect(downloadRedactButton).toBeDisabled();
    });
});
