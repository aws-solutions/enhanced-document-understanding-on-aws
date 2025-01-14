// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useCallback } from 'react';

import { Button } from '@cloudscape-design/components';
import { useNavigate } from 'react-router-dom';
import KendraHighlightedText from './KendraHighlightedText';

export default function KendraResultTitle({
    result,
    caseObject,
    setSelectedCaseId,
    setSelectedDocumentId,
    setSelectedDocumentFileType
}: any) {
    let resultTitle;
    const navigate = useNavigate();
    let docObject;
    if (caseObject && caseObject.caseDocuments) {
        docObject = caseObject.caseDocuments.find((doc: any) => doc.docId === result.DocumentId);
    }
    if (caseObject && docObject) {
        resultTitle = docObject.name;
    } else if (result.DocumentTitle && result.DocumentTitle.Text) {
        const truncatedTitle = {
            ...result.DocumentTitle,
            Text: result.DocumentTitle.Text.replace(/-searchable$/, '')
        };
        resultTitle = <KendraHighlightedText textWithHighlights={truncatedTitle} />;
    } else if (result.DocumentURI) {
        resultTitle = result.DocumentURI;
    }

    const handleDocumentClick = useCallback(() => {
        if (caseObject) {
            const docObject = caseObject.caseDocuments.find((doc: any) => doc.docId === result.DocumentId);
            const fileType = docObject.fileType;
            setSelectedDocumentId(result.DocumentId);
            setSelectedCaseId(caseObject.caseId);
            setSelectedDocumentFileType(fileType.replace('.', ''));
            window.sessionStorage.setItem('selectedDocumentName', docObject.name);
            window.sessionStorage.setItem('selectedCaseName', caseObject.name);
            window.sessionStorage.setItem('selectedDocumentId', result.DocumentId);
            window.sessionStorage.setItem('selectedCaseId', caseObject.caseId);
            window.sessionStorage.setItem('selectedDocumentFileType', fileType.replace('.', ''));
            navigate(`/${caseObject.caseId}/document/${result.DocumentId}`);
        }
    }, [
        caseObject,
        navigate,
        result.DocumentId,
        setSelectedCaseId,
        setSelectedDocumentFileType,
        setSelectedDocumentId
    ]);

    if (!resultTitle) return null;

    return (
        <header>
            <Button variant="link" onClick={() => handleDocumentClick()}>
                <h5>{resultTitle}</h5>
                {caseObject && <p>{caseObject.name}</p>}
            </Button>
        </header>
    );
}
