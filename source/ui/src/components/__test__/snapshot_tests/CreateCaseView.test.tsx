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
import { API } from '@aws-amplify/api';
import CreateCaseView from '../../CreateCaseView/CreateCaseView';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import renderer from 'react-test-renderer';

const mockAPI = {
    get: jest.fn(),
    post: jest.fn()
};
jest.mock('@aws-amplify/api');
API.get = mockAPI.get;
API.post = mockAPI.post;

beforeEach(() => {
    mockAPI.post.mockReset();
});

jest.mock('@cloudscape-design/components', () => {
    const Components = jest.genMockFromModule('@cloudscape-design/components') as any;
    for (const componentName of Object.keys(Components)) {
        Components[componentName] = componentName;
    }
    return Components;
});

test('Snapshot test', async () => {
    const tree = renderer
        .create(
            <MemoryRouter initialEntries={['/createCase']}>
                <Routes>
                    <Route path="/createCase" element={<CreateCaseView />} />
                </Routes>
            </MemoryRouter>
        )
        .toJSON();
    expect(tree).toMatchSnapshot();
});
