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
 * This class is used to process text to extract Standard entities using AWS Comprehend.
 */
class GenericEntityDetectionStrategy {
    /**
     * Extracts Standard entities from the given paragraph using AWS Comprehend.
     *
     * @param {Object} params.comprehendClient AWS Comprehend API Client
     * @param {String} params.pageText the text to extract entities from
     * @param {String} params.taskToken as received from sqs event
     * @param {String} params.languageCode the language code of the paragraph
     * @param {String} params.endpointArn the ARN of the Comprehend Endpoint
     * @returns the response from Comprehend for the given input
     * @throws if Comprehend throws an error
     */
    async getComprehendResult(params) {
        const cloudWatch = new SharedLib.CloudWatchMetrics(SharedLib.CloudwatchNamespace.WORKFLOW_TYPES);

        const apiRequestParams = {
            Text: params.pageText,
            LanguageCode: params.languageCode,
            // note this will only be defined as an env variable if it was set by the infrastructure.
            // if it is undefined, the param will be passed in as undefined and the standard model will be used.
            EndpointArn: params.endpointArn
        };

        try {
            const response = await params.comprehendClient.detectEntities(apiRequestParams).promise();
            await cloudWatch.publishMetrics(SharedLib.ComprehendAPIs.COMPREHEND_DETECT_ENTITIES_SYNC);
            return response;
        } catch (error) {
            console.error(
                `Failed to run Comprehend Sync job of type ${utils.jobTypes.STANDARD} for params: ${JSON.stringify(
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
    addEntityLocations(params) {
        params.comprehendResponse.Entities.forEach((entity) => {
            try {
                utils.addEntityLocation(
                    params.entityLocations,
                    entity,
                    params.offsetToLineIdMap,
                    params.blockDict,
                    params.pageIdx + 1
                );
            } catch (error) {
                console.error(`Determining location of entity '${JSON.stringify(entity)}' failed with error: ${error}`);
            }
        });
    }
}

module.exports = { GenericEntityDetectionStrategy };
