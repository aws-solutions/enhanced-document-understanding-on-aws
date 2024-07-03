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
import { render, screen } from '@testing-library/react';
import { marks1, tables } from './test_data';
import DocumentRenderer from '../components/DocumentRenderer/DocumentRenderer';

jest.mock('react-pdf', () => ({
    pdfjs: { GlobalWorkerOptions: { workerSrc: 'abc' } },
    Document: ({ onLoadSuccess = (pdf = { numPages: 4 }) => pdf.numPages }) => {
        return <div>PDF load failed. Retrying...{onLoadSuccess({ numPages: 4 })}</div>;
    },
    Outline: null,
    Page: () => <div>def</div>
}));

jest.mock('react-pdf', () => ({
    pdfjs: { GlobalWorkerOptions: { workerSrc: 'abc' } },
    Document: ({ onLoadSuccess = (pdf = { numPages: 4 }) => pdf.numPages }) => {
        return <div>PDF load failed. Retrying...{onLoadSuccess({ numPages: 4 })}</div>;
    },
    Outline: null,
    Page: () => <div>def</div>
}));

describe('DocumentRenderer component', () => {
    it('renders the correct component when selectedDocumentFileType is pdf', async () => {
        const selectedDocumentFileType = 'pdf';
        const selectedDocumentUrl = 'fake-url';
        const currentPageNumber = 1;
        const switchPage = jest.fn();
        render(
            <DocumentRenderer
                selectedDocumentFileType={selectedDocumentFileType}
                selectedDocumentUrl={selectedDocumentUrl}
                currentPageNumber={currentPageNumber}
                switchPage={switchPage}
                marks={marks1}
                tables={tables}
                retrieveSignedUrl={jest.fn()}
            />
        );
        expect(await screen.findByText('PDF load failed. Retrying...')).toBeInTheDocument();
    });
    it('renders the correct component when selectedDocumentFileType is jpg or png', () => {
        const selectedDocumentFileType = 'jpg';
        const selectedDocumentUrl = 'fake-url';
        render(
            <DocumentRenderer
                selectedDocumentFileType={selectedDocumentFileType}
                selectedDocumentUrl={selectedDocumentUrl}
                marks={marks1}
                tables={tables}
                retrieveSignedUrl={jest.fn()}
            />
        );
        expect(screen.getByTestId('image')).toBeInTheDocument();
    });

    it('renders an error message when selectedDocumentFileType is invalid', () => {
        const selectedDocumentFileType = 'invalid';
        const selectedDocumentUrl = 'fake-url';
        render(
            <DocumentRenderer
                selectedDocumentFileType={selectedDocumentFileType}
                selectedDocumentUrl={selectedDocumentUrl}
                retrieveSignedUrl={jest.fn()}
            />
        );
        expect(screen.getByText('Invalid file type')).toBeInTheDocument();
    });
});
