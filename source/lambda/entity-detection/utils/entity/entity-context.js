// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
'use strict';

/**
 * This class is the context for the Comprehend Strategy pattern. It is the
 * container for the strategy object and the common operations that are
 * common to all supported versions of Comprehend.
 */
class EntityContext {
    constructor() {
        this.jobType = null;
    }
    /**
     * This acts as the Strategy interface that declares operations common to
     * all supported versions of entity
     */
    setComprehendType(jobType) {
        this.jobType = jobType;
    }

    async getComprehendResult(params) {
        return await this.jobType.getComprehendResult(params);
    }

    addEntityLocations(params) {
        this.jobType.addEntityLocations(params);
    }
}

module.exports = { EntityContext };
