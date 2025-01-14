// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'react-pdf/dist/esm/Page/TextLayer.css';
import './DocumentRenderer.css';

import { Marks, TextractTable } from '../../utils/interfaces';
import PDF, { DocumentMarks } from '../Pdf/Pdf';

type DocumentRendererProps = {
    selectedDocumentFileType: string | null;
    selectedDocumentUrl: string | null;
    currentPageNumber?: number;
    switchPage?: Function;
    marks?: Marks[];
    tables?: TextractTable[];
    previewRedaction?: string;
    retrieveSignedUrl: Function;
};

export default function DocumentRenderer(props: DocumentRendererProps) {
    return (
        <div>
            {props.selectedDocumentFileType === 'pdf' &&
                props.selectedDocumentUrl &&
                props.currentPageNumber &&
                props.switchPage && (
                    <PDF
                        pdfUrl={props.selectedDocumentUrl}
                        currentPageNumber={props.currentPageNumber}
                        switchPage={props.switchPage}
                        marks={props.marks}
                        tables={props.tables}
                        previewRedaction={props.previewRedaction}
                        retrieveSignedUrl={props.retrieveSignedUrl}
                    />
                )}
            {(props.selectedDocumentFileType === 'jpg' ||
                props.selectedDocumentFileType === 'png' ||
                props.selectedDocumentFileType === 'jpeg') &&
                props.selectedDocumentUrl && (
                    <div className="pdf-viewer">
                        <DocumentMarks
                            marks={props.marks}
                            tables={props.tables}
                            previewRedaction={props.previewRedaction}
                        >
                            <img src={props.selectedDocumentUrl} className="image" alt="file" data-testid="image" />
                        </DocumentMarks>
                    </div>
                )}
            {props.selectedDocumentFileType !== 'pdf' &&
                props.selectedDocumentFileType !== 'jpg' &&
                props.selectedDocumentFileType !== 'jpeg' &&
                props.selectedDocumentFileType !== 'png' && <div>Invalid file type</div>}
        </div>
    );
}
