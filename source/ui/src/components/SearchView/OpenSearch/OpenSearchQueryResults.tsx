// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from 'react';
import { SpaceBetween } from '@cloudscape-design/components';
import { Highlight } from 'react-highlighter-ts';
import OpenSearchResultTitle from './OpenSearchResultTitle';

export default function OpenSearchQueryResults({
    results,
    casesList,
    searchQuery,
    setSelectedCaseId,
    setSelectedDocumentId,
    setSelectedDocumentFileType
}: any) {
    const highlightRegex = useMemo(() => {
        if (searchQuery) {
            const words = searchQuery
                .split(/\W+/)
                .filter(Boolean)
                .map((x: any) => {
                    return `\\b${x}\\b`;
                });
            return new RegExp('(?:' + words.join('|') + ')', 'i');
        }
    }, [searchQuery]);

    const renderedResults = useMemo(
        () => (
            <SpaceBetween direction="vertical" size="l">
                {results.map((result: any) => {
                    const caseObject = casesList.find((obj: any) =>
                        obj.caseDocuments.some((doc: any) => doc.docId === result.document_id)
                    );
                    return (
                        <article key={setSelectedDocumentId} data-testid="open-search-result-title">
                            <OpenSearchResultTitle
                                result={result}
                                caseObject={caseObject}
                                setSelectedCaseId={setSelectedCaseId}
                                setSelectedDocumentId={setSelectedDocumentId}
                                setSelectedDocumentFileType={setSelectedDocumentFileType}
                            />
                            <p data-testid="open-search-highlighted-text">
                                <Highlight
                                    search={highlightRegex}
                                    placeholder={undefined}
                                    onPointerEnterCapture={undefined}
                                    onPointerLeaveCapture={undefined}
                                >
                                    {result.lines}
                                </Highlight>
                            </p>
                        </article>
                    );
                })}
            </SpaceBetween>
        ),
        [casesList, results, setSelectedCaseId, setSelectedDocumentFileType, setSelectedDocumentId, highlightRegex]
    );

    return <div>{renderedResults}</div>;
}
