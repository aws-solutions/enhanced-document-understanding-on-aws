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
import { Box, ExpandableSection, StatusIndicatorProps } from '@cloudscape-design/components';
import { Fragment, useEffect, useRef } from 'react';
import { isStatusSuccess, renderStatus } from '../../utils/common-renderers';
import { TextractTable } from '../../utils/interfaces';
import './TableResults.css';

type TableResultsProps = {
    tables: TextractTable[];
    documentPageCount: number;
    currentPageNumber: number;
    switchPage: Function;
    currentStatus: StatusIndicatorProps.Type | undefined;
};

export default function TableResults(props: TableResultsProps) {
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (container.current) {
            const firstOnThisPage = container.current.querySelector('raw_text_lines_' + props.currentPageNumber);
            if (firstOnThisPage) firstOnThisPage.scrollIntoView();
        }
    }, [props.currentPageNumber]);

    const status = renderStatus(props.currentStatus, true, false, 'An error occurred loading table results.', '');

    // If successful request, but no inferences received.
    if (isStatusSuccess(props.currentStatus) && !props.tables.length) {
        return <p data-testid="tables-nodata">No Tables detected</p>;
    } else {
        // successful and data exists / loading the results still / there is an error
        if (props.tables.length > 0) {
            const groupedTables = groupPagesByPage(props.tables);
            return (
                <div ref={container}>
                    {status}
                    <Box variant="h3" display="inline">
                        Tables: {props.tables.length || 0} Found
                    </Box>
                    <ul data-testid="tables-with-data">
                        {groupedTables.map((tables: TextractTable[], i: number) => (
                            <Fragment key={tables[0].pageNumber}>
                                <ExpandableSection headerText={'Page ' + tables[0].pageNumber}>
                                    {tables.map(({ table, pageNumber, rows }, i) => (
                                        <div
                                            key={tables[0].pageNumber + JSON.stringify(rows)}
                                            onClick={() => {
                                                props.switchPage(pageNumber);
                                            }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <h5>
                                                Table {i + 1} : {rows.length || 0} rows
                                            </h5>
                                        </div>
                                    ))}
                                </ExpandableSection>
                            </Fragment>
                        ))}
                    </ul>
                    <footer />
                </div>
            );
        }
        return <p data-testid="tables-status-only"> {status} </p>; // data still loading / error occurred
    }
}

const groupPagesByPage = (tables: TextractTable[]) => {
    const groupedTables: TextractTable[][] = [];
    let currentPage: number | null = null;
    let currentGroup: TextractTable[] = [];
    for (const table of tables) {
        if (currentPage !== table.pageNumber) {
            if (currentPage !== null) {
                groupedTables.push(currentGroup);
            }
            currentPage = table.pageNumber;
            currentGroup = [table];
        } else {
            currentGroup.push(table);
        }
    }
    groupedTables.push(currentGroup);
    return groupedTables;
};
