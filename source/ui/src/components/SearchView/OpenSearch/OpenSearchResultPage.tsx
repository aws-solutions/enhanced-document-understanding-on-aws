// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from 'react';

import OpenSearchQueryResults from './OpenSearchQueryResults';

type OpenSearchResultPageProps = {
    title?: string | null;
    results: any[];
    casesList: any[];
    searchQuery: string;
    setSelectedCaseId: Function;
    setSelectedDocumentId: Function;
    setSelectedDocumentFileType: Function;
};

export default function OpenSearchResultPage(props: OpenSearchResultPageProps) {
    const queryResults = useMemo(() => props.results, [props.results]);

    return (
        <div>
            {props.title && <h3>{props.title}</h3>}
            <OpenSearchQueryResults
                results={queryResults}
                casesList={props.casesList}
                searchQuery={props.searchQuery}
                setSelectedCaseId={props.setSelectedCaseId}
                setSelectedDocumentId={props.setSelectedDocumentId}
                setSelectedDocumentFileType={props.setSelectedDocumentFileType}
            />
        </div>
    );
}
