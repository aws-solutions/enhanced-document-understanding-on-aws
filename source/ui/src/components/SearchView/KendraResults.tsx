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

import KendraResultPage from './KendraResultPage';

import { SpaceBetween } from '@cloudscape-design/components';
import { MIN_SEARCH_QUERY_LENGTH } from '../../utils/constants';

type KendraResultsProps = {
    results: any[];
    searchQuery: string;
    casesList: any[];
    setSelectedCaseId: Function;
    setSelectedDocumentId: Function;
    setSelectedDocumentFileType: Function;
};

export default function KendraResults(props: KendraResultsProps) {
    const isQueryLongEnough = props.searchQuery && props.searchQuery.length >= MIN_SEARCH_QUERY_LENGTH;
    if (!props.searchQuery) return null;

    return (
        <div>
            <SpaceBetween direction="vertical" size="l">
                <header>
                    <h2>Amazon Kendra Results</h2>
                </header>

                <div>
                    {isQueryLongEnough && props.results.length > 0 && (
                        <KendraResultPage
                            results={props.results}
                            casesList={props.casesList}
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
