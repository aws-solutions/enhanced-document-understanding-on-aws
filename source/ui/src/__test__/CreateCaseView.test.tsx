// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { API } from '@aws-amplify/api';
import createWrapper from '@cloudscape-design/components/test-utils/dom';
import '@testing-library/jest-dom';
import { screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MAX_CASE_NAME_LENGTH, MIN_CASE_NAME_LENGTH } from '../utils/constants';
import { renderWithProviders } from './utils/tesUtils';
import CreateCaseView from '../components/CreateCaseView/CreateCaseView';
import { server } from '../mock/api/server';
import { rest } from 'msw';
import { MOCK_CONFIG } from '../mock/api/handler';

const mockAPI = {
    post: jest.fn()
};
jest.mock('@aws-amplify/api');
API.post = mockAPI.post;

jest.mock('../components/DocumentTable/DocumentTable', () => ({
    generateToken: () => 'fake-jwt-token',
    getUsername: () => 'fake-username'
}));

beforeEach(() => {
    mockAPI.post.mockReset();
});

test('Renders case creation component', async () => {
    renderWithProviders(
        <MemoryRouter initialEntries={['/createCase']}>
            <Routes>
                <Route path="/createCase" element={<CreateCaseView />} />
            </Routes>
        </MemoryRouter>
    );

    await waitFor(async () => {
        expect(await screen.findByText('Case name')).toBeInTheDocument();
        expect(screen.getAllByText('Create case')).toHaveLength(2);
    });
});

test('Case creation flow', async () => {
    server.use(
        rest.post(`${MOCK_CONFIG.ApiEndpoint}case`, (_, res, ctx) => {
            return res(
                ctx.status(200),
                ctx.text(
                    JSON.stringify({
                        ddbResponse: {
                            ENABLE_BACKEND_UPLOAD: true
                        }
                    })
                )
            );
        })
    );
    renderWithProviders(
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
});

test('Displays error when incorrect input format', async () => {
    mockAPI.post.mockResolvedValueOnce({});
    renderWithProviders(
        <MemoryRouter initialEntries={['/createCase']}>
            <Routes>
                <Route path="/createCase" element={<CreateCaseView />} />
            </Routes>
        </MemoryRouter>
    );

    await waitFor(async () => {
        expect(screen.getByTestId('create-case-button')).toBeInTheDocument();
        const createCaseButtonElement = screen.getByTestId('create-case-button');
        const createCaseButton = createWrapper(createCaseButtonElement);
        const caseNameFieldElement = screen.getByTestId('case-name-field');
        const caseNameInput = createWrapper(caseNameFieldElement).findInput();
        caseNameInput?.setInputValue('fake-case-name!#');
        createCaseButton?.click();
    });

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
