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

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import kendraQueryResponse from '../../test_data/kendra/kendraQueryResponse.json';
import KendraResultPage from '../SearchView/KendraResultPage';

describe('KendraResultPage', () => {
    it('renders the title if provided', () => {
        const title = 'Example Title';
        render(
            <MemoryRouter>
                <KendraResultPage
                    title={title}
                    results={kendraQueryResponse.ResultItems}
                    casesList={[]}
                    setSelectedCaseId={() => {}}
                    setSelectedDocumentId={() => {}}
                    setSelectedDocumentFileType={() => {}}
                />
            </MemoryRouter>
        );
        expect(screen.getByText(title)).toBeInTheDocument();
    });

    it('renders the KendraDocumentResults component with filtered results and cases list', () => {
        const casesList = [
            {
                caseDocuments: [{ name: 'doc-8613454d-537e-4d20-bd96-300890584d20' }],
                caseId: 1,
                caseName: 'Example case 1'
            },
            {
                caseDocuments: [{ name: 'doc3' }],
                caseId: 2,
                caseName: 'Example case 2'
            }
        ];
        render(
            <MemoryRouter>
                <KendraResultPage
                    title="Example Title"
                    results={kendraQueryResponse.ResultItems}
                    casesList={casesList}
                    setSelectedCaseId={() => {}}
                    setSelectedDocumentId={() => {}}
                    setSelectedDocumentFileType={() => {}}
                />
            </MemoryRouter>
        );
        expect(screen.getByText('doc-8613454d-537e-4d20-bd96-300890584d20')).toBeInTheDocument();
    });
});
