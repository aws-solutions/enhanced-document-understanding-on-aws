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
 **********************************************************************************************************************/

'use strict';

const utils = require('./generic');
const SharedLib = require('common-node-lib');
const { EntityDetector } = require('./entity/entity-detector');

exports.ENTITY_DETECTION_LANGUAGE = undefined;
exports.CUSTOM_COMPREHEND_ARN = undefined;

/**
 * Checks the Lambda environment variables for Comprehend. It sets:
 *
 * `ENTITY_DETECTION_LANGUAGE`: The language to be used in the standard entity detection
 *
 * `CUSTOM_COMPREHEND_ARN`: if set, will use this custom comprehend model instead of the default
 *
 */
exports.checkComprehendSyncEnvSetup = () => {
    if (!process.env.ENTITY_DETECTION_LANGUAGE) {
        exports.ENTITY_DETECTION_LANGUAGE = utils.DEFAULT_LANGUAGE;
    } else {
        exports.ENTITY_DETECTION_LANGUAGE = process.env.ENTITY_DETECTION_LANGUAGE;
    }

    if (process.env.CUSTOM_COMPREHEND_ARN) {
        exports.CUSTOM_COMPREHEND_ARN = process.env.CUSTOM_COMPREHEND_ARN;
        console.info(`Custom comprehend ARN is: ${exports.CUSTOM_COMPREHEND_ARN}`);
    }
};

/**
 * Performs entity detection on a single record using Comprehend. For the given record,
 * Comprehend operation will be performed on texts per page.
 * @param {String} taskToken as received from sqs event
 * @param {String} sqsRecord Single record from SQS containing the text to perform entity detection on
 * @param {string} requestAccountId S3 Bucket expected owner account id
 * @returns the response from Comprehend for the given input
 */
exports.runSyncEntityDetection = async (taskToken, sqsRecord, requestAccountId) => {
    const parsedSqsRecordBody = typeof sqsRecord.body === 'string' ? JSON.parse(sqsRecord.body) : sqsRecord.body;

    // the state name corresponds to the 3 possible job types (standard, pii, medical)
    const inputJobType = parsedSqsRecordBody.input.stage;

    const textractResponse = await this.getTextractDetectedText(parsedSqsRecordBody.input);

    //comprehendOutput will be populated by comprehend result, each array element represents output for each page
    let comprehendOutput = [];
    let entityLocations = {};

    for (let pageIdx = 0; pageIdx < textractResponse.length; pageIdx++) {
        // prepare the input, combining all 'LINE' blocks for a page into a string to be passed to comprehend
        let blockDict = {};
        let offsetToLineIdMap = [];
        let pageText = '';
        textractResponse[pageIdx].Blocks.forEach((block) => {
            if (block.BlockType === SharedLib.TextractBlockTypes.LINE) {
                offsetToLineIdMap.push({ offset: pageText.length, id: block.Id });
                pageText = pageText.concat(block.Text, ' ');
            }

            // blockDict uses Id as key, keeps rest of data intact
            blockDict[block.Id] = block;
        });
        pageText = pageText.trim();

        const entityStrategy = new EntityDetector(inputJobType);
        const response = await entityStrategy.getComprehendResult({
            pageText: pageText,
            taskToken: taskToken,
            languageCode: exports.ENTITY_DETECTION_LANGUAGE,
            endpointArn: exports.CUSTOM_COMPREHEND_ARN
        });

        entityStrategy.addEntityLocations({
            entityLocations: entityLocations,
            response: response,
            offsetToLineIdMap: offsetToLineIdMap,
            blockDict: blockDict,
            pageIdx: pageIdx,
            pageText: pageText
        });

        comprehendOutput.push(response);
    }

    // prettier-ignore
    const formattedInferences = await this.uploadSyncEntityDetectionInferences(// NOSONAR - await does nothing in deployment, needed for unit tests
        parsedSqsRecordBody.input,
        inputJobType,
        comprehendOutput,
        entityLocations,
        requestAccountId
    );
    return { inferences: formattedInferences };
};

/**
 * Retrieves the detected text from s3 for the given document
 *
 * @param {Object} input The body.input field of the SQS input, containing info about the document
 * @returns the textract detect text inference for the given document
 * @throws if the provided payload does not contain the required textract detect text inference, or we encounter an error.
 */
exports.getTextractDetectedText = async (input) => {
    if (SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT in input.inferences) {
        try {
            return SharedLib.getInferenceFromS3(
                input.document.caseId,
                input.document.id,
                SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT
            );
        } catch (error) {
            throw new Error(
                `Failed to retrieve inference ${SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT} for document with ID ${input.document.id} and case ${input.caseId}. Got error ${error.message}.`
            );
        }
    } else {
        throw new Error(
            `No inference called ${SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT} was found in the payload, and thus stage ${input.stage} can't be performed.`
        );
    }
};

/**
 * Given the inferences for the document being processed, upload the inference data to s3 and add DDB attribute(s)
 * for this document pointing to the s3 location of the inference files.
 *
 * @param {Object} input The body.input field of the SQS input, containing info about the document.
 * @param {string} inputJobType the name of the type of entity detection job we have run. Will be used as the inferenceType uploaded.
 * @param {Array[Object]} comprehendOutputs The inferences to be uploaded, generated by comprehend. Should be an array of results, with 1 item per page.
 * @param {Object} entityLocations The structure mapping all detected entities to their bounding boxes.
 * @param {string} requestAccountId S3 Bucket expected owner account id
 * @returns {Object} a key:value pair with the inferenceType (same as inputJobType here) as key mapping to the s3 key of the uploaded inference as value
 */
exports.uploadSyncEntityDetectionInferences = async (
    input,
    inputJobType,
    comprehendOutputs,
    entityLocations,
    requestAccountId
) => {
    const locationInferenceName = `${inputJobType}-${utils.INFERENCE_NAME_LOCATION_SUFFIX}`;
    let inferencesToUpload = [inputJobType];
    input.inferences[inputJobType] = comprehendOutputs;

    // only upload locations if they are present
    if (Object.keys(entityLocations).length) {
        inferencesToUpload.push(locationInferenceName);
        input.inferences[locationInferenceName] = entityLocations;
    }

    const inferenceInfos = await SharedLib.uploadDocumentInferences(input, requestAccountId, inferencesToUpload);
    await SharedLib.updateInferences(inferenceInfos);

    let output = {};
    inferenceInfos.forEach((inferenceInfo) => {
        output[inferenceInfo.inferenceType] = inferenceInfo.s3Key;
    });

    return output;
};
