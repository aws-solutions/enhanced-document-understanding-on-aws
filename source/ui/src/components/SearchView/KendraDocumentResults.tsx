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
                        <article key={result.Id} data-testid="kendra-result-title">
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
