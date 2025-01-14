// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Box, ExpandableSection, StatusIndicatorProps } from '@cloudscape-design/components';
import { Fragment, useEffect, useRef } from 'react';
import { isStatusSuccess, renderStatus } from '../../utils/common-renderers';
import { TextractLine } from '../../utils/interfaces';
import './RawTextLines.css';

type RawTextLinesProps = {
    documentLines: TextractLine[];
    documentPageCount: number;
    currentPageNumber: number;
    switchPage: Function;
    currentStatus: StatusIndicatorProps.Type | undefined;
};

export default function RawTextLines(props: RawTextLinesProps) {
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (container.current) {
            const firstOnThisPage = container.current.querySelector('raw_text_lines_' + props.currentPageNumber);
            if (firstOnThisPage) firstOnThisPage.scrollIntoView();
        }
    }, [props.currentPageNumber]);

    const status = renderStatus(props.currentStatus, true, false, 'An error occurred loading raw text.', '');

    // If successful request, but no inferences received.
    if (isStatusSuccess(props.currentStatus) && !props.documentLines.length) {
        return <p data-testid="raw-text-nodata">No Raw Text detected</p>;
    } else {
        // successful and data exists / loading the results still / there is an error
        if (props.documentLines.length > 0) {
            const groupedLines = groupLinesByPage(props.documentLines);
            return (
                <div ref={container}>
                    {status}
                    <Box variant="h3" display="inline">
                        {' '}
                        Detected Raw Text:{' '}
                    </Box>
                    <ul data-testid="raw-text-data">
                        {groupedLines.map((pageLines: TextractLine[], i: number) => (
                            <Fragment key={pageLines[0].pageNumber}>
                                <ExpandableSection headerText={'Page ' + pageLines[0].pageNumber}>
                                    <ol>
                                        {pageLines.map(({ text, pageNumber, boundingBox }, i) => (
                                            <li
                                                key={text + pageNumber + JSON.stringify(boundingBox)}
                                                onClick={() => {
                                                    props.switchPage(pageNumber);
                                                }}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {text}
                                            </li>
                                        ))}
                                    </ol>
                                </ExpandableSection>
                            </Fragment>
                        ))}
                    </ul>
                    <footer />
                </div>
            );
        }
        return <p data-testid="raw-text-status-only"> {status} </p>; // data still loading / error occurred
    }
}

const groupLinesByPage = (lines: TextractLine[]) => {
    const groupedLines: TextractLine[][] = [];
    let currentPage: number | null = null;
    let currentGroup: TextractLine[] = [];
    for (const line of lines) {
        if (currentPage !== line.pageNumber) {
            if (currentPage !== null) {
                groupedLines.push(currentGroup);
            }
            currentPage = line.pageNumber;
            currentGroup = [line];
        } else {
            currentGroup.push(line);
        }
    }
    groupedLines.push(currentGroup);
    return groupedLines;
};
