// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import {
    AppLayout,
    Box,
    Button,
    ContentLayout,
    Modal,
    Popover,
    SpaceBetween,
    StatusIndicator
} from '@cloudscape-design/components';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MAX_CASE_NAME_LENGTH, MIN_CASE_NAME_LENGTH } from '../../utils/constants';
import { FormContent, FormHeader } from './form-content';
import { BackendUploadInfoPanelContent } from '../../utils/info-panel-contents';
import { useCreateCaseMutation } from '../../store/reducers/caseApiSlice';

type CreateCaseViewProps = {};

export default function CreateCaseView(props: CreateCaseViewProps) {
    const [caseNameError, setCaseNameError] = React.useState('');
    const [currentStatus, setCurrentStatus] = React.useState('');
    const [backendUploadPrefix, setBackendUploadPrefix] = React.useState('');
    const [visible, setVisible] = React.useState(false);
    const [toolsOpen, setToolsOpen] = React.useState(false);
    const navigate = useNavigate();
    const [createCase] = useCreateCaseMutation();

    const postResource = async (params = {}) => {
        try {
            setCurrentStatus('loading');
            const response = await createCase(params).unwrap();
            setCurrentStatus('success');
            if (response.ddbResponse.ENABLE_BACKEND_UPLOAD) {
                setBackendUploadPrefix(response.ddbResponse.S3_FOLDER_PATH);
                setVisible(true);
            } else {
                setTimeout(function () {
                    navigate('/');
                }, 1000);
            }

            return response;
        } catch (err) {
            setCurrentStatus('error');
            console.error(err);
        }
    };

    const handleButtonClick = async (caseName: string, enableBackendUpload: boolean) => {
        if (!caseName.match(`^[a-zA-Z0-9_ -]{${MIN_CASE_NAME_LENGTH},${MAX_CASE_NAME_LENGTH}}$`)) {
            setCaseNameError(
                'Case name can only include alphanumeric characters, -, _, and spaces and must be between ' +
                    MIN_CASE_NAME_LENGTH +
                    ' and ' +
                    MAX_CASE_NAME_LENGTH +
                    ' characters.'
            );
        } else {
            setCurrentStatus('loading');
            setCaseNameError('');
            await postResource({ caseName: caseName, enableBackendUpload: enableBackendUpload });
        }
    };

    const handleModalClick = () => {
        setVisible(false);
        setBackendUploadPrefix('');
        setTimeout(function () {
            navigate('/');
        }, 1000);
    };

    return (
        <div>
            <AppLayout
                contentType="form"
                toolsOpen={toolsOpen}
                tools={<BackendUploadInfoPanelContent />}
                onToolsChange={({ detail }) => setToolsOpen(detail.open)}
                content={
                    <ContentLayout
                        header={
                            <SpaceBetween size="m">
                                <FormHeader />
                            </SpaceBetween>
                        }
                        data-testid="create-case-view-contentlayout"
                    >
                        <FormContent
                            handleButtonClick={handleButtonClick}
                            caseNameError={caseNameError}
                            currentStatus={currentStatus}
                        />
                        <Modal
                            visible={visible}
                            onDismiss={handleModalClick}
                            footer={
                                <Box float="right">
                                    <SpaceBetween direction="horizontal" size="xs">
                                        <Popover
                                            size="small"
                                            position="top"
                                            triggerType="custom"
                                            dismissButton={false}
                                            content={
                                                <StatusIndicator type="success">
                                                    {backendUploadPrefix} copied
                                                </StatusIndicator>
                                            }
                                        >
                                            <Button
                                                iconName="copy"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(backendUploadPrefix);
                                                }}
                                            >
                                                Copy
                                            </Button>
                                        </Popover>
                                        <Button variant="primary" onClick={handleModalClick}>
                                            Ok
                                        </Button>
                                    </SpaceBetween>
                                </Box>
                            }
                            header="S3 Folder Path for Backend Upload"
                        >
                            <SpaceBetween size="xs">
                                <h5>The path will disappear once this window closes</h5>
                                <p>path: {backendUploadPrefix}</p>
                            </SpaceBetween>
                        </Modal>
                    </ContentLayout>
                }
                headerSelector="#header"
                navigationHide
                date-testid="create-case-view-applayout"
            />
        </div>
    );
}
