// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Box, ExpandableSection, StatusIndicatorProps } from '@cloudscape-design/components';
import { Fragment, useEffect, useRef } from 'react';
import { isStatusSuccess, renderStatus } from '../utils/common-renderers';
import { TextractKV } from '../utils/interfaces';

type KeyValueListProps = {
    kvPairs: TextractKV[];
    documentPageCount: number;
    currentPageNumber: number;
    switchPage: Function;
    currentStatus: StatusIndicatorProps.Type | undefined;
};

export default function KeyValueList(props: KeyValueListProps) {
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (container.current) {
            const firstOnThisPage = container.current.querySelector('kb_pairs_' + props.currentPageNumber);
            if (firstOnThisPage) firstOnThisPage.scrollIntoView();
        }
    }, [props.currentPageNumber]);

    const status = renderStatus(props.currentStatus, true, false, 'An error occurred loading key-value pairs.', '');

    // If successful request, but no inferences received.
    if (isStatusSuccess(props.currentStatus) && !props.kvPairs.length) {
        return <p data-testid="kv-pair-nodata">No Key-Value Pairs detected</p>;
    } else {
        // successful and data exists / loading the results still / there is an error
        if (props.kvPairs.length > 0) {
            const groupedKVPairs = groupKVPairsByPage(props.kvPairs);
            return (
                <div ref={container}>
                    {status}
                    <Box variant="h3" display="inline">
                        Key-Value Pairs: {props.kvPairs.length || 0} Found
                    </Box>
                    <ul data-testid="key-value-pairs-data">
                        {groupedKVPairs.map((pairs, i) => (
                            <Fragment
                                key={
                                    pairs[0].pageNumber +
                                    JSON.stringify(pairs[0].keyBoundingBox) +
                                    JSON.stringify(pairs[0].valueBoundingBox)
                                }
                            >
                                <ExpandableSection headerText={'Page ' + pairs[0].pageNumber}>
                                    {pairs.map(
                                        ({ id, key, value, pageNumber, keyBoundingBox, valueBoundingBox }, i) => (
                                            <div
                                                key={
                                                    key +
                                                    value +
                                                    pageNumber +
                                                    JSON.stringify(keyBoundingBox) +
                                                    JSON.stringify(valueBoundingBox)
                                                }
                                                onClick={() => {
                                                    props.switchPage(pageNumber);
                                                }}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <h5>{key}</h5>
                                                <p>{(value && String(value).trim()) || <em>no value</em>} </p>
                                            </div>
                                        )
                                    )}
                                </ExpandableSection>
                            </Fragment>
                        ))}
                    </ul>
                </div>
            );
        }
        return <p data-testid="kvpair-status-only"> {status} </p>; // data still loading / error occurred
    }
}

const groupKVPairsByPage = (kvpairs: TextractKV[]) => {
    const groupedKVPairs: TextractKV[][] = [];
    let currentPage: number | null = null;
    let currentGroup: TextractKV[] = [];
    for (const pair of kvpairs) {
        if (currentPage !== pair.pageNumber) {
            if (currentPage !== null) {
                groupedKVPairs.push(currentGroup);
            }
            currentPage = pair.pageNumber;
            currentGroup = [pair];
        } else {
            currentGroup.push(pair);
        }
    }
    groupedKVPairs.push(currentGroup);
    return groupedKVPairs;
};
