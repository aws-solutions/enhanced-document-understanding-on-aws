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
import { API } from '@aws-amplify/api';
import DocumentView from '../../DocumentView/DocumentView';

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

beforeEach(() => {
    mockAPI.get.mockReset();
});

const getDocumentResponse = {
    key: 'fake-key'
};

const getSignedUrlResponse = {
    downloadUrl: 'fake-url'
};

jest.mock('@cloudscape-design/components', () => {
    const Components = jest.genMockFromModule('@cloudscape-design/components') as any;
    for (const componentName of Object.keys(Components)) {
        Components[componentName] = componentName;
    }
    return Components;
});

test('Snapshot test', async () => {
    mockAPI.get.mockResolvedValueOnce(getDocumentResponse).mockResolvedValueOnce(getSignedUrlResponse);
    const tree = renderer.create(<DocumentView {...documentViewProps} />).toJSON();
    expect(tree).toMatchSnapshot();
});
