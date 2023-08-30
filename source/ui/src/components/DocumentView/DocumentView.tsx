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

import './DocumentView.css';

import { AppLayout, ContentLayout, StatusIndicatorProps, Tabs } from '@cloudscape-design/components';
import React, { useEffect } from 'react';
import {
    API_NAME,
    COMPREHEND_MEDICAL_SERVICE,
    COMPREHEND_SERVICE,
    EntityTypes,
    InferenceName,
    TEXTRACT_KEY_VALUE_PAIRS,
    TEXTRACT_RAW_TEXT,
    TEXTRACT_TABLES
} from '../../utils/constants';
import {
    getDocumentKeyValuePairs,
    getDocumentLines,
    getDocumentPageCount,
    getDocumentTables
} from '../../utils/document';
import { DocumentProcessingResponse } from '../../utils/interfaces';

import { API } from 'aws-amplify';
import { generateToken } from '../DocumentTable/DocumentTable';
import EntityDetectionTab from '../EntityDetectionTab';
import TextractTab from '../TextractTab';
import { DocumentResultsInfoPanelContent } from '../../utils/info-panel-contents';
import { DocResultsPageHeader } from '../DocumentTable/full-page-header';

type DocumentViewProps = {
    selectedDocumentId: string;
    selectedCaseId: string;
    selectedDocumentFileType: string;
    selectedCaseName: string;
    selectedDocumentName: string;
    setSelectedCaseId: React.Dispatch<React.SetStateAction<string>>;
    setSelectedDocumentId: React.Dispatch<React.SetStateAction<string>>;
    setSelectedDocumentFileType: React.Dispatch<React.SetStateAction<string>>;
    setSelectedCaseName: React.Dispatch<React.SetStateAction<string>>;
    setSelectedDocumentName: React.Dispatch<React.SetStateAction<string>>;
};

let token: string;

