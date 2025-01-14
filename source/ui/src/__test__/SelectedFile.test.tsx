// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor } from '@testing-library/react';

import createWrapper from '@cloudscape-design/components/test-utils/dom';
import { SelectedFile } from '../components/FileUpload/SelectedFile/SelectedFile';
import { FileSize } from '../components/FileUpload/interfaces';
import { renderWithProviders } from './utils/tesUtils';

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

    it('should renderWithProviders with default settings', async () => {
        const file = new File(['1', '2'], 'filename.ext', {});
        renderWithProviders(
            <SelectedFile
                index={0}
                file={file}
                documentTypeList={documentTypeList}
                setDocumentTypeList={setDocumentType}
                workflowConfig={workflowConfig}
                allowedDocs={{}}
            />,
            {
                routerProvided: false
            }
        );

        await waitFor(async () => {
            expect(screen.getByText('filename.ext')).toBeTruthy();
            expect(screen.getByText('2.00 bytes')).toBeTruthy();
        });
    });

    it('should renderWithProviders with advanced settings', async () => {
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
        renderWithProviders(
            <SelectedFile
                index={0}
                file={file}
                metadata={metadata}
                documentTypeList={documentTypeList}
                setDocumentTypeList={setDocumentType}
                workflowConfig={workflowConfig}
                allowedDocs={{}}
            />,
            {
                routerProvided: false
            }
        );
        await waitFor(async () => {
            expect(screen.getByText('filename.ext')).toBeTruthy();
            expect(screen.getByText('text/plain')).toBeTruthy();
            expect(screen.getByText('0.00 KB')).toBeTruthy();
            expect(screen.getByText(/Nov 09, 2021 08:07/)).toBeTruthy();
        });
    });

    it('should renderWithProviders with thumbnail', async () => {
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
        renderWithProviders(
            <SelectedFile
                index={0}
                file={file}
                metadata={metadata}
                multiple
                documentTypeList={documentTypeList}
                setDocumentTypeList={setDocumentType}
                workflowConfig={workflowConfig}
                allowedDocs={{}}
            />,
            {
                routerProvided: false
            }
        );
        await waitFor(async () => {
            expect(screen.getByTestId('selected-file-img')).toBeTruthy();
            expect(screen.getByText('image-test.png')).toBeTruthy();
            expect(screen.getByText('4.71 KB')).toBeTruthy();
            expect(screen.getByText(/Nov 09, 2021 08:07/)).toBeTruthy();
        });
    });

    it('should have a dropdown', async () => {
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
        const { getByText, getByTestId } = renderWithProviders(
            <SelectedFile
                index={0}
                file={file}
                metadata={metadata}
                multiple
                documentTypeList={[]}
                setDocumentTypeList={setDocumentType}
                workflowConfig={workflowConfig}
                allowedDocs={{ 'generic': 1 }}
            />,
            {
                routerProvided: false
            }
        );

        await waitFor(async () => {
            const placeholderDropdownText = getByText('Select document type');
            expect(placeholderDropdownText).toBeTruthy();

            const docTypeSelectField = getByTestId('select-doc-type-dropdown');
            expect(docTypeSelectField).toBeTruthy();

            const docTypeSelect = createWrapper(screen.getByTestId('selected-file-box')).findSelect();
            docTypeSelect?.openDropdown();
            docTypeSelect?.selectOptionByValue('generic');
            docTypeSelect?.openDropdown();
            expect(docTypeSelect?.findDropdown().findSelectedOptions()[0].getElement().innerHTML).toContain('generic');
        });
    });
});
