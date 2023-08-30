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
