/**********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

import { Pagination } from '@cloudscape-design/components';
import { Fragment, ReactNode, forwardRef, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Cell, Marks, Row, TextractTable } from '../../utils/interfaces';
import './Pdf.css';

type PdfProps = {
    pdfUrl: string;
    currentPageNumber: number;
    switchPage: Function;
    marks?: Marks[];
    tables?: TextractTable[];
    previewRedaction?: string;
    retrieveSignedUrl: Function;
};

export default function PDF(props: PdfProps) {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    const [numPages, setNumPages] = useState(0);
    const [numRetries, setNumRetries] = useState(0);
    const [pdfErrorMessage, setPdfErrorMessage] = useState('Failed to load PDF file.');
    const containerRef = useRef(null);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumRetries(0);
        setNumPages(numPages);
    }

    function onDocumentLoadError() {
        if (numRetries === 0) {
            setPdfErrorMessage('PDF load failed. Retrying...');
            setNumRetries(1);
            props.retrieveSignedUrl();
        } else {
            setPdfErrorMessage('Failed to load PDF file.');
        }
    }

    const pager = (
        <div>
            <DocumentMarks
                marks={props.marks}
                tables={props.tables}
                ref={containerRef}
                previewRedaction={props.previewRedaction}
            >
                <Page pageNumber={props.currentPageNumber} renderAnnotationLayer={false} />
            </DocumentMarks>
        </div>
    );
    return (
        <div className="pdf-viewer" data-testid="pdf-box">
            {props.pdfUrl && (
                <Document
                    className="document"
                    file={props.pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    error={pdfErrorMessage}
                >
                    {pager}
                </Document>
            )}
            <Pagination
                ariaLabels={{
                    nextPageLabel: 'Next page',
                    previousPageLabel: 'Previous page',
                    pageLabel: (pageNumber: any) => `Page ${pageNumber} of all pages`
                }}
                currentPageIndex={props.currentPageNumber}
                onChange={({ detail }: any) => props.switchPage(detail.currentPageIndex)}
                pagesCount={numPages}
                data-testid="pdf-pagination"
            />
        </div>
    );
}

export type DocumentMarksProps = {
    children: ReactNode;
    marks?: Marks[];
    tables?: TextractTable[];
    previewRedaction?: string;
};

export const DocumentMarks = forwardRef(function DocumentMarks(
    { children, marks, tables, previewRedaction }: DocumentMarksProps,
    ref
) {
    let isPreviewEntityRedaction = previewRedaction === undefined ? '' : previewRedaction;
    return (
        <div className="canvas-wrapper" data-testid="canvas-wrapper">
            <div className="canvas" data-testid="canvas">
                {children}
                {marks &&
                    marks.map(({ Top, Left, Width, Height, type, id }, i) => (
                        <mark
                            key={`${id || ''}${type || ''}` || i}
                            className={type ? 'kv-' + type : 'box-highlight' + isPreviewEntityRedaction}
                            data-testid="document-marks"
                            style={{
                                top: `${Top * 100}%`,
                                left: `${Left * 100}%`,
                                width: `${Width * 100}%`,
                                height: `${Height * 100}%`
                            }}
                        />
                    ))}
                {tables &&
                    tables.map(({ table, rows }) => (
                        <TableHighlight key={JSON.stringify(table) + JSON.stringify(rows)} table={table} rows={rows} />
                    ))}
            </div>
        </div>
    );
});

DocumentMarks.displayName = 'DocumentMarks';

type TableHighlightProps = {
    rows: Row[];
    table: TextractTable['table'];
};

function TableHighlight({ table, rows }: TableHighlightProps) {
    const { Top, Left, Width, Height } = table.Geometry.BoundingBox;
    return (
        <>
            <mark
                className="box-highlight"
                data-testid="table"
                style={{
                    top: `${Top * 100}%`,
                    left: `${Left * 100}%`,
                    width: `${Width * 100}%`,
                    height: `${Height * 100}%`
                }}
            />
            {rows.map((row) => (
                <Fragment key={JSON.stringify(row)}>
                    {row.map((cell: Cell) => {
                        const { Top, Left, Width, Height } = cell.Geometry.BoundingBox;
                        return (
                            <mark
                                key={JSON.stringify(cell)}
                                className="cellHighlight"
                                style={{
                                    top: `${Top * 100}%`,
                                    left: `${Left * 100}%`,
                                    width: `${Width * 100}%`,
                                    height: `${Height * 100}%`
                                }}
                            />
                        );
                    })}
                </Fragment>
            ))}
        </>
    );
}
