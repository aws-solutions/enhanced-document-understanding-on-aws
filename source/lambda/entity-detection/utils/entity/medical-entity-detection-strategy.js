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

const utils = require('../generic');
const SharedLib = require('common-node-lib');

/**
 * This class is used to process text to extract Medical entities using AWS ComprehendMedical.
 */
class MedicalEntityDetectionStrategy {
    /**
     * Extracts Medical entities from the given paragraph using AWS ComprehendMedical.
     *
     * @param {Object} params.comprehendClient AWS ComprehendMedical API Client
     * @param {String} params.pageText the text to extract entities from
     * @param {String} params.taskToken as received from sqs event
     * @returns the response from Comprehend for the given input
     * @throws if ComprehendMedical throws an error
     */
    async getComprehendResult(params) {
        const cloudWatch = new SharedLib.CloudWatchMetrics(SharedLib.CloudwatchNamespace.WORKFLOW_TYPES);

        const apiRequestParams = {
            Text: params.pageText
        };

        try {
            const response = await params.comprehendClient.detectEntitiesV2(apiRequestParams).promise();
            await cloudWatch.publishMetrics(SharedLib.ComprehendAPIs.COMPREHEND_DETECT_MEDICAL_SYNC);
            return response;
        } catch (error) {
            console.error(
                `Failed to run Comprehend Sync job of type ${utils.jobTypes.MEDICAL} for params: ${JSON.stringify(
                    apiRequestParams
                )} and taskToken ${params.taskToken}`
            );
            await cloudWatch.publishMetrics(SharedLib.ComprehendAPIs.COMPREHEND_SYNC_FAILURES);
            throw error;
        }
    }

    /**
     * This function is used to add the bounding boxes of entities to an entities locations object from a given comprehend response.
     *
     * @param {Object} params.entityLocations locations object to add bounding boxes to
     * @param {Object} params.comprehendResponse response from Comprehend API
     * @param {Array} params.offsetToLineIdMap array of objects which each map a starting character offset to a textract
     * output block Id. Expected to look like: [ { offset: 0, id: 'id1' }, { offset: 10, id: 'id2' }, ...]
     * @param {Object} params.blockDict an object derived from the textract output which maps block Id's to blocks.
     * @param {Number} params.pageIdx the page index of the entity (0 based).
     */
    addEntityLocations = function (params) {
        params.comprehendResponse.Entities.forEach((entity) => {
            // create a temporary entity 'MedicalType' to record 'Type'
            entity.MedicalType = entity.Type;
            // use Comprehend Medical response's 'Category' as 'Type' to calculate bounding-boxes
            entity.Type = entity.Category;

            utils.addEntityLocation(
                params.entityLocations,
                entity,
                params.offsetToLineIdMap,
                params.blockDict,
                params.pageIdx + 1
            );

            // reassign the value of 'Type' from 'MedicalType'
            entity.Type = entity.MedicalType;
            delete entity.MedicalType;
        });
    };
}

module.exports = { MedicalEntityDetectionStrategy };
