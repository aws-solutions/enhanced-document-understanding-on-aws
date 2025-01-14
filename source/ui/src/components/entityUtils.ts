// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { EntityTypes } from '../utils/constants';

/**
 * Get the entities to process based on the selected type
 *
 * @param entityType
 * @param props
 * @returns
 */
export function getEntitiesToProcess(entityType: string, props: any) {
    let entities: any;

    switch (entityType) {
        case EntityTypes.ENTITY_STANDARD: {
            entities = props.standardEntities;
            break;
        }
        case EntityTypes.MEDICAL_ENTITY: {
            entities = props.medicalEntities;
            break;
        }
        case EntityTypes.PII: {
            entities = props.piiEntities;
        }
    }
    return entities;
}
