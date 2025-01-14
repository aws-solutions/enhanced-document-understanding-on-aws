// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import './SelectedFileList.css';

import { Box, Button, SpaceBetween } from '@cloudscape-design/components';
import {
    borderRadiusItem,
    colorBackgroundItemSelected,
    colorBorderItemSelected,
    colorTextBodyDefault,
    colorTextBodySecondary
} from '@cloudscape-design/design-tokens';
import { fireDismissEvent, getBaseMetadata } from '../internal';

import React from 'react';
import { SelectedFile } from '../SelectedFile/SelectedFile';
import { SelectedFileListProps } from '../interfaces';

export const SelectedFileList: React.FC<SelectedFileListProps> = ({
    metadata,
    fileList,
    workflowConfig,
    onDismiss,
    documentTypeList,
    setDocumentTypeList,
    allowedDocs
}: SelectedFileListProps) => {
    const baseMetadata = getBaseMetadata(metadata);
    const handleClick = (index: number, file: File) => () => onDismiss && fireDismissEvent(onDismiss, { index, file });

    const items = fileList.map((file: File, idx: number) => {
        return (
            <div
                key={idx} // NOSONAR - Needed since files may be not unique. No performance issue will be minimal
                style={{
                    alignItems: 'flex-start',
                    backgroundColor: colorBackgroundItemSelected,
                    borderRadius: borderRadiusItem,
                    border: `2px solid ${colorBorderItemSelected}`,
                    boxSizing: 'border-box',
                    color: colorTextBodyDefault,
                    display: 'flex',
                    height: '100%',
                    padding: '4px 4px 4px 8px'
                }}
            >
                <Box
                    key={idx} // NOSONAR - Needed since files may be not unique. No performance issue will be minimal
                >
                    {' '}
                    <SpaceBetween direction="horizontal" size="xxxs">
                        <SelectedFile
                            key={idx} // NOSONAR - Needed since files may be not unique. No performance issue will be minimal
                            index={idx}
                            file={file}
                            metadata={baseMetadata}
                            multiple={true}
                            workflowConfig={workflowConfig}
                            documentTypeList={documentTypeList}
                            setDocumentTypeList={setDocumentTypeList}
                            allowedDocs={allowedDocs}
                        />

                        <div
                            style={{
                                backgroundColor: 'initial',
                                border: '1px solid #0000',
                                color: colorTextBodySecondary,
                                marginLeft: 'auto',
                                marginBottom: '10px',
                                padding: '0 4px',
                                width: '20%',
                                float: 'right'
                            }}
                        >
                            <Button
                                variant="icon"
                                iconName="close"
                                onClick={handleClick(idx, file)}
                                data-testid="file-dismiss-button"
                            />
                        </div>
                    </SpaceBetween>
                </Box>
            </div>
        );
    });

    return (
        <SpaceBetween direction="vertical" size="xs">
            {items}
        </SpaceBetween>
    );
};
