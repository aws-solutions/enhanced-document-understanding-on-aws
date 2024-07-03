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
