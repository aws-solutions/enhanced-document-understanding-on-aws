// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
    Alert,
    AppLayout,
    Button,
    Container,
    ContentLayout,
    Form,
    FormField,
    Header,
    ProgressBar,
    Select,
    SelectProps,
    SpaceBetween
} from '@cloudscape-design/components';
import { FileSize, FileType } from './FileUpload/interfaces';

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MAX_UPLOAD_FILE_SIZE } from '../utils/constants';
import FileUpload from './FileUpload/FileUpload';
import { formatFileSize } from './FileUpload/internal';
import StartJobButton from './buttons/StartJobButton';
import { useUploadDocumentMutation } from '../store/reducers/documentApiSlice';
import { Auth } from 'aws-amplify';

export interface WorkflowConfig {
    NumRequiredDocuments: number;
    UniqueDocumentTypes: string[];
    WorkflowConfigName: string;
}

type UploadDocumentViewProps = {
    caseName?: string;
    caseId?: string;
    casesList: any[];
    workflowConfig: WorkflowConfig;
    selectedCaseRemainingRequiredDocs: any;
};

type Case = {
    name: string;
    status: string;
    caseDocuments: Object[];
    dateCreated: string;
};

type CaseMap = {
    [key: string]: Case;
};

enum Status {
    IN_PROGRESS = 'in-progress',
    SUCCESS = 'success',
    ERROR = 'error'
}
export async function getUsername(): Promise<string | undefined> {
    try {
        const user = await Auth.currentAuthenticatedUser();
        const username = user.username;
        return username;
    } catch (error) {
        console.error('error REST API:', error);
    }
}

