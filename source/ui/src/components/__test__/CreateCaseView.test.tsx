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

import { API } from '@aws-amplify/api';
import createWrapper from '@cloudscape-design/components/test-utils/dom';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { API_NAME, MAX_CASE_NAME_LENGTH, MIN_CASE_NAME_LENGTH } from '../../utils/constants';
import CreateCaseView from '../CreateCaseView/CreateCaseView';

const mockAPI = {
    post: jest.fn()
};
jest.mock('@aws-amplify/api');
API.post = mockAPI.post;

jest.mock('../DocumentTable/DocumentTable', () => ({
    generateToken: () => 'fake-jwt-token',
    getUsername: () => 'fake-username'
}));

beforeEach(() => {
    mockAPI.post.mockReset();
});

test('Renders case creation component', async () => {
    render(
        <MemoryRouter initialEntries={['/createCase']}>
            <Routes>
                <Route path="/createCase" element={<CreateCaseView />} />
            </Routes>
        </MemoryRouter>
    );
    expect(await screen.findByText('Case name')).toBeInTheDocument();
    expect(screen.getAllByText('Create case')).toHaveLength(2);
});

test('Case creation flow', async () => {
    mockAPI.post.mockResolvedValueOnce({});
    render(
        <MemoryRouter initialEntries={['/createCase']}>
            <Routes>
                <Route path="/createCase" element={<CreateCaseView />} />
            </Routes>
        </MemoryRouter>
    );

    await waitFor(async () => {
        expect(screen.getByTestId('create-case-button')).toBeInTheDocument();
    });
    const createCaseButtonElement = screen.getByTestId('create-case-button');
    const createCaseButton = createWrapper(createCaseButtonElement);
    const caseNameFieldElement = screen.getByTestId('case-name-field');
    const caseNameInput = createWrapper(caseNameFieldElement).findInput();
    caseNameInput?.setInputValue('fake-case-name');
    createCaseButton?.click();
    await waitFor(async () => {
        expect(mockAPI.post).toHaveBeenCalledTimes(1);
    });

    expect(mockAPI.post).toHaveBeenCalledWith(API_NAME, `case`, {
        headers: {
            Authorization: 'fake-jwt-token'
        },
        body: { caseName: 'fake-case-name' }
    });
});

test('Displays error when incorrect input format', async () => {
    mockAPI.post.mockResolvedValueOnce({});
    render(
        <MemoryRouter initialEntries={['/createCase']}>
            <Routes>
                <Route path="/createCase" element={<CreateCaseView />} />
            </Routes>
        </MemoryRouter>
    );

    await waitFor(async () => {
        expect(screen.getByTestId('create-case-button')).toBeInTheDocument();
    });
    const createCaseButtonElement = screen.getByTestId('create-case-button');
    const createCaseButton = createWrapper(createCaseButtonElement);
    const caseNameFieldElement = screen.getByTestId('case-name-field');
    const caseNameInput = createWrapper(caseNameFieldElement).findInput();
    caseNameInput?.setInputValue('fake-case-name!#');
    createCaseButton?.click();
    await waitFor(async () => {
        expect(
            screen.getByText(
                'Case name can only include alphanumeric characters, -, _, and spaces and must be between ' +
                    MIN_CASE_NAME_LENGTH +
                    ' and ' +
                    MAX_CASE_NAME_LENGTH +
                    ' characters.'
            )
        ).toBeInTheDocument();
    });
});
