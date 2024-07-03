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

import {
    Badge,
    Box,
    Button,
    Checkbox,
    ExpandableSection,
    SpaceBetween,
    StatusIndicator,
    StatusIndicatorProps,
    Tabs,
    Toggle
} from '@cloudscape-design/components';
import React, { useCallback } from 'react';
import { isStatusSuccess, renderStatus } from '../utils/common-renderers';
import { COMPREHEND_MEDICAL_SERVICE, ENTITIES, EntityTypes, PREVIEW_REDACTION_ON } from '../utils/constants';
import './EntitiesList.css';
import { getEntitiesToProcess } from './entityUtils';
import { useRedactMutation } from '../store/reducers/redactApiSlice';
import {
    useLazyGetDocumentByCaseAndDocumentIdQuery,
    useLazyDocumentToDownloadQuery
} from '../store/reducers/documentApiSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks/hooks';
import { selectEntityStatus, setStatus } from '../store/reducers/entitySlice';

type EntitiesListProps = {
    entities: any;
    documentPageCount: number;
    currentPageNumber: number;
    switchPage: Function;
    comprehendService: string;
    entityType: string;
    standardEntities: any;
    medicalEntities: any;
    piiEntities: any;
    selectedEntities: any;
    setSelectedEntities: Function;
    selectedDocumentId: string | null;
    selectedCaseId: string | null;
    previewRedaction: string;
    setPreviewRedaction: Function;
    currentStatus: StatusIndicatorProps.Type | undefined;
};

type EntityItemProps = {
    entityKey: string;
    selectedEntities: any;
    handleEntitySelect: (entityPath: string[]) => void;
    switchPage: Function;
    entityPath: string[];
    entityType: string;
    entityObject: any;
};

const EntityItem: React.FC<EntityItemProps> = ({
    entityKey,
    selectedEntities,
    handleEntitySelect,
    switchPage,
    entityPath,
    entityType,
    entityObject
}) => {
    const handleCheckboxChange = (entityPath: string[]) => {
        handleEntitySelect(entityPath);
    };

    return (
        <div>
            <SpaceBetween direction="horizontal" size="xs">
                <Box data-testid="box-view-entity" padding={{ top: 'xxs' }} margin={{ top: 'xxxs' }}>
                    <Checkbox
                        checked={
                            selectedEntities[entityType]
                                ? selectedEntities[entityType].some((subArray: string[]) => {
                                      return (
                                          subArray.length === entityPath.length &&
                                          subArray.every((value, index) => value === entityPath[index])
                                      );
                                  })
                                : false
                        }
                        onChange={() => handleCheckboxChange(entityPath)}
                    ></Checkbox>
                </Box>
                <Box display="inline">
                    <ExpandableSection
                        headerText={entityKey}
                        headingTagOverride="h5"
                        data-testid={'entities-list-expandable-' + entityKey}
                    >
                        {Object.keys(entityObject).map((page) => (
                            <Box data-testid="box-view-entity-page" key={entityKey + ' ' + page + '-key'}>
                                <SpaceBetween direction="horizontal" size="xs">
                                    <Checkbox
                                        checked={
                                            selectedEntities[entityType]
                                                ? selectedEntities[entityType].some((subArray: string[]) => {
                                                      return (
                                                          subArray.length === entityPath.length + 1 &&
                                                          subArray.every(
                                                              (value, index) => value === [...entityPath, page][index]
                                                          )
                                                      );
                                                  })
                                                : false
                                        }
                                        onChange={() => handleCheckboxChange([...entityPath, page])}
                                    ></Checkbox>
                                    <span onClick={() => switchPage(+page)}>{'Page ' + page}</span>
                                </SpaceBetween>
                            </Box>
                        ))}
                    </ExpandableSection>
                </Box>
            </SpaceBetween>
        </div>
    );
};

