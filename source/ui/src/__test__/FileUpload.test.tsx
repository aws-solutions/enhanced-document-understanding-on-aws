// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import FileUpload from '../components/FileUpload/FileUpload';
import { renderWithProviders } from './utils/tesUtils';

describe('FileUpload', () => {
    const setDocumentTypeList = jest.fn();
    const workflowConfig = {
        NumRequiredDocuments: 1,
        UniqueDocumentTypes: ['generic'],
        WorkflowConfigName: 'default'
    };
    it('should exist', () => {
        expect(FileUpload).toBeTruthy();
    });

    it('should render with default settings', async () => {
        renderWithProviders(
            <FileUpload
                value={null}
                documentTypeList={[]}
                setDocumentTypeList={setDocumentTypeList}
                workflowConfig={workflowConfig}
                remainingAllowedDocs={{}}
            />,
            {
                routerProvided: false
            }
        );
        await waitFor(() => {
            expect(screen.getByText('Choose file')).toBeTruthy();
        });
    });

    it('should render with advanced settings', async () => {
        renderWithProviders(
            <FileUpload
                value={null}
                label="Form field label"
                description="This is a description"
                constraintText="This is a hint text with file requirements and constraints."
                multiple
                documentTypeList={[]}
                setDocumentTypeList={setDocumentTypeList}
                workflowConfig={workflowConfig}
                remainingAllowedDocs={{}}
            />,
            {
                routerProvided: false
            }
        );

        await waitFor(() => {
            expect(screen.getByText('Choose files')).toBeTruthy();
            expect(screen.getByText('Form field label')).toBeTruthy();
            expect(screen.getByText('This is a description')).toBeTruthy();
            expect(screen.getByText('This is a hint text with file requirements and constraints.')).toBeTruthy();
        });
    });

    it('should render with custom button text', async () => {
        renderWithProviders(
            <FileUpload
                value={null}
                buttonText="My custom button"
                documentTypeList={[]}
                setDocumentTypeList={setDocumentTypeList}
                workflowConfig={workflowConfig}
                remainingAllowedDocs={{}}
            />,
            {
                routerProvided: false
            }
        );
        await waitFor(() => {
            expect(screen.getByText('My custom button')).toBeTruthy();
        });
    });

    it('should render with selected file', async () => {
        const file = new File(['1', '2'], 'filename.ext', {});
        renderWithProviders(
            <FileUpload
                value={file}
                documentTypeList={[]}
                setDocumentTypeList={setDocumentTypeList}
                workflowConfig={workflowConfig}
                remainingAllowedDocs={{}}
            />,
            {
                routerProvided: false
            }
        );

        await waitFor(() => {
            expect(screen.getByText('filename.ext')).toBeTruthy();
            expect(screen.getByText('2.00 bytes')).toBeTruthy();
        });
    });

    it('should render with multiple selected files', async () => {
        const files = [
            new File(['1'], 'filename1.ext', {}),
            new File(['2', '3'], 'filename2.ext', {}),
            new File(['4', '5', '6'], 'filename3.ext', {})
        ];
        renderWithProviders(
            <FileUpload
                value={files}
                multiple
                documentTypeList={[]}
                setDocumentTypeList={setDocumentTypeList}
                workflowConfig={workflowConfig}
                remainingAllowedDocs={{}}
            />,
            {
                routerProvided: false
            }
        );

        await waitFor(() => {
            expect(screen.getByText('filename1.ext')).toBeTruthy();
            expect(screen.getByText('1.00 bytes')).toBeTruthy();
            expect(screen.getByText('filename2.ext')).toBeTruthy();
            expect(screen.getByText('2.00 bytes')).toBeTruthy();
            expect(screen.getByText('filename3.ext')).toBeTruthy();
            expect(screen.getByText('3.00 bytes')).toBeTruthy();
        });
    });

    it('should remove selected file', async () => {
        const files = [
            new File(['1'], 'filename1.ext', {}),
            new File(['2', '3'], 'filename2.ext', {}),
            new File(['4', '5', '6'], 'filename3.ext', {})
        ];
        const handleChange = jest.fn();
        renderWithProviders(
            <FileUpload
                value={files}
                onChange={handleChange}
                multiple
                documentTypeList={[]}
                setDocumentTypeList={setDocumentTypeList}
                workflowConfig={workflowConfig}
                remainingAllowedDocs={{}}
            />,
            {
                routerProvided: false
            }
        );

        await waitFor(() => {
            const buttons = screen.getAllByTestId('file-dismiss-button');
            fireEvent.click(buttons[1]);
            expect(handleChange).toHaveBeenCalledTimes(1);
        });
    });

    it('should render with error', async () => {
        renderWithProviders(
            <FileUpload
                errorText="This is an error message."
                value={new File(['1', '2'], 'filename.ext', {})}
                documentTypeList={[]}
                setDocumentTypeList={setDocumentTypeList}
                workflowConfig={workflowConfig}
                remainingAllowedDocs={{}}
            />,
            {
                routerProvided: false
            }
        );

        await waitFor(() => {
            expect(screen.getByText('This is an error message.')).toBeTruthy();
            expect(screen.queryByText('filename.ext')).not.toBeTruthy();
            expect(screen.queryByText('2.00 bytes')).not.toBeTruthy();
        });
    });

    it('should select file', async () => {
        const handleChange = jest.fn();
        const file = new File(['1', '2'], 'filename.ext', {});
        renderWithProviders(
            <FileUpload
                value={null}
                onChange={handleChange}
                documentTypeList={[]}
                setDocumentTypeList={setDocumentTypeList}
                workflowConfig={workflowConfig}
                remainingAllowedDocs={{}}
            />,
            {
                routerProvided: false
            }
        );

        await waitFor(() => {
            const input = screen.getByTestId('choose-file-input') as Element;
            expect(input).toBeTruthy();
            fireEvent.change(input, { target: { files: [file] } });
            expect(handleChange).toHaveBeenCalledWith({
                cancelBubble: false,
                cancelable: false,
                defaultPrevented: false,
                detail: { value: file }
            });
        });
    });

    it('should fire onChange if you upload a file with the same name twice', async () => {
        const handleChange = jest.fn();
        const file = new File(['1', '2'], 'filename.txt', {});
        renderWithProviders(
            <FileUpload
                value={null}
                onChange={handleChange}
                documentTypeList={[]}
                setDocumentTypeList={setDocumentTypeList}
                workflowConfig={workflowConfig}
                remainingAllowedDocs={{}}
            />,
            {
                routerProvided: false
            }
        );

        await waitFor(() => {
            const input = screen.getByTestId('choose-file-input') as Element;
            expect(input).toBeTruthy();
            fireEvent.change(input, { target: { files: [file] } });
            expect(handleChange).nthCalledWith(1, {
                cancelBubble: false,
                cancelable: false,
                defaultPrevented: false,
                detail: { value: file }
            });

            fireEvent.change(input, { target: { files: [file] } });
            expect(handleChange).nthCalledWith(2, {
                cancelBubble: false,
                cancelable: false,
                defaultPrevented: false,
                detail: { value: file }
            });
        });
    });

    it('should call handleButtonClick', async () => {
        const handleChange = jest.fn();
        renderWithProviders(
            <FileUpload
                value={null}
                onChange={handleChange}
                documentTypeList={[]}
                setDocumentTypeList={setDocumentTypeList}
                workflowConfig={workflowConfig}
                remainingAllowedDocs={{}}
            />,
            {
                routerProvided: false
            }
        );

        await waitFor(() => {
            const buttons = screen.getAllByRole('button');
            fireEvent.click(buttons[0]);
        });
    });
});
