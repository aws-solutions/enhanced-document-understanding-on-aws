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
import { fireEvent, render, screen } from '@testing-library/react';

import FileUpload from '../FileUpload/FileUpload';

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

    it('should render with default settings', () => {
        render(
            <FileUpload
                value={null}
                documentTypeList={[]}
                setDocumentTypeList={setDocumentTypeList}
                workflowConfig={workflowConfig}
                remainingAllowedDocs={{}}
            />
        );
        expect(screen.getByText('Choose file')).toBeTruthy();
    });

    it('should render with advanced settings', () => {
        render(
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
            />
        );
        expect(screen.getByText('Choose files')).toBeTruthy();
        expect(screen.getByText('Form field label')).toBeTruthy();
        expect(screen.getByText('This is a description')).toBeTruthy();
        expect(screen.getByText('This is a hint text with file requirements and constraints.')).toBeTruthy();
    });

    it('should render with custom button text', () => {
        render(
            <FileUpload
                value={null}
                buttonText="My custom button"
                documentTypeList={[]}
                setDocumentTypeList={setDocumentTypeList}
                workflowConfig={workflowConfig}
                remainingAllowedDocs={{}}
            />
        );
        expect(screen.getByText('My custom button')).toBeTruthy();
    });

    it('should render with selected file', () => {
        const file = new File(['1', '2'], 'filename.ext', {});
        render(
            <FileUpload
                value={file}
                documentTypeList={[]}
                setDocumentTypeList={setDocumentTypeList}
                workflowConfig={workflowConfig}
                remainingAllowedDocs={{}}
            />
        );
        expect(screen.getByText('filename.ext')).toBeTruthy();
        expect(screen.getByText('2.00 bytes')).toBeTruthy();
    });

    it('should render with multiple selected files', () => {
        const files = [
            new File(['1'], 'filename1.ext', {}),
            new File(['2', '3'], 'filename2.ext', {}),
            new File(['4', '5', '6'], 'filename3.ext', {})
        ];
        render(
            <FileUpload
                value={files}
                multiple
                documentTypeList={[]}
                setDocumentTypeList={setDocumentTypeList}
                workflowConfig={workflowConfig}
                remainingAllowedDocs={{}}
            />
        );
        expect(screen.getByText('filename1.ext')).toBeTruthy();
        expect(screen.getByText('1.00 bytes')).toBeTruthy();
        expect(screen.getByText('filename2.ext')).toBeTruthy();
        expect(screen.getByText('2.00 bytes')).toBeTruthy();
        expect(screen.getByText('filename3.ext')).toBeTruthy();
        expect(screen.getByText('3.00 bytes')).toBeTruthy();
    });

    it('should remove selected file', () => {
        const files = [
            new File(['1'], 'filename1.ext', {}),
            new File(['2', '3'], 'filename2.ext', {}),
            new File(['4', '5', '6'], 'filename3.ext', {})
        ];
        const handleChange = jest.fn();
        render(
            <FileUpload
                value={files}
                onChange={handleChange}
                multiple
                documentTypeList={[]}
                setDocumentTypeList={setDocumentTypeList}
                workflowConfig={workflowConfig}
                remainingAllowedDocs={{}}
            />
        );
        const buttons = screen.getAllByTestId('file-dismiss-button');
        fireEvent.click(buttons[1]);
        expect(handleChange).toHaveBeenCalledTimes(1);
        expect(handleChange).toHaveBeenCalledWith({
            cancelBubble: false,
            cancelable: false,
            defaultPrevented: false,
            detail: { value: [files[1], files[2]] }
        });
    });

    it('should render with error', () => {
        render(
            <FileUpload
                errorText="This is an error message."
                value={new File(['1', '2'], 'filename.ext', {})}
                documentTypeList={[]}
                setDocumentTypeList={setDocumentTypeList}
                workflowConfig={workflowConfig}
                remainingAllowedDocs={{}}
            />
        );
        expect(screen.getByText('This is an error message.')).toBeTruthy();
        expect(screen.queryByText('filename.ext')).not.toBeTruthy();
        expect(screen.queryByText('2.00 bytes')).not.toBeTruthy();
    });

    it('should select file', () => {
        const handleChange = jest.fn();
        const file = new File(['1', '2'], 'filename.ext', {});
        render(
            <FileUpload
                value={null}
                onChange={handleChange}
                documentTypeList={[]}
                setDocumentTypeList={setDocumentTypeList}
                workflowConfig={workflowConfig}
                remainingAllowedDocs={{}}
            />
        );
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

    it('should fire onChange if you upload a file with the same name twice', () => {
        const handleChange = jest.fn();
        const file = new File(['1', '2'], 'filename.txt', {});
        render(
            <FileUpload
                value={null}
                onChange={handleChange}
                documentTypeList={[]}
                setDocumentTypeList={setDocumentTypeList}
                workflowConfig={workflowConfig}
                remainingAllowedDocs={{}}
            />
        );
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

    it('should call handleButtonClick', () => {
        const handleChange = jest.fn();
        render(
            <FileUpload
                value={null}
                onChange={handleChange}
                documentTypeList={[]}
                setDocumentTypeList={setDocumentTypeList}
                workflowConfig={workflowConfig}
                remainingAllowedDocs={{}}
            />
        );
        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[0]);
    });
});