export default function UploadDocumentView(props: UploadDocumentViewProps) {
    let caseMap: CaseMap = {};
    let casesOptions: SelectProps.Option[] = [];

    const [uploadDocument] = useUploadDocumentMutation();

    const updateCaseMap = () => {
        if (props.casesList) {
            for (const item of props.casesList) {
                const _case: Case = {
                    name: item.name,
                    status: item.status,
                    caseDocuments: item.caseDocuments,
                    dateCreated: item.dateCreated
                };
                caseMap[item.caseId] = _case;
            }
        }
        for (const caseId in caseMap) {
            casesOptions.push({
                label: caseMap[caseId].name,
                value: caseId,
                description: `Case Id: ${caseId}`,
                disabled:
                    caseMap[caseId].status !== 'initiate' ||
                    caseMap[caseId].caseDocuments.length >= props.workflowConfig.NumRequiredDocuments
            });
        }
    };

    updateCaseMap();

    let caseId: string | undefined;
    if (props.caseId) {
        caseId = props.caseId;
    }

    const [initialSelectedCaseId] = React.useState<string>(caseId!);
    const [initialSelectedCaseName] = React.useState<string>(caseMap[initialSelectedCaseId]?.name);
    const [selectedCaseOption, setSelectedCaseOption] = React.useState<SelectProps.Option>({
        label: initialSelectedCaseName,
        value: initialSelectedCaseId
    });
    const [chosenFiles, setChosenFiles] = React.useState<File[]>([]);
    const [showProgressBar, setShowProgressBar] = React.useState(false);
    const [progressStatus, setProgressStatus] = React.useState<Status | undefined>();
    const [filesFailedToUpload, setFilesFailedToUpload] = React.useState<string[]>([]);
    const [uploadResultMessage, setUploadResultMessage] = React.useState('');
    const [uploadProgress, setUploadProgress] = React.useState(0);
    const [chooseFilesError, setChooseFilesError] = React.useState('');
    const [allFilesAttempted, setAllFilesAttempted] = React.useState(false);
    const [documentTypeList, setDocumentTypeList] = React.useState<string[]>([]);
    const [selectedCaseRemainingAllowedDocs, setSelectedCaseRemainingAllowedDocs] = React.useState();
    const navigate = useNavigate();

    const fileMetadata = { name: true, type: true, size: FileSize.MB, lastModified: true, thumbnail: true };
    const allowMultipleFiles = true;

    React.useEffect(() => {
        const newRemainingDocs = Object.assign({}, props.selectedCaseRemainingRequiredDocs);

        for (let docType of documentTypeList) {
            if (newRemainingDocs[docType]) {
                newRemainingDocs[docType] -= 1;
            }
        }
        setSelectedCaseRemainingAllowedDocs(newRemainingDocs);
    }, [documentTypeList, props.selectedCaseRemainingRequiredDocs]);

    const handleFileSelection = async (newFiles: FileType) => {
        setChooseFilesError('');
        if (newFiles instanceof File) {
            if (MAX_UPLOAD_FILE_SIZE && newFiles.size > MAX_UPLOAD_FILE_SIZE) {
                setChooseFilesError(
                    'File size must be less than ' + formatFileSize(MAX_UPLOAD_FILE_SIZE, fileMetadata)
                );
            } else {
                setChosenFiles([newFiles]);
            }
        } else if (newFiles instanceof Array) {
            if (MAX_UPLOAD_FILE_SIZE) {
                const numFilesAttempted = newFiles.length;
                newFiles = newFiles.filter((file) => file.size <= MAX_UPLOAD_FILE_SIZE);
                if (newFiles.length < numFilesAttempted) {
                    setChooseFilesError(
                        'File size must be less than ' + formatFileSize(MAX_UPLOAD_FILE_SIZE, fileMetadata)
                    );
                }
            }
            setChosenFiles(newFiles);
        }
    };

    const uploadFile = async (
        files: File[],
        index: number,
        postPolicyFields: { [key: string]: string },
        bucketUrl: string
    ) => {
        let postData = new FormData();
        for (const [key, entry] of Object.entries(postPolicyFields)) {
            postData.append(key, entry);
        }
        postData.append('file', files[index]);
        const data = {
            method: 'POST',
            body: postData
        };
        const response = await fetch(bucketUrl, data);
        if (200 <= response.status && response.status < 300) {
            setUploadProgress((uploadProgress) => uploadProgress + Math.ceil((1 / chosenFiles.length) * 100));
        } else {
            setFilesFailedToUpload((filesFailedToUpload) => [...filesFailedToUpload, files[index].name]);
        }
        if (index === chosenFiles.length - 1) {
            setAllFilesAttempted(true);
        }
    };

    const handleUploadClick = async () => {
        setProgressStatus(Status.IN_PROGRESS);
        setFilesFailedToUpload((filesFailedToUpload) => []);
        setUploadResultMessage('');
        setUploadProgress(0);
        setShowProgressBar(true);
        setAllFilesAttempted(false);

        const userName = await getUsername();
        let promiseArray = [];
        for (let i = 0; i < chosenFiles.length; i++) {
            const apiRequest = await uploadDocument({
                userId: userName,
                caseId: selectedCaseOption.value,
                caseName: selectedCaseOption.label,
                fileName: chosenFiles[i].name,
                fileExtension: '.' + chosenFiles[i].name.split('.').pop(),
                documentType: documentTypeList[i]
            }).unwrap();
            promiseArray.push(apiRequest);
        }

        await Promise.allSettled(promiseArray).then(async (results) => {
            results.forEach((result, i) => {
                if (result.status === 'fulfilled') {
                    if (result.value === undefined) {
                        setFilesFailedToUpload((filesFailedToUpload) => [...filesFailedToUpload, chosenFiles[i].name]);
                        setUploadResultMessage((uploadResultMessage) => 'File upload failed');
                        setProgressStatus(Status.ERROR);
                    } else {
                        uploadFile(chosenFiles, i, result.value.fields, result.value.url);
                    }
                }
            });
        });
        setChosenFiles([]);
    };

    const allowChooseFiles = () => {
        if (selectedCaseOption.value !== undefined && caseMap[selectedCaseOption.value] !== undefined) {
            return (
                chosenFiles.length <
                props.workflowConfig.NumRequiredDocuments - caseMap[selectedCaseOption.value].caseDocuments.length
            );
        }
        return false;
    };

    const updateDocumentTypeList = (index: number, value: string | null) => {
        const updatedList = [...documentTypeList];
        if (index >= updatedList.length) {
            updatedList.push(value!);
        } else if (value === null) {
            updatedList.splice(index, 1);
        } else {
            updatedList[index] = value;
        }
        setDocumentTypeList(updatedList);
    };

    const allowUploadFiles = () => {
        if (selectedCaseOption.value !== undefined && caseMap[selectedCaseOption.value] !== undefined) {
            return (
                chosenFiles.length > 0 &&
                caseMap[selectedCaseOption.value].caseDocuments.length + chosenFiles.length <=
                    props.workflowConfig.NumRequiredDocuments
            );
        }
        return false;
    };

    React.useEffect(() => {
        if (uploadProgress < 100 && allFilesAttempted) {
            setProgressStatus(Status.ERROR);
            setUploadResultMessage((uploadResultMessage) => 'File upload failed');
        } else if (uploadProgress >= 100 && allFilesAttempted) {
            setProgressStatus(Status.SUCCESS);
            setUploadResultMessage((uploadResultMessage) => 'Files uploaded sucessfully');
        } else if (uploadProgress > 0 && uploadProgress < 100 && !allFilesAttempted) {
            setProgressStatus(Status.IN_PROGRESS);
        }
    }, [uploadProgress, progressStatus, allFilesAttempted]);

    return (
        <>
            <AppLayout
                contentType="form"
                content={
                    <ContentLayout
                        header={
                            <SpaceBetween size="m">
                                <Header variant="h1">Upload Documents</Header>
                            </SpaceBetween>
                        }
                        data-testid="doc-upload-view-contentlayout"
                    >
                        <form onSubmit={(event) => event.preventDefault()}>
                            <Form
                                actions={
                                    <SpaceBetween direction="horizontal" size="xs">
                                        {showProgressBar && (
                                            <ProgressBar
                                                value={uploadProgress}
                                                additionalInfo={uploadResultMessage}
                                                variant="key-value"
                                                label="Document Upload Status"
                                                status={progressStatus}
                                                data-testid="upload-document-progress-bar"
                                            />
                                        )}
                                        <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>
                                        <Button
                                            data-testid="upload-documents-button"
                                            variant="primary"
                                            onClick={() => handleUploadClick()}
                                            disabled={!allowUploadFiles()}
                                        >
                                            Upload Documents
                                        </Button>
                                        <StartJobButton
                                            caseId={selectedCaseOption.value ?? ''}
                                            disabled={allowUploadFiles()}
                                        />
                                        <Button variant="link" onClick={() => navigate(`/`)}>
                                            Done
                                        </Button>
                                    </SpaceBetween>
                                }
                                errorIconAriaLabel="Error"
                            >
                                <Container>
                                    <SpaceBetween direction="vertical" size="l">
                                        <FormField
                                            label="Case name"
                                            i18nStrings={{ errorIconAriaLabel: 'Error' }}
                                            data-testid="case-name-field"
                                        >
                                            <Select
                                                selectedOption={selectedCaseOption}
                                                onChange={({ detail }) => setSelectedCaseOption(detail.selectedOption)}
                                                options={casesOptions}
                                                filteringType="auto"
                                                selectedAriaLabel="Selected"
                                                data-testid="upload-doc-case-select"
                                            />
                                        </FormField>
                                        <FileUpload
                                            label="Files to upload"
                                            accept=".png,.pdf,.jpg,.jpeg"
                                            fileMetadata={fileMetadata}
                                            multiple={allowMultipleFiles}
                                            value={chosenFiles}
                                            description={
                                                'Please choose the files you wish to upload to the selected case'
                                            }
                                            disabled={!allowChooseFiles()}
                                            errorText={chooseFilesError}
                                            data-testid="file-upload-field"
                                            onChange={({ detail }) => handleFileSelection(detail.value)}
                                            workflowConfig={props.workflowConfig}
                                            documentTypeList={documentTypeList}
                                            setDocumentTypeList={updateDocumentTypeList}
                                            remainingAllowedDocs={selectedCaseRemainingAllowedDocs}
                                        ></FileUpload>
                                    </SpaceBetween>
                                </Container>
                            </Form>
                        </form>
                        {uploadResultMessage === 'File upload failed' && filesFailedToUpload.length > 0 && (
                            <Alert
                                statusIconAriaLabel="Error"
                                type="error"
                                header="Failed to upload the following files: "
                            >
                                {filesFailedToUpload.map((fileName, i) => (
                                    <li key={fileName + i}>{fileName}</li> // NOSONAR - fix to make displayed file names unique to be implemented in the future
                                ))}
                            </Alert>
                        )}
                    </ContentLayout>
                }
                headerSelector="#header"
                navigationHide
                toolsHide
                date-testid="doc-upload-view-applayout"
            />
        </>
    );
}
