/**********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the License). You may not use this file except in compliance      *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

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
