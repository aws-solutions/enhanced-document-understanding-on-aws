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
import renderer from 'react-test-renderer';
import { entities } from '../../../__test__/test_data';
import { COMPREHEND_MEDICAL_SERVICE, COMPREHEND_SERVICE, EntityTypes } from '../../../utils/constants';
import EntitiesList from '../../EntitiesList';

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
    documentPageCount: 4,
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

jest.mock('@cloudscape-design/components', () => {
    const Components = jest.genMockFromModule('@cloudscape-design/components') as any;
    for (const componentName of Object.keys(Components)) {
        Components[componentName] = componentName;
    }
    return Components;
});

test('Renders without entities', async () => {
    const tree = renderer.create(<EntitiesList {...entitiesListPropsEmpty} />).toJSON();
    expect(tree).toMatchSnapshot();
});

test('Renders without medical entities', async () => {
    const tree = renderer.create(<EntitiesList {...entitiesListPropsEmptyMedical} />).toJSON();
    expect(tree).toMatchSnapshot();
});

test('Renders entities', async () => {
    const tree = renderer.create(<EntitiesList {...entitiesListProps} />).toJSON();
    expect(tree).toMatchSnapshot();
});
