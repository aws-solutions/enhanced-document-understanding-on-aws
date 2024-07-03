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
