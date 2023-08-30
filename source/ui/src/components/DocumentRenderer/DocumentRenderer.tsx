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