const EntitiesList: React.FC<EntitiesListProps> = (props) => {
    const dispatch = useAppDispatch();
    const [redact] = useRedactMutation();

    const [getDocumentByCaseAndDocumentIdTrigger] = useLazyGetDocumentByCaseAndDocumentIdQuery();

    const [getDocumentToDownloadTrigger] = useLazyDocumentToDownloadQuery();

    const currentStatus = useAppSelector(selectEntityStatus);

    const getFilteredArray = useCallback(
        (entityType: string) => {
            return props.selectedEntities[entityType].filter((item: string[]) => {
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
        [props.selectedEntities]
    );

    const concatPages = useCallback(
        (entities: any, entitiesToRedact: any, selectedEntity: string[], entity: string, entityType: string) => {
            for (const page of Object.keys(entities[selectedEntity[0]][entity])) {
                entitiesToRedact[ENTITIES][entityType][selectedEntity[0]][entity] = entitiesToRedact[ENTITIES][
                    entityType
                ][selectedEntity[0]][entity].concat(+page);
            }
            return entitiesToRedact;
        },
        []
    );

    const addEntityTypeToRedact = useCallback(
        (entities: any, entitiesToRedact: any, selectedEntity: string[], entityType: string) => {
            entitiesToRedact[ENTITIES][entityType][selectedEntity[0]] = {};
            for (const entity of Object.keys(entities[selectedEntity[0]])) {
                entitiesToRedact[ENTITIES][entityType][selectedEntity[0]][entity] = [];
                for (const page of Object.keys(entities[selectedEntity[0]][entity])) {
                    entitiesToRedact[ENTITIES][entityType][selectedEntity[0]][entity] = entitiesToRedact[ENTITIES][
                        entityType
                    ][selectedEntity[0]][entity].concat(+page);
                }
            }
            return entitiesToRedact;
        },
        []
    );

    const addEntityValueToRedact = useCallback(
        (entities: any, entitiesToRedact: any, selectedEntity: string[], entityType: string) => {
            if (entitiesToRedact[ENTITIES][entityType].hasOwnProperty(selectedEntity[0])) {
                entitiesToRedact[ENTITIES][entityType][selectedEntity[0]][selectedEntity[1]] = [];
            } else {
                entitiesToRedact[ENTITIES][entityType][selectedEntity[0]] = {};
                entitiesToRedact[ENTITIES][entityType][selectedEntity[0]][selectedEntity[1]] = [];
            }
            return concatPages(entities, entitiesToRedact, selectedEntity, selectedEntity[1], entityType);
        },
        [concatPages]
    );

    const addEntityPageToRedact = useCallback(
        (entities: any, entitiesToRedact: any, selectedEntity: string[], entityType: string) => {
            if (entitiesToRedact[ENTITIES][entityType].hasOwnProperty(selectedEntity[0])) {
                if (entitiesToRedact[ENTITIES][entityType][selectedEntity[0]].hasOwnProperty(selectedEntity[1])) {
                    entitiesToRedact[ENTITIES][entityType][selectedEntity[0]][selectedEntity[1]] = entitiesToRedact[
                        ENTITIES
                    ][entityType][selectedEntity[0]][selectedEntity[1]].concat(+selectedEntity[2]);
                } else {
                    entitiesToRedact[ENTITIES][entityType][selectedEntity[0]][selectedEntity[1]] = [+selectedEntity[2]];
                }
            } else {
                entitiesToRedact[ENTITIES][entityType][selectedEntity[0]] = {};
                entitiesToRedact[ENTITIES][entityType][selectedEntity[0]][selectedEntity[1]] = [+selectedEntity[2]];
            }
            return entitiesToRedact;
        },
        []
    );

    const redactAllEntities = async () => {
        try {
            dispatch(setStatus('loading'));
            let entitiesToRedact: any = {
                'entities': {
                    [EntityTypes.ENTITY_STANDARD]: {},
                    [EntityTypes.MEDICAL_ENTITY]: {},
                    [EntityTypes.PII]: {}
                }
            };
            for (const entityType of Object.values(EntityTypes)) {
                if (props.selectedEntities[entityType] && props.selectedEntities[entityType].length > 0) {
                    const entities = getEntitiesToProcess(entityType, props);
                    const filteredArray = getFilteredArray(entityType);
                    for (const selectedEntity of filteredArray) {
                        entitiesToRedact = processSelectedEntity(
                            selectedEntity,
                            entitiesToRedact,
                            entities,
                            entityType
                        );
                    }
                } else {
                    delete entitiesToRedact.entities[entityType];
                }
            }

            await redact({
                caseId: props.selectedCaseId,
                documentId: props.selectedDocumentId,
                body: entitiesToRedact
            }).unwrap();

            const documentResponse = await getDocumentByCaseAndDocumentIdTrigger({
                caseId: props.selectedCaseId as string,
                documentId: props.selectedDocumentId as string,
                redacted: true
            }).unwrap();

            const signedUrlObject = await getDocumentToDownloadTrigger({ key: documentResponse.key }).unwrap();

            window.open(signedUrlObject.downloadUrl, '_blank', 'noopener');
            dispatch(setStatus('success'));
        } catch (err) {
            dispatch(setStatus('error'));
            console.log(err);
            console.error(err);
        }

        function processSelectedEntity(selectedEntity: any, entitiesToRedact: any, entities: any, entityType: string) {
            switch (selectedEntity.length) {
                case 1:
                    entitiesToRedact = addEntityTypeToRedact(entities, entitiesToRedact, selectedEntity, entityType);
                    break;
                case 2:
                    entitiesToRedact = addEntityValueToRedact(entities, entitiesToRedact, selectedEntity, entityType);
                    break;
                case 3:
                    entitiesToRedact = addEntityPageToRedact(entities, entitiesToRedact, selectedEntity, entityType);
            }
            return entitiesToRedact;
        }
    };

    let is_comprehend_medical = '';
    let medical_test_id = '';
    if (props.comprehendService === COMPREHEND_MEDICAL_SERVICE) {
        is_comprehend_medical = 'Medical';
        medical_test_id = 'medical-';
    }

    // when success message is received and no data
    if (!props.entities || !Object.keys(props.entities).length) {
        if (isStatusSuccess(props.currentStatus))
            return (
                <p data-testid={`${medical_test_id}entities-nodata`}>
                    No {`${is_comprehend_medical}`} Entities detected
                </p>
            );
    }

    const inSelectedEntities = (entityPath: string[]) => {
        return props.selectedEntities[props.entityType].some((subArray: string[]) => {
            return (
                subArray.length === entityPath.length && subArray.every((value, index) => value === entityPath[index])
            );
        });
    };

    const removeFromSelectedEntities = (entityPath: string[]) => {
        props.setSelectedEntities({
            ...props.selectedEntities,
            [props.entityType]: props.selectedEntities[props.entityType].filter((arr: string[]) => {
                if (arr.slice(0, entityPath.length).every((elem, i) => elem === entityPath[i])) {
                    return false;
                }
                return true;
            })
        });
    };

    const handleEntitySelect = (entityPath: string[]) => {
        if (inSelectedEntities(entityPath)) {
            removeFromSelectedEntities(entityPath);
        } else {
            let newSelectedEntities: string[][] = [entityPath];
            if (entityPath.length === 2) {
                for (const pageNum of Object.keys(props.entities[entityPath[0]][entityPath[1]])) {
                    newSelectedEntities.push([...entityPath, pageNum]);
                }
            } else if (entityPath.length === 1) {
                for (const entityName of Object.keys(props.entities[entityPath[0]])) {
                    newSelectedEntities.push([...entityPath, entityName]);
                    for (const pageNum of Object.keys(props.entities[entityPath[0]][entityName])) {
                        newSelectedEntities.push([...entityPath, entityName, pageNum]);
                    }
                }
            }

            props.setSelectedEntities({
                ...props.selectedEntities,
                [props.entityType]: [...props.selectedEntities[props.entityType], ...newSelectedEntities]
            });
        }
    };

    const selectAllEntities = () => {
        let allSelectedEntities: string[][] = [];
        for (const entityType of Object.keys(props.entities)) {
            allSelectedEntities.push([entityType]);
            for (const entityName of Object.keys(props.entities[entityType])) {
                allSelectedEntities.push([entityType, entityName]);
                for (const pageNum of Object.keys(props.entities[entityType][entityName])) {
                    allSelectedEntities.push([entityType, entityName, pageNum]);
                }
            }
        }
        props.setSelectedEntities({
            ...props.selectedEntities,
            [props.entityType]: allSelectedEntities
        });
    };

    const deselectAllEntities = () => {
        props.setSelectedEntities({ ...props.selectedEntities, [props.entityType]: [] });
    };

    const mainTabs =
        props.entities &&
        Object.keys(props.entities).map((type) => ({
            label: (
                <div>
                    {type}{' '}
                    <Badge color="blue" data-testid="badge-entity-count">
                        {props.selectedEntities[props.entityType]
                            ? props.selectedEntities[props.entityType].filter(
                                  (subarray: string[]) => subarray[0] === type && subarray.length === 3
                              ).length
                            : 0}
                    </Badge>
                </div>
            ),
            id: type.replace(/\s/g, ''),
            content: (
                <Box data-testid="box-parent-view-entity-title">
                    {renderStatus(props.currentStatus, true, false, 'An error occurred loading detected entities.', '')}
                    {isStatusSuccess(props.currentStatus) && (
                        <SpaceBetween direction="horizontal" size="xs">
                            <Checkbox
                                checked={
                                    props.selectedEntities[props.entityType]
                                        ? props.selectedEntities[props.entityType].some((subArray: string[]) => {
                                              return (
                                                  subArray.length === 1 &&
                                                  subArray.every((value, index) => value === type)
                                              );
                                          })
                                        : false
                                }
                                onChange={() => handleEntitySelect([type])}
                            ></Checkbox>
                            <Box variant="h4" display="inline">
                                All Detected {type} Entities
                            </Box>
                        </SpaceBetween>
                    )}

                    {isStatusSuccess(props.currentStatus) &&
                        Object.keys(props.entities[type]).map((entity) => (
                            <EntityItem
                                key={type + ' ' + entity + '-key'}
                                entityType={props.entityType}
                                entityObject={props.entities[type][entity]}
                                entityKey={entity}
                                selectedEntities={props.selectedEntities}
                                handleEntitySelect={handleEntitySelect}
                                switchPage={props.switchPage}
                                entityPath={[type, entity]}
                            />
                        ))}
                </Box>
            )
        }));

    const status = renderStatus(
        props.currentStatus,
        true,
        false,
        `An error occurred loading ${is_comprehend_medical} Entities.`,
        ''
    );
    if (isStatusSuccess(props.currentStatus)) {
        return (
            <div>
                <SpaceBetween size={'xs'} direction="horizontal">
                    <Button onClick={() => selectAllEntities()} data-testid="select-all-entities">
                        Select All
                    </Button>
                    <Button onClick={() => deselectAllEntities()} data-testid="deselect-all-entities">
                        Deselect All
                    </Button>
                    <Button onClick={() => redactAllEntities()} data-testid="redact-all-entities">
                        Download Redacted Document &nbsp;
                        {currentStatus && <StatusIndicator data-testid="status" type={currentStatus} />}
                    </Button>
                    <Toggle
                        onChange={({ detail }) => props.setPreviewRedaction(detail.checked ? PREVIEW_REDACTION_ON : '')}
                        checked={props.previewRedaction === PREVIEW_REDACTION_ON}
                        data-testid="toggle-preview-redaction"
                    >
                        {' '}
                        Preview Redacted Document{' '}
                    </Toggle>
                </SpaceBetween>
                <Tabs tabs={mainTabs}></Tabs>
            </div>
        );
    }
    return <p data-testid={`${medical_test_id}entities-status-only`}> {status} </p>;
};

export default EntitiesList;
