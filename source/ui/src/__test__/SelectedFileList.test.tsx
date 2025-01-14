// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen } from '@testing-library/react';

import { SelectedFileList } from '../components/FileUpload/SelectedFileList/SelectedFileList';
import { renderWithProviders } from './utils/tesUtils';
import userEvent from '@testing-library/user-event';

describe('SelectedFileList', () => {
    const fileList = [
        new File(['1'], 'filename1.ext', {}),
        new File(['2', '3'], 'filename2.ext', {}),
        new File(['4', '5', '6'], 'filename3.ext', {})
    ];

    const documentTypeList = ['generic', 'passport', 'generic', 'passport'];

    const setDocumentType = jest.fn();

    const workflowConfig = {
        NumRequiredDocuments: 2,
        UniqueDocumentTypes: ['generic', 'passport'],
        WorkflowConfigName: 'default'
    };

    it('should exist', () => {
        expect(SelectedFileList).toBeTruthy();
    });

    it('should renderWithProviders with default settings', () => {
        const handleDismiss = jest.fn();
        renderWithProviders(
            <SelectedFileList
                fileList={fileList}
                onDismiss={handleDismiss}
                documentTypeList={documentTypeList}
                setDocumentTypeList={setDocumentType}
                workflowConfig={workflowConfig}
                allowedDocs={{}}
            />
        );
        expect(screen.getByText('filename1.ext')).toBeTruthy();
        expect(screen.getByText('1.00 bytes')).toBeTruthy();
        expect(screen.getByText('filename2.ext')).toBeTruthy();
        expect(screen.getByText('2.00 bytes')).toBeTruthy();
        expect(screen.getByText('filename3.ext')).toBeTruthy();
        expect(screen.getByText('3.00 bytes')).toBeTruthy();
        expect(handleDismiss).not.toHaveBeenCalled();
    });

    it('should remove selected file', async () => {
        const handleDismiss = jest.fn();
        renderWithProviders(
            <SelectedFileList
                fileList={fileList}
                onDismiss={handleDismiss}
                documentTypeList={documentTypeList}
                setDocumentTypeList={setDocumentType}
                workflowConfig={workflowConfig}
                allowedDocs={{}}
            />
        );
        const buttons = screen.getAllByRole('button');
        await userEvent.click(buttons[1]);
        expect(handleDismiss).toHaveBeenCalledTimes(1);
    });
});