export default function DocumentView(props: DocumentViewProps) {
    const [documentUrl, setDocumentUrl] = React.useState<string>('');
    const [currentStatus, setCurrentStatus] = React.useState<StatusIndicatorProps.Type | undefined>();
    const [documentPageCount, setDocumentPageCount] = React.useState<number>(0);
    const [currentPageNumber, setCurrentPageNumber] = React.useState(1);
    const [documentProcessingResults, setDocumentProcessingResults] = React.useState<DocumentProcessingResponse>({
        textractDetectResponse: {
            Bucket: '',
            UploadedFileName: '',
            DocumentMetadata: { Pages: 0 },
            JobStatus: '',
            AnalyzeDocumentModelVersion: ''
        },
        comprehendGenericResponse: {
            results: []
        },
        comprehendMedicalResponse: {
            results: []
        },
        comprehendPiiResponse: {
            results: []
        }
    });
    const [selectedEntities, setSelectedEntities] = React.useState<any>({
        [EntityTypes.ENTITY_STANDARD]: [],
        [EntityTypes.PII]: [],
        [EntityTypes.MEDICAL_ENTITY]: []
    });
    const [previewRedaction, setPreviewRedaction] = React.useState('');
    const [toolsOpen, setToolsOpen] = React.useState(false);

    const switchPage = (newPageNumber: number) => {
        setCurrentPageNumber(newPageNumber);
    };

    const docData = React.useMemo(() => {
        const pairs = getDocumentKeyValuePairs(documentProcessingResults, 'KEY_VALUE_SET');
        const tables = getDocumentTables(documentProcessingResults, 'TABLE');
        const lines = getDocumentLines(documentProcessingResults, 'LINE');
        const standardEntities = documentProcessingResults.comprehendGenericResponse;
        const medicalEntities = documentProcessingResults.comprehendMedicalResponse;
        const piiEntities = documentProcessingResults.comprehendPiiResponse;
        return { pairs, lines, tables, standardEntities, medicalEntities, piiEntities };
    }, [documentProcessingResults]);

    useEffect(() => {
        props.setSelectedDocumentId(window.sessionStorage.getItem('selectedDocumentId') || '');
        props.setSelectedCaseId(window.sessionStorage.getItem('selectedCaseId') || '');
        props.setSelectedDocumentFileType(window.sessionStorage.getItem('selectedDocumentFileType') || '');
        props.setSelectedCaseName(window.sessionStorage.getItem('selectedCaseName') || '');
        props.setSelectedDocumentName(window.sessionStorage.getItem('selectedDocumentName') || '');
    }, [props]);

    const getResource = async (endpoint: string, queryStringParameters = {}) => {
        try {
            token = await generateToken();
            const response = await API.get(API_NAME, endpoint, {
                headers: {
                    Authorization: token
                },
                queryStringParameters: queryStringParameters
            });
            return response;
        } catch (err) {
            console.error(err);
        }
    };

    const formatTextract = (response: any) => {
        if (response) {
            for (let pageNumber = 0; pageNumber < response.length; pageNumber++) {
                response[pageNumber].DocumentMetadata.Pages = response.length;
                for (const block of response[pageNumber].Blocks) {
                    block.Page = pageNumber + 1;
                }
            }
        }
        return response;
    };

    const retrieveSignedUrl = async () => {
        const documentResponse = await getResource(`document/${props.selectedCaseId}/${props.selectedDocumentId}`, {
            redacted: false
        });

        const signedUrlObject = await getResource(`document/download`, { key: documentResponse.key });
        setDocumentUrl(signedUrlObject.downloadUrl);
    };

    useEffect(() => {
        const getDocumentData = async () => {
            setCurrentStatus('loading');
            let documentResponse,
                textractDetectResponse,
                textractAnalyzeResponse,
                entityGenericResponse,
                entityMedicalResponse,
                entityPiiResponse;
            let validInferences = [];
            textractDetectResponse =
                textractAnalyzeResponse =
                entityGenericResponse =
                entityMedicalResponse =
                entityPiiResponse =
                    undefined;

            try {
                if (props.selectedCaseId === '' || props.selectedDocumentId === '') {
                    setCurrentStatus('error');
                    return;
                }

                validInferences = await getResource(`inferences/${props.selectedCaseId}/${props.selectedDocumentId}`);

                documentResponse = await getResource(`document/${props.selectedCaseId}/${props.selectedDocumentId}`, {
                    redacted: false
                });

                const signedUrlObject = await getResource(`document/download`, { key: documentResponse.key });
                setDocumentUrl(signedUrlObject.downloadUrl);

                if (validInferences.includes(InferenceName.TEXTRACT_DETECT_TEXT)) {
                    textractDetectResponse = await getResource(
                        `inferences/${props.selectedCaseId}/${props.selectedDocumentId}/${InferenceName.TEXTRACT_DETECT_TEXT}`
                    );
                }

                if (validInferences.includes(InferenceName.TEXTRACT_ANALYZE_TEXT)) {
                    textractAnalyzeResponse = await getResource(
                        `inferences/${props.selectedCaseId}/${props.selectedDocumentId}/${InferenceName.TEXTRACT_ANALYZE_TEXT}`
                    );
                }

                if (validInferences.includes(InferenceName.COMPREHEND_GENERIC)) {
                    entityGenericResponse = await getResource(
                        `inferences/${props.selectedCaseId}/${props.selectedDocumentId}/${InferenceName.COMPREHEND_GENERIC}`
                    );
                }

                if (validInferences.includes(InferenceName.COMPREHEND_PII)) {
                    entityPiiResponse = await getResource(
                        `inferences/${props.selectedCaseId}/${props.selectedDocumentId}/${InferenceName.COMPREHEND_PII}`
                    );
                }

                if (validInferences.includes(InferenceName.COMPREHEND_MEDICAL)) {
                    entityMedicalResponse = await getResource(
                        `inferences/${props.selectedCaseId}/${props.selectedDocumentId}/${InferenceName.COMPREHEND_MEDICAL}`
                    );
                }

                setDocumentProcessingResults({
                    textractDetectResponse: formatTextract(textractDetectResponse),
                    textractAnalyzeResponse: formatTextract(textractAnalyzeResponse),
                    comprehendGenericResponse: entityGenericResponse,
                    comprehendMedicalResponse: entityMedicalResponse,
                    comprehendPiiResponse: entityPiiResponse
                });
                setCurrentStatus('success');
            } catch (error) {
                console.error(
                    `Error in retrieving document and inferences with ${[
                        props.selectedCaseId,
                        props.selectedDocumentId
                    ]}: ${error}`
                );
                setCurrentStatus('error');
            }
        };

        getDocumentData();
    }, [props.selectedCaseId, props.selectedDocumentId]);

    useEffect(() => {
        setDocumentPageCount(getDocumentPageCount(documentProcessingResults, 'LINE'));
    }, [documentProcessingResults]);

    const mainTabs = [
        {
            label: 'Entity Detection',
            id: 'entityDetection',
            content: (
                <EntityDetectionTab
                    selectedDocumentFileType={props.selectedDocumentFileType}
                    selectedDocumentUrl={documentUrl}
                    standardEntities={docData.standardEntities}
                    medicalEntities={docData.medicalEntities}
                    piiEntities={docData.piiEntities}
                    documentPageCount={documentPageCount}
                    currentPageNumber={currentPageNumber}
                    switchPage={switchPage}
                    comprehendService={COMPREHEND_SERVICE}
                    entityType={EntityTypes.ENTITY_STANDARD}
                    selectedDocumentId={props.selectedDocumentId}
                    selectedCaseId={props.selectedCaseId}
                    currentStatus={currentStatus}
                    selectedEntities={selectedEntities}
                    setSelectedEntities={setSelectedEntities}
                    previewRedaction={previewRedaction}
                    setPreviewRedaction={setPreviewRedaction}
                    retrieveSignedUrl={retrieveSignedUrl}
                    dataTestId="entity-detection-tab"
                />
            )
        },
        {
            label: 'Medical Entity Detection',
            id: 'medicalEntityDetection',
            content: (
                <EntityDetectionTab
                    selectedDocumentFileType={props.selectedDocumentFileType}
                    selectedDocumentUrl={documentUrl}
                    standardEntities={docData.standardEntities}
                    medicalEntities={docData.medicalEntities}
                    piiEntities={docData.piiEntities}
                    documentPageCount={documentPageCount}
                    currentPageNumber={currentPageNumber}
                    switchPage={switchPage}
                    comprehendService={COMPREHEND_MEDICAL_SERVICE}
                    entityType={EntityTypes.MEDICAL_ENTITY}
                    selectedDocumentId={props.selectedDocumentId}
                    selectedCaseId={props.selectedCaseId}
                    currentStatus={currentStatus}
                    selectedEntities={selectedEntities}
                    setSelectedEntities={setSelectedEntities}
                    previewRedaction={previewRedaction}
                    setPreviewRedaction={setPreviewRedaction}
                    retrieveSignedUrl={retrieveSignedUrl}
                    dataTestId="medical-entity-detection-tab"
                />
            )
        },
        {
            label: 'PII Detection',
            id: 'piiDetection',
            content: (
                <EntityDetectionTab
                    selectedDocumentFileType={props.selectedDocumentFileType}
                    selectedDocumentUrl={documentUrl}
                    standardEntities={docData.standardEntities}
                    medicalEntities={docData.medicalEntities}
                    piiEntities={docData.piiEntities}
                    documentPageCount={documentPageCount}
                    currentPageNumber={currentPageNumber}
                    switchPage={switchPage}
                    comprehendService={COMPREHEND_SERVICE}
                    entityType={EntityTypes.PII}
                    selectedDocumentId={props.selectedDocumentId}
                    selectedCaseId={props.selectedCaseId}
                    currentStatus={currentStatus}
                    selectedEntities={selectedEntities}
                    setSelectedEntities={setSelectedEntities}
                    previewRedaction={previewRedaction}
                    setPreviewRedaction={setPreviewRedaction}
                    retrieveSignedUrl={retrieveSignedUrl}
                    dataTestId="pii-detection-tab"
                />
            )
        },
        {
            label: 'Raw Text',
            id: 'textractRawText',
            content: (
                <TextractTab
                    selectedDocumentFileType={props.selectedDocumentFileType}
                    selectedDocumentUrl={documentUrl}
                    documentLines={docData.lines}
                    kvPairs={docData.pairs}
                    tables={docData.tables}
                    documentPageCount={documentPageCount}
                    currentPageNumber={currentPageNumber}
                    switchPage={switchPage}
                    textractOutputType={TEXTRACT_RAW_TEXT}
                    currentStatus={currentStatus}
                    retrieveSignedUrl={retrieveSignedUrl}
                    dataTestId="textract-raw-text-tab"
                />
            )
        },
        {
            label: 'Key-Value Pairs',
            id: 'textractKeyValuePairs',
            content: (
                <TextractTab
                    selectedDocumentFileType={props.selectedDocumentFileType}
                    selectedDocumentUrl={documentUrl}
                    documentLines={docData.lines}
                    kvPairs={docData.pairs}
                    tables={docData.tables}
                    documentPageCount={documentPageCount}
                    currentPageNumber={currentPageNumber}
                    switchPage={switchPage}
                    textractOutputType={TEXTRACT_KEY_VALUE_PAIRS}
                    currentStatus={currentStatus}
                    retrieveSignedUrl={retrieveSignedUrl}
                    dataTestId="textract-key-value-pairs-tab"
                />
            )
        },
        {
            label: 'Tables',
            id: 'textractTables',
            content: (
                <TextractTab
                    selectedDocumentFileType={props.selectedDocumentFileType}
                    selectedDocumentUrl={documentUrl}
                    documentLines={docData.lines}
                    kvPairs={docData.pairs}
                    tables={docData.tables}
                    documentPageCount={documentPageCount}
                    currentPageNumber={currentPageNumber}
                    switchPage={switchPage}
                    textractOutputType={TEXTRACT_TABLES}
                    currentStatus={currentStatus}
                    retrieveSignedUrl={retrieveSignedUrl}
                    dataTestId="textract-tables-tab"
                />
            )
        }
    ];

    return (
        <AppLayout
            contentType="dashboard"
            navigationHide
            onToolsChange={({ detail }) => {
                setToolsOpen(detail.open);
            }}
            toolsOpen={toolsOpen}
            tools={<DocumentResultsInfoPanelContent />}
            content={
                <ContentLayout
                    header={
                        <div className="document-view-header">
                            <DocResultsPageHeader
                                onInfoLinkClick={() => {
                                    setToolsOpen(true);
                                }}
                                breadCrumbItems={{
                                    selectedCaseName: props.selectedCaseName,
                                    selectedDocumentName: props.selectedDocumentName
                                }}
                            />
                        </div>
                    }
                >
                    <div data-testid="document-view-box" className="document-view-box">
                        <Tabs tabs={mainTabs} data-testid="document-view-tabs" />
                    </div>
                </ContentLayout>
            }
            data-testid="document-view-app-layout"
        />
    );
}
