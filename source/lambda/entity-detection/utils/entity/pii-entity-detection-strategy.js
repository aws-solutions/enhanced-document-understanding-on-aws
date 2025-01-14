// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
'use strict';

const utils = require('../generic');
const SharedLib = require('common-node-lib');

/**
 * This class is used to process text to extract PII entities using AWS Comprehend.
 */
class PiiEntityDetectionStrategy {
    /**
     * Extracts PII entities from the given paragraph using AWS Comprehend.
     *
     * @param {Object} params.comprehendClient AWS Comprehend API Client
     * @param {String} params.pageText the text to extract entities from
     * @param {String} params.taskToken as received from sqs event
     * @param {String} params.languageCode the language code of the paragraph
     * @returns the response from Comprehend for the given input
     * @throws if Comprehend throws an error
     */
    async getComprehendResult(params) {
        const cloudWatch = new SharedLib.CloudWatchMetrics(SharedLib.CloudwatchNamespace.WORKFLOW_TYPES);

        const apiRequestParams = {
            Text: params.pageText,
            LanguageCode: params.languageCode
        };

        try {
            const response = await params.comprehendClient.detectPiiEntities(apiRequestParams).promise();
            await cloudWatch.publishMetrics(SharedLib.ComprehendAPIs.COMPREHEND_DETECT_PII_SYNC);
            return response;
        } catch (error) {
            console.error(
                `Failed to run Comprehend Sync job of type ${utils.jobTypes.PII} for params: ${JSON.stringify(
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
     * @param {Number} params.pageIdx the page index number of the entity (0 based).
     */
    addEntityLocations(params) {
        params.comprehendResponse.Entities.forEach((entity) => {
            // create a new entity 'Text' for custom inference, as 'Text' is not present in the ComprehendPii response
            entity.Text = params.pageText.substring(entity.BeginOffset, entity.EndOffset);
            try {
                utils.addEntityLocation(
                    params.entityLocations,
                    entity,
                    params.offsetToLineIdMap,
                    params.blockDict,
                    params.pageIdx + 1
                );
            } catch (error) {
                console.error(
                    `Determining location of PII entity '${JSON.stringify(entity)}' failed with error: ${error}`
                );
            }
        });
    }
}

module.exports = { PiiEntityDetectionStrategy };
