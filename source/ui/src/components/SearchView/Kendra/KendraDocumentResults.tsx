// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from 'react';

import { SpaceBetween } from '@cloudscape-design/components';
import KendraHighlightedText from './KendraHighlightedText';
import KendraResultTitle from './KendraResultTitle';

export default function KendraDocumentResults({
    results,
    casesList,
    setSelectedCaseId,
    setSelectedDocumentId,
    setSelectedDocumentFileType
}: any) {
    const renderedResults = useMemo(
        () => (
            <SpaceBetween direction="vertical" size="l">
                {results.map((result: any) => {
                    const caseObject = casesList.find((obj: any) =>
                        obj.caseDocuments.some((doc: any) => doc.docId === result.DocumentId)
                    );
                    return (
                        <article key={setSelectedDocumentId} data-testid="kendra-result-title">
                            <KendraResultTitle
                                result={result}
                                caseObject={caseObject}
                                setSelectedCaseId={setSelectedCaseId}
                                setSelectedDocumentId={setSelectedDocumentId}
                                setSelectedDocumentFileType={setSelectedDocumentFileType}
                            />
                            <p data-testid="kendra-highlighted-text">
                                <KendraHighlightedText textWithHighlights={result.DocumentExcerpt} />
                            </p>
                        </article>
                    );
                })}
            </SpaceBetween>
        ),
        [casesList, results, setSelectedCaseId, setSelectedDocumentFileType, setSelectedDocumentId]
    );

    return <div>{renderedResults}</div>;
}
