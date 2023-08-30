/**********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

import {
    Alert,
    AppLayout,
    Box,
    Button,
    Header,
    Pagination,
    SpaceBetween,
    SplitPanel,
    Table,
    TextContent,
    TextFilter
} from '@cloudscape-design/components';
import { API, Auth } from 'aws-amplify';
import { COLUMN_DEFINITIONS_MAIN, CasePreferences, DEFAULT_PREFERENCES } from './table-config';
import { EMPTY_PANEL_CONTENT, useSplitPanel } from './utils';

import { useCollection } from '@cloudscape-design/collection-hooks';
import React, { useCallback, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { isStatusSuccess, renderStatus } from '../../utils/common-renderers';
import { API_NAME } from '../../utils/constants';
import { mapResultsToCases } from '../makeData';
import { TableEmptyState, TableNoMatchState } from './common-components';

import { CasePageHeader } from './full-page-header';
import { appLayoutAriaLabels } from './i18n-strings/app-layout';
import { paginationAriaLabels } from './i18n-strings/pagination';
import { splitPanelI18nStrings } from './i18n-strings/split-panel';
import { getTextFilterCounterText } from './i18n-strings/text-filter';
import { CaseTableInfoPanelContent } from '../../utils/info-panel-contents';

let token: string;
let results: any;

export interface DocumentTableProps {
    selectedDocumentId: string | null;
    setSelectedDocumentId: Function;
    selectedCaseId: string | null;
    setSelectedCaseId: Function;
    selectedDocumentFileType: string | null;
    setSelectedDocumentFileType: Function;
    setCasesList: Function;
    setSelectedCaseName: Function;
    numRequiredDocuments: number;
    requiredDocTypes?: string[];
    setSelectedDocumentName: Function;
}

export async function generateToken() {
    try {
        const user = await Auth.currentAuthenticatedUser();
        const token = user.getSignInUserSession().getIdToken().getJwtToken();
        return token;
    } catch (error) {
        console.error('error REST API:', error);
    }
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

export default function DocumentTable(props: DocumentTableProps) {
    const [data, setData] = React.useState<any[]>([]);
    const navigate = useNavigate();
    const [currentStatus, setCurrentStatus] = React.useState('');
    const [toolsOpen, setToolsOpen] = React.useState(false);

    const fetchData = async () => {
        try {
            setCurrentStatus('loading');
            token = await generateToken();
            results = await API.get(API_NAME, 'cases', {
                headers: {
                    Authorization: token
                }
            });
            const newData = mapResultsToCases(results.Items);
            setData(newData);
            props.setCasesList(newData);
            setCurrentStatus('success');
        } catch (error) {
            setCurrentStatus('error');
            console.error(error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUploadButtonClick = useCallback((caseId: string) => {
        props.setSelectedCaseId(caseId);
        if (collectionProps.selectedItems?.length) {
            props.setSelectedCaseName(collectionProps.selectedItems[0].name);
        }
        navigate(`/uploadDocument`);
    }, []);

    const createDocumentLinkButton = (row: any, item: any) => {
        return (
            <Button variant="link" onClick={() => handleDocumentClick(item.caseId, row.docId, row.fileType, row.name)}>
                {row.name}
            </Button>
        );
    };

    const getPanelContent = (items: any) => {
        if (!items.length) {
            return EMPTY_PANEL_CONTENT;
        }
        const item = items[0];
        const columnDefinitions = [
            {
                id: 'name',
                header: 'Document Name',
                cell: (row: any) => createDocumentLinkButton(row, item)
            },
            {
                id: 'docId',
                header: 'Document ID',
                cell: (row: any) => row.docId
            },
            {
                id: 'dateCreated',
                header: 'Creation Date',
                cell: (row: any) => row.dateCreated
            },
            {
                id: 'fileType',
                header: 'File type',
                cell: (row: any) => row.fileType
            }
        ];

        return {
            header: item.name,
            body: (
                <Box>
                    <Table
                        header={
                            <Box>
                                <SpaceBetween direction="vertical" size="s">
                                    <Header
                                        variant="h2"
                                        counter={`(${item.caseDocuments.length})`}
                                        actions={
                                            <Box>
                                                <Button
                                                    variant="primary"
                                                    onClick={() => handleUploadButtonClick(item.caseId)}
                                                    data-testid="document-table-upload-document"
                                                    disabled={item.caseDocuments.length >= props.numRequiredDocuments}
                                                >
                                                    Upload Document
                                                </Button>
                                            </Box>
                                        }
                                    >
                                        Documents
                                    </Header>

                                    {item.caseDocuments.length >= props.numRequiredDocuments && (
                                        <Alert statusIconAriaLabel="Info" header="Required Documents Uploaded">
                                            Each case is configured to accept {props.numRequiredDocuments} document
                                            {props.numRequiredDocuments > 1 ? 's' : ''}.{' '}
                                            <NavLink to="/createCase">Create a new case</NavLink> to upload more
                                            documents
                                        </Alert>
                                    )}

                                    <TextContent>
                                        <p>
                                            Please upload <strong>{props.numRequiredDocuments}</strong> document
                                            {props.numRequiredDocuments > 1 ? 's' : ''} of type:{' '}
                                            <strong>{props.requiredDocTypes?.join(', ')}</strong> <br />
                                        </p>
                                    </TextContent>
                                </SpaceBetween>
                            </Box>
                        }
                        columnDefinitions={columnDefinitions}
                        items={item.caseDocuments}
                        variant="embedded"
                        data-testid="document-table-splitpanel-table"
                    />
                </Box>
            )
        };
    };

    const [preferences, setPreferences] = React.useState(DEFAULT_PREFERENCES);
    const { items, actions, filteredItemsCount, collectionProps, filterProps, paginationProps } = useCollection(data, {
        filtering: {
            empty: <TableEmptyState resourceName="Case" buttonOnClick={() => navigate(`/createCase`)} />,
            noMatch: <TableNoMatchState onClearFilter={() => actions.setFiltering('')} />
        },
        pagination: { pageSize: preferences.pageSize },
        selection: {}
        // sorting: {
        //     defaultState: {
        //         isDescending: descendingSorting,
        //         sortingColumn: sortingColumn
        //     }
        // }
    });

    useEffect(() => {
        if (collectionProps.selectedItems?.length) {
            props.setSelectedCaseId(collectionProps.selectedItems[0].caseId);
            props.setSelectedCaseName(collectionProps.selectedItems[0].name);
        }
    });

    const { header: panelHeader, body: panelBody } = getPanelContent(collectionProps.selectedItems);
    const { splitPanelOpen, onSplitPanelToggle, splitPanelSize, onSplitPanelResize } = useSplitPanel(
        collectionProps.selectedItems
    );

    const handleDocumentClick = useCallback(
        (caseId: string, docId: string, fileType: string, docName: string) => {
            const sanitizedFileType = fileType.replace('.', '');

            props.setSelectedDocumentId(docId);
            props.setSelectedCaseId(caseId);
            props.setSelectedDocumentFileType(sanitizedFileType);
            props.setSelectedDocumentName(docName);
            if (collectionProps.selectedItems?.length) {
                props.setSelectedCaseName(collectionProps.selectedItems[0].name);
                window.sessionStorage.setItem('selectedCaseName', collectionProps.selectedItems[0].name);
            }

            window.sessionStorage.setItem('selectedDocumentName', docName);
            window.sessionStorage.setItem('selectedDocumentId', docId);
            window.sessionStorage.setItem('selectedCaseId', caseId);
            window.sessionStorage.setItem('selectedDocumentFileType', sanitizedFileType);
            navigate(`${caseId}/document/${docId}`);
        },
        [collectionProps.selectedItems, navigate, props]
    );

    const tableContent = isStatusSuccess(currentStatus) ? (
        <Table
            {...collectionProps}
            header={
                <CasePageHeader
                    title="Cases"
                    createButtonText="Create case"
                    selectedItemsCount={collectionProps.selectedItems?.length || 0}
                    counter={'(' + data.length.toString() + ')'}
                    data-testid="document-table-header"
                    refreshFunction={fetchData}
                    onInfoLinkClick={() => {
                        setToolsOpen(true);
                    }}
                />
            }
            columnDefinitions={COLUMN_DEFINITIONS_MAIN}
            items={items}
            variant="full-page"
            stickyHeader={true}
            selectionType="single"
            filter={
                <TextFilter
                    {...filterProps}
                    filteringAriaLabel="Filter cases"
                    filteringPlaceholder="Find cases"
                    filteringClearAriaLabel="Clear"
                    countText={getTextFilterCounterText(filteredItemsCount || 0)}
                    data-testid="document-table-search"
                />
            }
            wrapLines={preferences.wrapLines}
            stripedRows={preferences.stripedRows}
            contentDensity={preferences.contentDensity as 'comfortable' | 'compact' | undefined}
            pagination={<Pagination {...paginationProps} ariaLabels={paginationAriaLabels} />}
            preferences={<CasePreferences preferences={preferences} setPreferences={setPreferences} />}
            data-testid="document-table-cases-table"
        />
    ) : (
        renderStatus(currentStatus, true, false, 'Error loading cases.', '')
    );

    return (
        <AppLayout
            contentType="table"
            headerSelector="#header"
            navigationHide
            toolsOpen={toolsOpen}
            tools={<CaseTableInfoPanelContent />}
            onToolsChange={({ detail }) => setToolsOpen(detail.open)}
            splitPanelOpen={splitPanelOpen}
            onSplitPanelToggle={onSplitPanelToggle}
            splitPanelSize={splitPanelSize}
            onSplitPanelResize={onSplitPanelResize}
            splitPanel={
                <SplitPanel
                    header={panelHeader}
                    i18nStrings={splitPanelI18nStrings}
                    data-testid="document-table-splitpanel"
                >
                    {panelBody}
                </SplitPanel>
            }
            content={tableContent}
            ariaLabels={appLayoutAriaLabels}
            data-testid="document-table-applayout"
        />
    );
}
