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

import { Button, ButtonProps, FormField, SpaceBetween } from '@cloudscape-design/components';
import React, { ChangeEvent, ForwardedRef, useCallback, useMemo, useRef } from 'react';
import { DismissDetail, FileUploadProps } from './interfaces';
import { fireChangeEvent, getBaseButtonText } from './internal';

import { SelectedFile } from './SelectedFile/SelectedFile';
import { SelectedFileList } from './SelectedFileList/SelectedFileList';

/**
 *
 * @param param0 FileUploadProps @see FileUploadProps
 * @param ref
 * @returns
 */
const FileUploadComponent = (
    {
        accept = 'text/plain',
        ariaLabel,
        ariaRequired,
        buttonText,
        description,
        disabled,
        errorText,
        fileMetadata,
        constraintText,
        id,
        label,
        multiple = false,
        onChange,
        value,
        workflowConfig,
        documentTypeList,
        setDocumentTypeList,
        remainingAllowedDocs
    }: FileUploadProps,
    ref: ForwardedRef<ButtonProps.Ref>
) => {
    const fileInput = useRef<HTMLInputElement>(null);

    const handleButtonClick = () => fileInput.current && fileInput.current.click();

    const handleChange = useCallback(
        ({ target }: ChangeEvent<HTMLInputElement>) => {
            let newValue = null;
            if (target.files && target.files[0]) {
                if (multiple) {
                    newValue = value instanceof Array ? [...value, target.files[0]] : [target.files[0]];
                } else {
                    newValue = target.files[0];
                }
                setDocumentTypeList(value instanceof Array ? value.length : 0, '');
            }
            if (onChange) {
                fireChangeEvent(onChange, { value: newValue });
            }
        },
        [value, multiple, onChange]
    );

    const handleDismiss = useCallback(
        ({ detail }: CustomEvent<DismissDetail>) => {
            const { index, file } = detail;
            let newValue = value;
            if (multiple && value instanceof Array && value[index]) {
                newValue = value.filter((f, i) => f !== file && i !== index);
                setDocumentTypeList(index, null);
            }
            if (onChange) {
                fireChangeEvent(onChange, { value: newValue });
            }
        },
        [value, multiple, onChange]
    );

    const baseButtonText = useMemo((): React.ReactNode => {
        return getBaseButtonText(multiple, buttonText);
    }, [multiple, buttonText]);

    const selectedFiles = useMemo((): React.ReactNode => {
        if (errorText) {
            return null;
        }

        if (!multiple && value instanceof File) {
            return (
                <SelectedFile
                    index={0}
                    file={value}
                    metadata={fileMetadata}
                    multiple={false}
                    workflowConfig={workflowConfig}
                    documentTypeList={documentTypeList}
                    setDocumentTypeList={setDocumentTypeList}
                    allowedDocs={remainingAllowedDocs}
                />
            );
        }

        if (multiple && value instanceof Array) {
            return (
                <SelectedFileList
                    fileList={value}
                    metadata={fileMetadata}
                    onDismiss={handleDismiss}
                    workflowConfig={workflowConfig}
                    documentTypeList={documentTypeList}
                    setDocumentTypeList={setDocumentTypeList}
                    allowedDocs={remainingAllowedDocs}
                />
            );
        }
    }, [
        errorText,
        multiple,
        value,
        workflowConfig,
        fileMetadata,
        documentTypeList,
        setDocumentTypeList,
        handleDismiss
    ]);

    return (
        <SpaceBetween size="xs">
            <FormField
                controlId={id}
                label={label}
                description={description}
                errorText={errorText}
                constraintText={constraintText}
                data-testid="choose-file-form-field"
            >
                <Button ref={ref} iconName="upload" formAction="none" disabled={disabled} onClick={handleButtonClick}>
                    <input
                        id={id}
                        ref={fileInput}
                        type="file"
                        multiple={false}
                        disabled={disabled}
                        aria-label={ariaLabel}
                        aria-required={ariaRequired ? 'true' : 'false'}
                        accept={accept}
                        onChange={handleChange}
                        hidden
                        data-testid="choose-file-input"
                    />
                    <span>{baseButtonText}</span>
                </Button>
            </FormField>
            {selectedFiles}
        </SpaceBetween>
    );
};

const FileUpload = React.forwardRef(FileUploadComponent);
export default FileUpload;
