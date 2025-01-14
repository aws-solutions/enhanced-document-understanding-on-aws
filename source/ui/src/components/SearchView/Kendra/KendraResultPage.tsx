// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from 'react';

import KendraDocumentResults from './KendraDocumentResults';
import KendraTopResults from './KendraTopResults';

type KendraResultPageProps = {
    title?: string | null;
    results: any[];
    casesList: any[];
    setSelectedCaseId: Function;
    setSelectedDocumentId: Function;
    setSelectedDocumentFileType: Function;
};

export default function KendraResultPage(props: KendraResultPageProps) {
    const topResults = useMemo(() => props.results.filter((res: any) => res.Type === 'ANSWER'), [props.results]);
    const docResults = useMemo(() => props.results.filter((res: any) => res.Type === 'DOCUMENT'), [props.results]);

    return (
        <div>
            {props.title && <h3>{props.title}</h3>}
            <KendraTopResults
                results={topResults}
                setSelectedCaseId={props.setSelectedCaseId}
                setSelectedDocumentId={props.setSelectedDocumentId}
                setSelectedDocumentFileType={props.setSelectedDocumentFileType}
            />
            <KendraDocumentResults
                results={docResults}
                casesList={props.casesList}
                setSelectedCaseId={props.setSelectedCaseId}
                setSelectedDocumentId={props.setSelectedDocumentId}
                setSelectedDocumentFileType={props.setSelectedDocumentFileType}
            />
        </div>
    );
}
