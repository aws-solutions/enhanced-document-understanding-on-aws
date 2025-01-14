// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
'use strict';

const AWS = require('aws-sdk');
const UserAgentConfig = require('aws-node-user-agent-config');
const utils = require('../generic');
const { EntityContext } = require('./entity-context');
const { MedicalEntityDetectionStrategy } = require('./medical-entity-detection-strategy');
const { GenericEntityDetectionStrategy } = require('./generic-entity-detection-strategy');
const { PiiEntityDetectionStrategy } = require('./pii-entity-detection-strategy');

/**
 * This class provides the functionality to call the Comprehend services.
 */
class EntityDetector {
    /**
     * @param {String} jobType the type of the Comprehend API to be performed.
     */
    constructor(jobType) {
        this.validateJobType(jobType);
        this.jobType = jobType;
        this.context = new EntityContext();
        this.context.setComprehendType(this.getComprehendJobType(this.jobType));
    }

    /**
     * Uses jobType to decide which Comprehend object to return.
     * @param {String} jobType
     * @returns returns the correct Comprehend object
     */
    getComprehendJobType(jobType) {
        switch (jobType) {
            case utils.jobTypes.STANDARD:
                return new GenericEntityDetectionStrategy();
            case utils.jobTypes.PII:
                return new PiiEntityDetectionStrategy();
            case utils.jobTypes.MEDICAL:
                return new MedicalEntityDetectionStrategy();
        }
    }

    /**
     * Validates the input parameters for the jobType.
     * @param {String} jobType
     */
    validateJobType = (jobType) => {
        if (!Object.values(utils.jobTypes).includes(jobType)) {
            throw new Error(`Unsupported jobType ${jobType} provided.`);
        }
    };

    /**
     * Validates the input parameters for the languageCode
     * @param {String} languageCode
     */
    validateLanguageCode = (jobType, languageCode) => {
        if (
            (jobType === utils.jobTypes.STANDARD || jobType === utils.jobTypes.PII) &&
            !utils.SUPPORTED_LANGUAGES.includes(languageCode)
        ) {
            throw new Error(`Unsupported language ${languageCode} provided.`);
        }
    };

    /**
     * Uses jobType to decide whether to return the AWS.ComprehendMedical or
     * the AWS.Comprehend Client object.
     * @param {String} jobType
     * @returns returns the correct comprehendClient
     */
    selectComprehendClient = (jobType) => {
        return jobType === utils.jobTypes.MEDICAL
            ? new AWS.ComprehendMedical(UserAgentConfig.customAwsConfig())
            : new AWS.Comprehend(UserAgentConfig.customAwsConfig());
    };

    /**
     * Performs entity detection on a text paragraph/phrase using Comprehend/ComprehendMedical. Based on class configuration,
     * the correct API will be used.
     *
     * @param {String} params.pageText the text to extract entities from
     * @param {String} params.taskToken as received from sqs event
     * @param {String} params.languageCode the language code of the paragraph
     * @param {String} params.endpointArn the ARN of the Comprehend Endpoint
     * @returns
     */
    async getComprehendResult(params) {
        this.validateLanguageCode(this.jobType, params.languageCode);
        const comprehendClient = this.selectComprehendClient(this.jobType);
        return await this.context.getComprehendResult({
            comprehendClient: comprehendClient,
            pageText: params.pageText,
            taskToken: params.taskToken,
            languageCode: params.languageCode,
            endpointArn: params.endpointArn
        });
    }

    /**
     * This function is used to add the bounding boxes of entities to an entities locations object from a given comprehend response.
     *
     * @param {Object} params.entityLocations locations object to add bounding boxes to
     * @param {Object} params.response the Comprehend/ComprehendMedical response
     * @param {Array} params.offsetToLineIdMap array of objects which each map a starting character offset to a textract
     * output block Id. Expected to look like: [ { offset: 0, id: 'id1' }, { offset: 10, id: 'id2' }, ...]
     * @param {Object} params.lockDict an object derived from the textract output which maps block Id's to blocks.
     * @param {Number} params.pageIdx the page index of the entity (0 based).
     * @param {String} params.pageText entire text of the page
     */
    addEntityLocations(params) {
        return this.context.addEntityLocations({
            entityLocations: params.entityLocations,
            comprehendResponse: params.response,
            offsetToLineIdMap: params.offsetToLineIdMap,
            blockDict: params.blockDict,
            pageIdx: params.pageIdx,
            pageText: params.pageText
        });
    }
}

module.exports = { EntityDetector };
