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

import renderer from 'react-test-renderer';
import '@testing-library/jest-dom';
import { entities } from '../../../__test__/test_data';
import { EntityTypes } from '../../../utils/constants';
import { StatusIndicatorProps } from '@cloudscape-design/components';
import EntityDetectionTab from '../../EntityDetectionTab';

const entityDetectionPropsWithSelectedEntities = {
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
        [EntityTypes.ENTITY_STANDARD]: [['DATE'], ['OTHER', 'type 2']],
        [EntityTypes.PII]: [],
        [EntityTypes.MEDICAL_ENTITY]: []
    },
    setSelectedEntities: jest.fn(),
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

jest.mock('@cloudscape-design/components', () => {
    const Components = jest.genMockFromModule('@cloudscape-design/components') as any;
    for (const componentName of Object.keys(Components)) {
        Components[componentName] = componentName;
    }
    return Components;
});

test('Snapshot test with entities', async () => {
    const tree = renderer.create(<EntityDetectionTab {...entityDetectionPropsWithEntities} />).toJSON();
    expect(tree).toMatchSnapshot();
});

test('Snapshot test with selected entities', async () => {
    const tree = renderer.create(<EntityDetectionTab {...entityDetectionPropsWithSelectedEntities} />).toJSON();
    expect(tree).toMatchSnapshot();
});

test('Snapshot test with no entities', async () => {
    const tree = renderer.create(<EntityDetectionTab {...entityDetectionPropsNoEntities} />).toJSON();
    expect(tree).toMatchSnapshot();
});
