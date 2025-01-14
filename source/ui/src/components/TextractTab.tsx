// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Box, Container, StatusIndicatorProps } from '@cloudscape-design/components';
import { useMemo } from 'react';
import { renderStatus } from '../utils/common-renderers';
import { TEXTRACT_KEY_VALUE_PAIRS, TEXTRACT_RAW_TEXT, TEXTRACT_TABLES } from '../utils/constants';
import { TextractKV, TextractLine, TextractTable } from '../utils/interfaces';
import DocumentRenderer from './DocumentRenderer/DocumentRenderer';
import KeyValueList from './KeyValueList';
import RawTextLines from './RawTextLines/RawTextLines';
import TableResults from './TableResults/TableResults';

type TextractTabProps = {
    selectedDocumentFileType: string | null;
    selectedDocumentUrl: string | null;
    documentLines: TextractLine[];
    kvPairs: TextractKV[];
    tables: TextractTable[];
    documentPageCount: number;
    currentPageNumber: number;
    switchPage: Function;
    textractOutputType: string;
    currentStatus: StatusIndicatorProps.Type | undefined;
    dataTestId?: string;
    retrieveSignedUrl: Function;
};

export default function TextractTab(props: TextractTabProps) {
    const pageLinesAsMarks = useMemo(() => {
        let filteredLines = props.documentLines;
        if (props.selectedDocumentFileType === 'pdf') {
            filteredLines = filteredLines.filter((line) => line.pageNumber === props.currentPageNumber);
        }
        return filteredLines.map(({ id, boundingBox }) => ({
            id,
            ...boundingBox
        }));
    }, [props.documentLines, props.currentPageNumber, props.selectedDocumentFileType]);

    const pagePairsAsMarks = useMemo(() => {
        let filteredPairs = props.kvPairs;
        if (props.selectedDocumentFileType === 'pdf') {
            filteredPairs = filteredPairs.filter((pair) => pair.pageNumber === props.currentPageNumber);
        }
        return filteredPairs.reduce((acc, { id, keyBoundingBox, valueBoundingBox }) => {
            return [...acc, { ...keyBoundingBox, id, type: 'key' }, { ...valueBoundingBox, id, type: 'value' }];
        }, [] as { id: string; type: string; Width: number; Height: number; Left: number; Top: number }[]);
    }, [props.kvPairs, props.currentPageNumber, props.selectedDocumentFileType]);

    const pageTables = useMemo(() => {
        return props.selectedDocumentFileType === 'pdf'
            ? props.tables.filter((d) => d.pageNumber === props.currentPageNumber)
            : props.tables;
    }, [props.tables, props.currentPageNumber, props.selectedDocumentFileType]);

    return (
        <div style={{ display: 'flex', height: '100%' }} data-testid={props.dataTestId}>
            <div style={{ width: '50%', float: 'left', paddingRight: '0.5%', paddingLeft: '1%' }}>
                <Container data-testid="textract-raw-text">
                    {props.textractOutputType === TEXTRACT_RAW_TEXT && (
                        <DocumentRenderer
                            selectedDocumentFileType={props.selectedDocumentFileType}
                            selectedDocumentUrl={props.selectedDocumentUrl}
                            currentPageNumber={props.currentPageNumber}
                            switchPage={props.switchPage}
                            marks={pageLinesAsMarks}
                            retrieveSignedUrl={props.retrieveSignedUrl}
                        />
                    )}
                    {props.textractOutputType === TEXTRACT_KEY_VALUE_PAIRS && (
                        <DocumentRenderer
                            selectedDocumentFileType={props.selectedDocumentFileType}
                            selectedDocumentUrl={props.selectedDocumentUrl}
                            currentPageNumber={props.currentPageNumber}
                            switchPage={props.switchPage}
                            marks={pagePairsAsMarks}
                            retrieveSignedUrl={props.retrieveSignedUrl}
                        />
                    )}
                    {props.textractOutputType === TEXTRACT_TABLES && (
                        <DocumentRenderer
                            selectedDocumentFileType={props.selectedDocumentFileType}
                            selectedDocumentUrl={props.selectedDocumentUrl}
                            currentPageNumber={props.currentPageNumber}
                            switchPage={props.switchPage}
                            tables={pageTables}
                            retrieveSignedUrl={props.retrieveSignedUrl}
                        />
                    )}
                    {renderStatus(
                        props.currentStatus,
                        true,
                        false,
                        'An error occurred loading the Textract output.',
                        ''
                    )}
                </Container>
            </div>
            <div
                style={{
                    width: '50%',
                    float: 'left',
                    paddingLeft: '0.5%',
                    paddingRight: '1%',
                    height: '100%'
                }}
            >
                <Container fitHeight={true}>
                    <div>
                        <Box>
                            {props.textractOutputType === TEXTRACT_RAW_TEXT && (
                                <RawTextLines
                                    documentLines={props.documentLines}
                                    documentPageCount={props.documentPageCount}
                                    currentPageNumber={props.currentPageNumber}
                                    switchPage={props.switchPage}
                                    currentStatus={props.currentStatus}
                                />
                            )}
                            {props.textractOutputType === TEXTRACT_KEY_VALUE_PAIRS && (
                                <KeyValueList
                                    kvPairs={props.kvPairs}
                                    documentPageCount={props.documentPageCount}
                                    currentPageNumber={props.currentPageNumber}
                                    switchPage={props.switchPage}
                                    currentStatus={props.currentStatus}
                                />
                            )}
                            {props.textractOutputType === TEXTRACT_TABLES && (
                                <TableResults
                                    tables={props.tables}
                                    documentPageCount={props.documentPageCount}
                                    currentPageNumber={props.currentPageNumber}
                                    switchPage={props.switchPage}
                                    currentStatus={props.currentStatus}
                                />
                            )}
                        </Box>
                    </div>
                </Container>
            </div>
        </div>
    );
}
