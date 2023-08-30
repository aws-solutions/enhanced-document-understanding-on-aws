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
import renderer from 'react-test-renderer';

import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { API } from '@aws-amplify/api';
import { Auth } from '@aws-amplify/auth';
import DocumentTable from '../../DocumentTable/DocumentTable';

const mockAPI = {
    get: jest.fn(),
    post: jest.fn()
};
jest.mock('@aws-amplify/api');
API.get = mockAPI.get;
API.post = mockAPI.post;

const getCasesResponse = {
    Count: 4,
    ScannedCount: 4,
    Items: [
        {
            BUCKET_NAME: { S: 'fake-bucket-name' },
            CASE_ID: { S: 'fake-case-id' },
            CASE_NAME: { S: 'fake-case-name' },
            DOCUMENT_ID: { S: 'fake-doc-id' },
            DOCUMENT_TYPE: { S: 'passport' },
            S3_KEY: {
                S: 'fake-s3-key.jpg'
            },
            UPLOADED_FILE_EXTENSION: { S: 'jpg' },
            UPLOADED_FILE_NAME: { S: 'fake-file-name' },
            CREATION_TIMESTAMP: { 'S': '2000-01-01T00:00:00.000Z' }
        }
    ]
};

let selectedDocumentId: string | null = null;
const setSelectedDocumentId = jest.fn();
let selectedCaseId: string | null = null;
const setSelectedCaseId = jest.fn();
let selectedDocumentFileType: string | null = null;
const setSelectedDocumentFileType = jest.fn();
let casesList: any[] | null = null;
const setCasesList = jest.fn();
const setSelectedCaseName = jest.fn();
const setSelectedDocumentName = jest.fn();
const documentTableProps = {
    selectedDocumentId: selectedDocumentId,
    setSelectedDocumentId: setSelectedDocumentId,
    selectedCaseId: selectedCaseId,
    setSelectedCaseId: setSelectedCaseId,
    selectedDocumentFileType: selectedDocumentFileType,
    setSelectedDocumentFileType: setSelectedDocumentFileType,
    casesList: casesList,
    setCasesList: setCasesList,
    setSelectedCaseName: setSelectedCaseName,
    numRequiredDocuments: 20,
    setSelectedDocumentName: setSelectedDocumentName
};

beforeEach(() => {
    mockAPI.get.mockReset();
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

jest.mock('@cloudscape-design/components', () => {
    const Components = jest.genMockFromModule('@cloudscape-design/components') as any;
    for (const componentName of Object.keys(Components)) {
        Components[componentName] = componentName;
    }
    return Components;
});

test('Snapshot test', async () => {
    mockAPI.get.mockResolvedValueOnce(getCasesResponse);
    const tree = renderer
        .create(
            <MemoryRouter initialEntries={['/']}>
                <Routes>
                    <Route path="/" element={<DocumentTable {...documentTableProps} />} />
                </Routes>
            </MemoryRouter>
        )
        .toJSON();
    expect(tree).toMatchSnapshot();
});
