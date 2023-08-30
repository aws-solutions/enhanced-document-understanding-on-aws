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
import { render, screen } from '@testing-library/react';

import createWrapper from '@cloudscape-design/components/test-utils/dom';
import { SelectedFile } from '../FileUpload/SelectedFile/SelectedFile';
import { FileSize } from '../FileUpload/interfaces';

describe('SelectedFile', () => {
    const setDocumentType = jest.fn();

    const workflowConfig = {
        NumRequiredDocuments: 2,
        UniqueDocumentTypes: ['generic', 'fake-doc-type'],
        WorkflowConfigName: 'default'
    };

    const documentTypeList = ['generic', 'fake-doc-type', 'generic', 'fake-doc-type'];

    it('should exist', () => {
        expect(SelectedFile).toBeTruthy();
    });

    it('should render with default settings', () => {
        const file = new File(['1', '2'], 'filename.ext', {});
        render(
            <SelectedFile
                index={0}
                file={file}
                documentTypeList={documentTypeList}
                setDocumentTypeList={setDocumentType}
                workflowConfig={workflowConfig}
                allowedDocs={{}}
            />
        );
        expect(screen.getByText('filename.ext')).toBeTruthy();
        expect(screen.getByText('2.00 bytes')).toBeTruthy();
    });

    it('should render with advanced settings', () => {
        const lastModified = new Date(2021, 10, 9, 8, 7, 6, 5);
        const file = new File(['1', '2'], 'filename.ext', {
            type: 'text/plain',
            lastModified: lastModified.getTime()
        });
        const metadata = {
            name: true,
            type: true,
            size: FileSize.KB,
            lastModified: true,
            lastModifiedLocale: 'en-US'
        };
        render(
            <SelectedFile
                index={0}
                file={file}
                metadata={metadata}
                documentTypeList={documentTypeList}
                setDocumentTypeList={setDocumentType}
                workflowConfig={workflowConfig}
                allowedDocs={{}}
            />
        );
        expect(screen.getByText('filename.ext')).toBeTruthy();
        expect(screen.getByText('text/plain')).toBeTruthy();
        expect(screen.getByText('0.00 KB')).toBeTruthy();
        expect(screen.getByText(/Nov 09, 2021 08:07/)).toBeTruthy();
    });

    it('should render with thumbnail', () => {
        const imageBuffer = new ArrayBuffer(4715);
        const file = new File([imageBuffer], 'image-test.png', {
            type: 'image/png',
            lastModified: new Date(2021, 10, 9, 8, 7, 6, 5).getTime()
        });
        const metadata = {
            name: true,
            type: false,
            size: FileSize.KB,
            lastModified: true,
            lastModifiedLocale: 'en-US',
            thumbnail: true
        };
        render(
            <SelectedFile
                index={0}
                file={file}
                metadata={metadata}
                multiple
                documentTypeList={documentTypeList}
                setDocumentTypeList={setDocumentType}
                workflowConfig={workflowConfig}
                allowedDocs={{}}
            />
        );
        expect(screen.getByTestId('selected-file-img')).toBeTruthy();
        expect(screen.getByText('image-test.png')).toBeTruthy();
        expect(screen.getByText('4.71 KB')).toBeTruthy();
        expect(screen.getByText(/Nov 09, 2021 08:07/)).toBeTruthy();
    });

    it('should have a dropdown', () => {
        const imageBuffer = new ArrayBuffer(4715);
        const file = new File([imageBuffer], 'image-test.png', {
            type: 'image/png',
            lastModified: new Date(2021, 10, 9, 8, 7, 6, 5).getTime()
        });
        const metadata = {
            name: true,
            type: false,
            size: FileSize.KB,
            lastModified: true,
            lastModifiedLocale: 'en-US',
            thumbnail: true
        };
        render(
            <SelectedFile
                index={0}
                file={file}
                metadata={metadata}
                multiple
                documentTypeList={[]}
                setDocumentTypeList={setDocumentType}
                workflowConfig={workflowConfig}
                allowedDocs={{ 'generic': 1 }}
            />
        );
        const placeholderDropdownText = screen.getByText('Select document type');
        expect(placeholderDropdownText).toBeTruthy();

        const docTypeSelectField = screen.getByTestId('select-doc-type-dropdown');
        expect(docTypeSelectField).toBeTruthy();

        const docTypeSelect = createWrapper(screen.getByTestId('selected-file-box')).findSelect();
        docTypeSelect?.openDropdown();
        docTypeSelect?.selectOptionByValue('generic');
        docTypeSelect?.openDropdown();
        expect(docTypeSelect?.findDropdown().findSelectedOptions()[0].getElement().innerHTML).toContain('generic');
    });
});
