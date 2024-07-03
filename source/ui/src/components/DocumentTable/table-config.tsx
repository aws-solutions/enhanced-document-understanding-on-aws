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
import { CollectionPreferences, StatusIndicator } from '@cloudscape-design/components';

import { CaseStatusDisplayTextMapping } from '../../utils/constants';

export const CasePreferences = (props: any) => (
    <Preferences
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        visibleContentOptions={[
            {
                label: 'Main case properties',
                options: [
                    { id: 'name', label: 'Case ID', editable: false },
                    { id: 'dateCreated', label: 'Creation Date' }
                ]
            }
        ]}
        {...props}
    />
);

const CaseStatusDisplayIndicatorMapping: any = {
    'initiate': 'in-progress', // displays 3 dots
    'in-process': 'loading', // displays a spinner'
    'failure': 'error',
    'success': 'success'
};

export const COLUMN_DEFINITIONS_MAIN = [
    {
        id: 'name',
        header: 'Case Name',
        cell: (item: any) => item.name
    },
    {
        id: 'caseId',
        header: 'Case ID',
        cell: (item: any) => item.caseId
    },
    {
        id: 'dateCreated',
        header: 'Creation Date',
        cell: (item: any) => item.dateCreated
    },
    {
        id: 'numberOfDocuments',
        header: 'Number of documents',
        cell: (item: any) => item.docCount
    },
    {
        id: 'backendUploadEnabled',
        header: 'Backend Upload Enabled',
        cell: (item: any) => item.enableBackendUpload
    },
    {
        id: 'caseStatus',
        header: 'Status',
        cell: (item: any) => (
            <>
                <StatusIndicator type={CaseStatusDisplayIndicatorMapping[item.status]}>
                    {' '}
                    {CaseStatusDisplayTextMapping[item.status]}{' '}
                </StatusIndicator>
            </>
        )
    }
];

export const DEFAULT_PREFERENCES = {
    pageSize: 20,
    visibleContent: ['name', 'dateCreated'],
    wrapLines: false,
    stripedRows: false,
    contentDensity: 'comfortable'
};

const PAGE_SIZE_OPTIONS = [
    { value: 10, label: '10 Cases' },
    { value: 20, label: '20 Cases' },
    { value: 30, label: '30 Cases' },
    { value: 50, label: '50 Cases' },
    { value: 100, label: '100 Cases' }
];

export const Preferences = ({ preferences, setPreferences, disabled, pageSizeOptions = PAGE_SIZE_OPTIONS }: any) => (
    <CollectionPreferences
        title="Preferences"
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        disabled={disabled}
        preferences={preferences}
        onConfirm={({ detail }) => setPreferences(detail)}
        pageSizePreference={{
            title: 'Page size',
            options: pageSizeOptions
        }}
        wrapLinesPreference={{
            label: 'Wrap lines',
            description: 'Check to see all the text and wrap the lines'
        }}
        stripedRowsPreference={{
            label: 'Striped rows',
            description: 'Check to add alternating shaded rows'
        }}
        contentDensityPreference={{
            label: 'Compact mode',
            description: 'Check to display table content in a denser, more compact mode'
        }}
    />
);
