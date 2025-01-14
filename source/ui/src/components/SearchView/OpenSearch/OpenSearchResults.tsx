// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import OpenSearchResultPage from './OpenSearchResultPage';

import { SpaceBetween } from '@cloudscape-design/components';
import { MIN_SEARCH_QUERY_LENGTH } from '../../../utils/constants';

type OpenSearchResultsProps = {
    results: any[];
    searchQuery: string;
    casesList: any[];
    setSelectedCaseId: Function;
    setSelectedDocumentId: Function;
    setSelectedDocumentFileType: Function;
};

export default function OpenSearchResults(props: OpenSearchResultsProps) {
    const isQueryLongEnough = props.searchQuery && props.searchQuery.length >= MIN_SEARCH_QUERY_LENGTH;
    if (!props.searchQuery) return null;

    return (
        <div>
            <SpaceBetween direction="vertical" size="l">
                <header>
                    <h2>Amazon OpenSearch Results</h2>
                </header>

                <div>
                    {isQueryLongEnough && props.results.length > 0 && (
                        <OpenSearchResultPage
                            results={props.results}
                            casesList={props.casesList}
                            searchQuery={props.searchQuery}
                            setSelectedCaseId={props.setSelectedCaseId}
                            setSelectedDocumentId={props.setSelectedDocumentId}
                            setSelectedDocumentFileType={props.setSelectedDocumentFileType}
                        />
                    )}
                    {props.results.length < 1 && <div>No results found</div>}
                </div>
            </SpaceBetween>
        </div>
    );
}
