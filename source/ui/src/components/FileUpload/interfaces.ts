// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ReactNode } from 'react';
import { WorkflowConfig } from '../UploadDocumentView';

export type FileType = File | File[] | null;
export type EventHandler<T> = (event: CustomEvent<T>) => void;
export type FireEvent<T> = (handler: EventHandler<T>, detail: T) => void;

export interface FileUploadProps {
    /**
     * A string that defines the file types the file input should accept.
     * This string is a comma-separated list of unique file type specifiers.
     * Because a given file type may be identified in more than one manner,
     * it's useful to provide a thorough set of type specifiers when you need
     * files of a given format.
     */
    accept?: string;
    /**
     * Adds an aria-label to the native control.
     * Use this if you don't have a visible label for this control.
     */
    ariaLabel?: string;
    /**
     * Specifies whether to add aria-required to the native control.
     */
    ariaRequired?: boolean;
    /**
     * Text displayed in the button element.
     */
    buttonText?: ReactNode;
    /**
     * Detailed information about the form field that's displayed below the label.
     */
    description?: ReactNode;
    /**
     * Specifies if the control is disabled, which prevents the user from
     * modifying the value and prevents the value from being included in a
     * form submission. A disabled control can't receive focus.
     */
    disabled?: boolean;
    /**
     * Text that displays as a validation message. If this is set to a
     * non-empty string, it will render the form field as invalid.
     */
    errorText?: ReactNode;
    /**
     * File metadata helps the user to validate and compare the files selected.
     * Choose the most relevant file metadata to display, based on your use case.
     */
    fileMetadata?: FileMetadata;
    /**
     * Constraint text that's displayed below the control. Use this to
     * provide additional information about valid formats, etc.
     */
    constraintText?: ReactNode;
    /**
     * Adds the specified ID to the root element of the component.
     */
    id?: string;
    /**
     * The main label for the form field.
     */
    label?: ReactNode;
    /**
     * Use to allow the selection of multiple files for upload from the
     * user's local drive. It uses tokens to display multiple files.
     * Files can be removed individually.
     */
    multiple?: boolean;
    /**
     * Called when the user selects a file.
     * The event detail contains the current value.
     * Not cancellable.
     */
    onChange?: EventHandler<ChangeDetail>;
    /**
     * Specifies the currently selected file(s).
     * If you want to clear the selection, use null.
     */
    value: FileType;

    /**
     * Workflow configuration that includes the document types available as
     * received from the param store when the front end is deployed
     */
    workflowConfig?: WorkflowConfig;

    /**
     * List of corresponding document types to files in value parameter
     */
    documentTypeList: string[];

    /**
     * Function that sets React state variable in parent component
     * @param index doc index to be modified
     * @param value value to modify document type to
     */
    setDocumentTypeList: Function;

    /**
     * Object with keys being the document types and values being the number
     * of documents that are allowed to be uploaded minus the amont already
     * uploaded for each document type
     */
    remainingAllowedDocs: any;
}

export interface ChangeDetail {
    value: FileType;
}

export interface DismissDetail {
    index: number;
    file: File;
}

export interface SelectedFileProps {
    index: number;
    metadata?: FileMetadata;
    file: File;
    className?: string;
    multiple?: boolean;
    workflowConfig?: WorkflowConfig;
    documentTypeList: string[];
    setDocumentTypeList: Function;
    allowedDocs: any;
}

export interface SelectedFileListProps {
    metadata?: FileMetadata;
    fileList: File[];
    workflowConfig?: WorkflowConfig;
    onDismiss: EventHandler<DismissDetail>;
    documentTypeList: string[];
    setDocumentTypeList: Function;
    allowedDocs: any;
}

export enum FileSize {
    BYTES = 'bytes',
    KB = 'KB',
    KIB = 'KiB',
    MB = 'MB',
    MIB = 'MiB',
    GB = 'GB',
    GIB = 'GiB'
}

export interface FileMetadata {
    /**
     * Show each file name.
     * Default: true
     */
    name?: boolean;
    /**
     * Show the file MIME type.
     * Default: false
     */
    type?: boolean;
    /**
     * Show file size expressed in bytes, KB, MB, GB, KiB, MiB, or GiB.
     * Default: 'bytes'
     */
    size?: FileSize;
    /**
     * Show the file last modified date.
     * Default: false
     */
    lastModified?: boolean;
    lastModifiedLocale?: string;
    /**
     * Show file thumbnail in multiple files upload case only.
     * Default: false
     */
    thumbnail?: boolean;
}
