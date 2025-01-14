// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useMemo, useState } from 'react';

import KendraHighlightedText from './KendraHighlightedText';
import KendraResultTitle from './KendraResultTitle';

const MAX_TOP_ANSWER_LENGTH = 5; // temp

function getTopAnswer(text: any) {
    if (text && text.Highlights) {
        for (const highlight of text.Highlights) {
            const length = highlight.EndOffset - highlight.BeginOffset;
            if (highlight && highlight.TopAnswer && length < MAX_TOP_ANSWER_LENGTH) {
                return <h1>{text.Text.substring(highlight.BeginOffset, highlight.EndOffset)}</h1>;
            }
        }
    }

    return null;
}

export default function KendraTopResults({
    results,
    casesList,
    setSelectedCaseId,
    setSelectedDocumentId,
    setSelectedDocumentFileType
}: any) {
    const renderedResults = useMemo(
        () =>
            results?.map((result: any) => {
                const answer = result?.AdditionalAttributes?.find((attr: any) => attr.Key === 'AnswerText');

                const caseObject = casesList?.find((obj: any) =>
                    obj.caseDocuments.some((doc: any) => doc.name === result.DocumentId)
                );
                return (
                    <article key={result.id}>
                        <KendraResultTitle
                            result={result}
                            caseObject={caseObject}
                            setSelectedCaseId={setSelectedCaseId}
                            setSelectedDocumentId={setSelectedDocumentId}
                            setSelectedDocumentFileType={setSelectedDocumentFileType}
                        />
                        {getTopAnswer(answer?.TextWithHighlightsValue)}
                        <p>
                            <KendraHighlightedText textWithHighlights={answer.Value.TextWithHighlightsValue} />
                        </p>
                    </article>
                );
            }),
        [casesList, results, setSelectedCaseId, setSelectedDocumentFileType, setSelectedDocumentId]
    );

    const [expanded, setExpanded] = useState(false);

    const toggleExpanded = useCallback(() => {
        setExpanded((e) => !e);
    }, []);

    if (!results.length) return null;

    return (
        <div>
            <header>
                <h2>Amazon Kendra suggested answers</h2>
            </header>
            <div>
                {renderedResults[0]}

                {renderedResults.length > 1 ? (
                    <>
                        <div onClick={toggleExpanded}>More suggested answers ({renderedResults.length - 1})</div>
                        {expanded ? <div>{renderedResults.slice(1)}</div> : null}
                    </>
                ) : null}
            </div>
        </div>
    );
}
