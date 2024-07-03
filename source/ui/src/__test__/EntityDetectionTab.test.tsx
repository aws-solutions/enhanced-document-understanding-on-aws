/**********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the License). You may not use this file except in compliance      *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

import { StatusIndicatorProps } from '@cloudscape-design/components';
import createWrapper from '@cloudscape-design/components/test-utils/dom';
import '@testing-library/jest-dom';
import { screen, waitFor } from '@testing-library/react';
import { allSelectedEntities2, entities } from './test_data';
import { EntityTypes } from '../utils/constants';
import EntityDetectionTab from '../components/EntityDetectionTab';
import { renderWithProviders } from './utils/tesUtils';

const entityDetectionPropsError = {
    selectedDocumentFileType: 'pdf',
    selectedDocumentUrl: 'fake-url',
    documentEntities: {},
    documentPageCount: 2,
    currentPageNumber: 1,
    switchPage: jest.fn(),
    comprehendService: 'COMPREHEND',
    entityType: EntityTypes.ENTITY_STANDARD,
    selectedDocumentId: 'test-doc-id',
    selectedCaseId: 'test-case-id',
    selectedEntities: [],
    standardEntities: [],
    medicalEntities: [],
    piiEntities: [],
    setSelectedEntities: jest.fn(),
    currentStatus: 'error' as StatusIndicatorProps.Type,
    previewRedaction: '',
    setPreviewRedaction: jest.fn(),
    retrieveSignedUrl: jest.fn()
};

const entityDetectionPropsLoading = {
    selectedDocumentFileType: 'pdf',
    selectedDocumentUrl: 'fake-url',
    documentEntities: {},
    documentPageCount: 2,
    currentPageNumber: 1,
    switchPage: jest.fn(),
    comprehendService: 'COMPREHEND',
    entityType: EntityTypes.ENTITY_STANDARD,
    selectedDocumentId: 'test-doc-id',
    selectedCaseId: 'test-case-id',
    selectedEntities: [],
    standardEntities: [],
    medicalEntities: [],
    piiEntities: [],
    setSelectedEntities: jest.fn(),
    currentStatus: 'loading' as StatusIndicatorProps.Type,
    previewRedaction: '',
    setPreviewRedaction: jest.fn(),
    retrieveSignedUrl: jest.fn()
};

const entityDetectionPropsWithEntities = {
    selectedDocumentFileType: 'pdf',
    selectedDocumentUrl: 'fake-url',
    standardEntities: entities,
    medicalEntities: entities,
    piiEntities: entities,
    documentPageCount: 1,
    currentPageNumber: 1,
    switchPage: jest.fn(),
    comprehendService: 'COMPREHEND',
    entityType: EntityTypes.ENTITY_STANDARD,
    selectedDocumentId: 'test-doc-id',
    selectedCaseId: 'test-case-id',
    currentStatus: 'success' as StatusIndicatorProps.Type,
    selectedEntities: {
        [EntityTypes.ENTITY_STANDARD]: [],
        [EntityTypes.PII]: [],
        [EntityTypes.MEDICAL_ENTITY]: []
    },
    setSelectedEntities: jest.fn(),
    previewRedaction: '',
    setPreviewRedaction: jest.fn(),
    retrieveSignedUrl: jest.fn()
};

const entityDetectionPropsNoEntities = {
    selectedDocumentFileType: 'pdf',
    selectedDocumentUrl: 'fake-url',
    standardEntities: {},
    medicalEntities: {},
    piiEntities: {},
    documentPageCount: 1,
    currentPageNumber: 1,
    switchPage: jest.fn(),
    comprehendService: 'COMPREHEND',
    entityType: EntityTypes.ENTITY_STANDARD,
    selectedDocumentId: 'test-doc-id',
    selectedCaseId: 'test-case-id',
    currentStatus: 'success' as StatusIndicatorProps.Type,
    selectedEntities: {
        [EntityTypes.ENTITY_STANDARD]: [],
        [EntityTypes.PII]: [],
        [EntityTypes.MEDICAL_ENTITY]: []
    },
    setSelectedEntities: jest.fn(),
    previewRedaction: '',
    setPreviewRedaction: jest.fn(),
    retrieveSignedUrl: jest.fn()
};

jest.mock('react-pdf', () => ({
    pdfjs: { GlobalWorkerOptions: { workerSrc: 'abc' } },
    Document: ({ onLoadSuccess = (pdf = { numPages: 4 }) => pdf.numPages }) => {
        return <div>{onLoadSuccess({ numPages: 4 })}</div>;
    },
    Outline: null,
    Page: () => <div>def</div>
}));

describe('EntityDetectionTab component renders with entities', () => {
    const setSelectedEntities = jest.fn();
    beforeEach(() => {
        renderWithProviders(
            <EntityDetectionTab {...entityDetectionPropsWithEntities} setSelectedEntities={setSelectedEntities} />,
            {
                routerProvided: false
            }
        );
    });

    it('renders the component successfully when select-all-entities is clicked', async () => {
        //Finds 'Select All' button and clicks it
        const elementButton = screen.getByTestId('select-all-entities');
        const button = createWrapper(elementButton);
        expect(button?.getElement().innerHTML).toContain('Select All');
        button?.click();

        expect(setSelectedEntities).toHaveBeenCalledWith(allSelectedEntities2);

        const elementAllEntities = screen.getByTestId('box-parent-view-entity-title');
        const box = createWrapper(elementAllEntities).findBox();
        expect(box?.getElement().innerHTML).toContain('All Detected DATE Entities');

        expect(await screen.findByText('DATE')).toBeInTheDocument();
        expect(await screen.findByText('10/23/20, 3:28 PM')).toBeInTheDocument();
    });

    it('renders the component successfully when a single entity type is selected', async () => {
        const boxElement = screen.getByTestId('box-view-entity');
        const box = createWrapper(boxElement);
        const entityCheckbox = box.findCheckbox();
        entityCheckbox?.findNativeInput().click();
        expect(setSelectedEntities).toHaveBeenCalledWith({
            'entity-medical': [],
            'entity-pii': [],
            'entity-standard': [
                ['DATE', '10/23/20, 3:28 PM'],
                ['DATE', '10/23/20, 3:28 PM', '1'],
                ['DATE', '10/23/20, 3:28 PM', '2']
            ]
        });
    });

    it('renders the component successfully when a entity page is selected', async () => {
        const boxElement = screen.getAllByTestId('box-view-entity-page')[0];
        const box = createWrapper(boxElement);
        const entityCheckbox = box.findCheckbox();
        entityCheckbox?.findNativeInput().click();
        expect(setSelectedEntities).toHaveBeenCalledWith({
            'entity-medical': [],
            'entity-pii': [],
            'entity-standard': [['DATE', '10/23/20, 3:28 PM', '1']]
        });
    });
});

describe('EntityDetectionTab component renders with no entities', () => {
    beforeEach(() => {
        renderWithProviders(<EntityDetectionTab {...entityDetectionPropsNoEntities} />, { routerProvided: false });
    });

    it('renders the component successfully when no entities are found', async () => {
        const selectButtonElement = screen.queryByTestId('select-all-entities');
        expect(selectButtonElement).not.toBeInTheDocument();

        const deselectButtonElement = screen.queryByTestId('deselect-all-entities');
        expect(deselectButtonElement).not.toBeInTheDocument();

        const redactButtonElement = screen.queryByTestId('redact-all-entities');
        expect(redactButtonElement).not.toBeInTheDocument();
    });
});

describe('Document rendering for entity detection component: verifying loading and error states', () => {
    test('Renders error message when error status is returned for document rendering', async () => {
        renderWithProviders(<EntityDetectionTab {...entityDetectionPropsError} />, {
            routerProvided: false
        });

        await waitFor(async () => {
            expect(await screen.findByTestId('document-rendering-container')).toHaveTextContent(
                'An error occurred loading the document preview.'
            );
        });
    });

    test('Renders loading message when loading status is returned for document rendering', async () => {
        renderWithProviders(<EntityDetectionTab {...entityDetectionPropsLoading} />, {
            routerProvided: false
        });

        await waitFor(async () => {
            expect(await screen.findByTestId('document-rendering-container')).toHaveTextContent('Loading');
        });
    });
});
