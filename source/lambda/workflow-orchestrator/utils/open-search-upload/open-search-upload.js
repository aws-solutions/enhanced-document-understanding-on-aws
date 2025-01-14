// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const SharedLib = require('common-node-lib');
const { AossProxy } = require('common-node-lib');
const { TextractStrategy } = require('./strategies/textract-strategy');
const { GenericEntityStrategy } = require('./strategies/generic-entity-strategy');
const { MedicalEntityStrategy } = require('./strategies/medical-entity-strategy');
const { validateInputParams, validateWorkFlows, getUserIdFromEvent } = require('../search-storage-utils');

/**
 * This class provides the functionality to fetch textract and comprehend inferences from S3 and persists them to
 * the OpenSearch serverless collection.
 */
class OpenSearchUpload {
    /**
     * @param {Object} payload the step function event that specifies workflow and case configurations.
     * @param {string} requestAccountId S3 Bucket expected owner account id
     */
    constructor(payload, requestAccountId) {
        validateInputParams(payload);
        const workFlows = payload.case.workflows;
        this.accountId = requestAccountId;
        this.userId = getUserIdFromEvent(payload);
        this.case = payload.case;
        this.documents = payload.case.documentList;
        this.indexName = 'edu';
        this.determineStrategies(workFlows);
    }

    /**
     * Given workflows that case run against, determine the strategy(s) that OpenSearch upload should perform.
     *
     * @param {Array.<string>} workFlows the workflows that case run against.
     *
     * @returns {Array.<Object>} the strategy(s) that OpenSearch upload should perform.
     */
    determineStrategies(workFlows) {
        validateWorkFlows(workFlows);
        this.strategies = new Map();

        for (const workFlow of workFlows) {
            switch (workFlow) {
            case SharedLib.WorkflowStageNames.TEXTRACT:
                this.strategies.set(workFlow,
                    new TextractStrategy(this.accountId, this.userId, this.case.id, this.documents));
                break;
            case SharedLib.WorkflowStageNames.ENTITY:
                this.strategies.set(workFlow,
                    new GenericEntityStrategy(this.accountId, this.userId, this.case.id, this.documents));
                break;
            case SharedLib.WorkflowStageNames.MEDICAL_ENTITY:
                this.strategies.set(workFlow,
                    new MedicalEntityStrategy(this.accountId, this.userId, this.case.id, this.documents));
                break;
            default:
                break;
            }
        }
    }

    /**
     * Execute all strategies that OpenSearch upload previously specified, given the workflows.
     */
    async run() {
        for (const strategy of this.strategies.values()){
            await strategy.prepareDocuments();
        }

        this.openSearchProxy = new AossProxy();
        await this.openSearchProxy.createIndex(this.indexName);

        for (const document of this.documents) {
            const documentPayload = document.document;
            const documentId = documentPayload.id;

            const textractInference = this.strategies.get(SharedLib.WorkflowStageNames.TEXTRACT).inferences.get(documentId);
            
            this.strategies.get(SharedLib.WorkflowStageNames.TEXTRACT).inferences.delete(documentId);

            if(this.strategies.get(SharedLib.WorkflowStageNames.TEXTRACT).inferences.size === 0) this.strategies.delete(SharedLib.WorkflowStageNames.TEXTRACT);

            const comprehendInference = Array.from(this.strategies.values())
                .map(strategy => strategy.inferences.get(documentId))
                .reduce((acc, cur) => {
                    return { ...acc, ...cur };
                }, {});

            await this.openSearchProxy.writeDocuments(this.case, documentPayload, this.indexName, textractInference, comprehendInference);
        }
    }
}

module.exports = { OpenSearchUpload };
