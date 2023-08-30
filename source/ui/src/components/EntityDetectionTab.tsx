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

import { Box, Container, StatusIndicatorProps } from '@cloudscape-design/components';
import { useCallback, useMemo } from 'react';
import { renderStatus } from '../utils/common-renderers';
import { BoundingBox } from '../utils/interfaces';

import { EntityTypes } from '../utils/constants';
import DocumentRenderer from './DocumentRenderer/DocumentRenderer';
import EntitiesList from './EntitiesList';
import { getEntitiesToProcess } from './entityUtils';

type EntityDetectionTabProps = {
    selectedDocumentFileType: string | null;
    selectedDocumentUrl: string | null;
    selected?: string;
    standardEntities: any;
    medicalEntities: any;
    piiEntities: any;
    documentPageCount: number;
    currentPageNumber: number;
    switchPage: Function;
    comprehendService: string;
    entityType: string;
    selectedDocumentId: string | null;
    selectedCaseId: string | null;
    selectedEntities: any;
    setSelectedEntities: Function;
    previewRedaction: string;
    setPreviewRedaction: Function;
    currentStatus: StatusIndicatorProps.Type | undefined;
    dataTestId?: string;
    retrieveSignedUrl: Function;
};

/**
 * EntityDetectionTab is used to render data for Generic, PII and Medical Comprehend inferences
 * @param props to be used to populate the tab
 * @returns
 */
export default function EntityDetectionTab(props: EntityDetectionTabProps) {
    let documentEntities = getEntitiesToProcess(props.entityType, props);

    const getFilteredArray = useCallback(
        (entityType: string) => {
            return props.selectedEntities[entityType].filter((item: string[]) => {
                if (item.length > 2 && item[2] !== props.currentPageNumber.toString()) {
                    return false;
                }

                if (
                    props.selectedEntities[entityType].some(
                        (otherItem: string[]) =>
                            otherItem.length < item.length &&
                            otherItem.slice(0, item.length - 1).every((val, index) => val === item[index])
                    )
                ) {
                    return false;
                }

                return true;
            });
        },
        [props.currentPageNumber, props.selectedEntities]
    );

    const getBoundingBoxesForEntityPage = useCallback((entities: any, entityPath: string[]) => {
        let boundingBoxes: BoundingBox[] = [];
        for (const pageInstance of entities[entityPath[0]][entityPath[1]][entityPath[2]]) {
            boundingBoxes = boundingBoxes.concat(pageInstance.BoundingBoxes);
        }
        return boundingBoxes;
    }, []);

    const getBoundingBoxesForEntityValue = useCallback(
        (entities: any, entityPath: string[]) => {
            let boundingBoxes: BoundingBox[] = [];
            if (props.currentPageNumber.toString() in entities[entityPath[0]][entityPath[1]]) {
                for (const pageInstance of entities[entityPath[0]][entityPath[1]][props.currentPageNumber.toString()]) {
                    boundingBoxes = boundingBoxes.concat(pageInstance.BoundingBoxes);
                }
            }
            return boundingBoxes;
        },
        [props.currentPageNumber]
    );

    const getBoundingBoxesForEntityType = useCallback(
        (entities: any, entityPath: string[]) => {
            let boundingBoxes: BoundingBox[] = [];
            for (const entity of Object.keys(entities[entityPath[0]])) {
                if (props.currentPageNumber.toString() in entities[entityPath[0]][entity]) {
                    for (const pageInstance of entities[entityPath[0]][entity][props.currentPageNumber.toString()]) {
                        boundingBoxes = boundingBoxes.concat(pageInstance.BoundingBoxes);
                    }
                }
            }
            return boundingBoxes;
        },
        [props.currentPageNumber]
    );

    const pageEntities = useMemo(() => {
        let boundingBoxes: BoundingBox[] = [];
        for (const entityType of Object.values(EntityTypes)) {
            if (props.selectedEntities[entityType] && props.selectedEntities[entityType].length > 0) {
                const entities = getEntitiesToProcess(entityType, props);
                const filteredArray = getFilteredArray(entityType);
                for (const entityPath of filteredArray) {
                    switch (entityPath.length) {
                        case 3:
                            boundingBoxes = boundingBoxes.concat(getBoundingBoxesForEntityPage(entities, entityPath));
                            break;
                        case 2:
                            boundingBoxes = boundingBoxes.concat(getBoundingBoxesForEntityValue(entities, entityPath));
                            break;
                        case 1:
                        default:
                            boundingBoxes = boundingBoxes.concat(getBoundingBoxesForEntityType(entities, entityPath));
                            break;
                    }
                }
            }
        }

        return boundingBoxes;
    }, [
        getBoundingBoxesForEntityPage,
        getBoundingBoxesForEntityType,
        getBoundingBoxesForEntityValue,
        getFilteredArray,
        props.medicalEntities,
        props.piiEntities,
        props.selectedEntities,
        props.standardEntities
    ]);

    const status = renderStatus(
        props.currentStatus,
        true,
        false,
        `An error occurred loading the document preview.`,
        ''
    );
    return (
        <div style={{ display: 'flex', height: '100%' }} data-testid={props.dataTestId}>
            <div style={{ width: '50%', float: 'left', paddingRight: '0.5%', paddingLeft: '1%' }}>
                <Container data-testid="document-rendering-container">
                    {status}
                    <DocumentRenderer
                        selectedDocumentFileType={props.selectedDocumentFileType}
                        selectedDocumentUrl={props.selectedDocumentUrl}
                        currentPageNumber={props.currentPageNumber}
                        switchPage={props.switchPage}
                        marks={pageEntities}
                        previewRedaction={props.previewRedaction}
                        retrieveSignedUrl={props.retrieveSignedUrl}
                    />
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
                        <Box data-testid="tab-box">
                            <EntitiesList
                                entities={documentEntities}
                                documentPageCount={props.documentPageCount}
                                currentPageNumber={props.currentPageNumber}
                                switchPage={props.switchPage}
                                comprehendService={props.comprehendService}
                                entityType={props.entityType}
                                standardEntities={props.standardEntities}
                                medicalEntities={props.medicalEntities}
                                piiEntities={props.piiEntities}
                                selectedEntities={props.selectedEntities}
                                setSelectedEntities={props.setSelectedEntities}
                                selectedDocumentId={props.selectedDocumentId}
                                selectedCaseId={props.selectedCaseId}
                                previewRedaction={props.previewRedaction}
                                setPreviewRedaction={props.setPreviewRedaction}
                                currentStatus={props.currentStatus}
                            />
                        </Box>
                    </div>
                </Container>
            </div>
        </div>
    );
}
