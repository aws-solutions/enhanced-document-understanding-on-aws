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

import { useCallback } from 'react';

import { Button } from '@cloudscape-design/components';
import { useNavigate } from 'react-router-dom';

export default function OpenSearchResultTitle({
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
        docObject = caseObject.caseDocuments.find((doc: any) => doc.docId === result.document_id);
    }
    if (caseObject && docObject) {
        resultTitle = docObject.name;
    } else {
        resultTitle = result.document_name;
    }
    const handleDocumentClick = useCallback(() => {
        if (caseObject) {
            const docObject = caseObject.caseDocuments.find((doc: any) => doc.docId === result.document_id);
            const fileType = docObject.fileType;
            setSelectedDocumentId(result.document_id);
            setSelectedCaseId(caseObject.caseId);
            setSelectedDocumentFileType(fileType.replace('.', ''));
            window.sessionStorage.setItem('selectedDocumentName', docObject.name);
            window.sessionStorage.setItem('selectedCaseName', caseObject.name);
            window.sessionStorage.setItem('selectedDocumentId', result.document_id);
            window.sessionStorage.setItem('selectedCaseId', caseObject.caseId);
            window.sessionStorage.setItem('selectedDocumentFileType', fileType.replace('.', ''));
            navigate(`/${caseObject.caseId}/document/${result.document_id}`);
        }
    }, [
        caseObject,
        navigate,
        result.document_id,
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
