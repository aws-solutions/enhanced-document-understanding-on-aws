// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Box, Icon, Select, SelectProps, SpaceBetween } from '@cloudscape-design/components';
import React, { LegacyRef, useEffect, useMemo, useRef } from 'react';
import { formatFileLastModified, formatFileSize, getBaseMetadata, isImageFile } from '../internal';

import { SelectedFileProps } from '../interfaces';

export const SelectedFile: React.FC<SelectedFileProps> = ({
    index,
    metadata,
    file,
    multiple = false,
    workflowConfig,
    documentTypeList,
    setDocumentTypeList,
    allowedDocs
}: SelectedFileProps) => {
    const thumbnail: LegacyRef<HTMLImageElement> = useRef(null);
    const baseMetadata = getBaseMetadata(metadata);
    const isImg = useMemo(() => isImageFile(file), [file]);

    const docTypeOptions: SelectProps.Option[] = [];
    Object.keys(allowedDocs).forEach((docType) => {
        if (allowedDocs[docType] > 0) {
            docTypeOptions.push({ label: docType + ' - ' + allowedDocs[docType], value: docType });
        }
    });

    const [selectedOption, setSelecteOption] = React.useState(
        documentTypeList.length > 0 && documentTypeList[index]
            ? { label: documentTypeList[index], value: documentTypeList[index] }
            : null
    );

    const handleDropdownChange = (selectionOption: any) => {
        setDocumentTypeList(index, selectionOption.value);
        setSelecteOption(selectionOption);
    };

    useEffect(() => {
        if (multiple && baseMetadata.thumbnail && isImg) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (thumbnail.current && thumbnail.current.src) {
                    thumbnail.current.src = reader.result as string;
                }
            };
            reader.readAsDataURL(file);
        }
    }, [multiple, file, baseMetadata.thumbnail, isImg]);

    useEffect(() => {
        setSelecteOption(
            documentTypeList.length > 0 && documentTypeList[index]
                ? { label: documentTypeList[index], value: documentTypeList[index] }
                : null
        );
    }, [documentTypeList, file, index]);

    return (
        <div
            style={{
                minWidth: 0,
                display: 'flex',
                flexFlow: 'row nowrap',
                alignItems: 'flex-start',
                gap: '8px'
            }}
        >
            <Box data-testid="selected-file-box">
                <SpaceBetween direction="vertical" size="xs">
                    <SpaceBetween direction="horizontal" size="xs">
                        <Icon variant="success" name="status-positive" />
                        {baseMetadata.thumbnail && multiple && isImg && (
                            <div style={{ maxWidth: '60px' }}>
                                <Box>
                                    <img
                                        data-testid="selected-file-img"
                                        alt={file.name}
                                        ref={thumbnail}
                                        src=""
                                        style={{ width: '100%', height: 'auto' }}
                                    />
                                </Box>
                            </div>
                        )}

                        <div style={{ overflow: 'hidden' }}>
                            <Box>
                                <SpaceBetween direction="vertical" size="xxxs">
                                    {baseMetadata.name && file.name && (
                                        <div
                                            style={{
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            <Box>
                                                <span
                                                    style={{
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden'
                                                    }}
                                                    title={file.name}
                                                >
                                                    {file.name}
                                                </span>
                                            </Box>
                                        </div>
                                    )}
                                    {baseMetadata.type && file.type && (
                                        <Box fontSize="body-s" color="text-body-secondary">
                                            {file.type}
                                        </Box>
                                    )}
                                    {baseMetadata.size && file.size > 0 && (
                                        <Box fontSize="body-s" color="text-body-secondary">
                                            {formatFileSize(file.size, baseMetadata)}
                                        </Box>
                                    )}
                                    {baseMetadata.lastModified && file.lastModified > 0 && (
                                        <Box fontSize="body-s" color="text-body-secondary">
                                            {formatFileLastModified(file.lastModified, baseMetadata)}
                                        </Box>
                                    )}
                                </SpaceBetween>
                            </Box>
                        </div>
                    </SpaceBetween>

                    <Select
                        selectedOption={selectedOption}
                        placeholder="Select document type"
                        onChange={({ detail }) => {
                            handleDropdownChange(detail.selectedOption);
                        }}
                        options={docTypeOptions}
                        selectedAriaLabel="Selected"
                        filteringType="auto"
                        data-testid="select-doc-type-dropdown"
                    />
                </SpaceBetween>
            </Box>
        </div>
    );
};
