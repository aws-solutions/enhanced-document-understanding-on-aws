// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
'use strict';

const { CaseProcessedMetrics } = require('./case-status');
const { FileTypeMetrics } = require('./file-types');
const { WorkflowMetrics } = require('./workflows');
const { DocumentMetrics } = require('./documents');
const { CloudwatchNamespace } = require('../constants');
const error = `Invalid CloudwatchNamespace. Possible values: ${Object.keys(CloudwatchNamespace)}.`;

/**
 * The Context maintains a reference to one of the Strategy objects.
 * It does not know the concrete class of a strategy and works with all strategies.
 */
class CloudWatchContext {
    constructor() {
        this.strategyObj = null;
    }

    setCWStrategy(strategyObj) {
        this.strategyObj = strategyObj;
    }

    async publishMetricsData(...args) {
        return await this.strategyObj.publishMetricsData(...args);
    }
}

/**
 * Picks a concrete strategy based on namespace variable and passes it to the context
 * This CloudWatchMetrics client is aware of the differences between strategies in order to call
 * the appropriate method.
 *
 * Usage:
 *
 * const { CloudWatchMetrics, CloudwatchNamespace, CaseStatus, .. } = require('common-node-lib');
 *
 * Case Status:
 *     const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.CASE);
 *     cloudWatch.publishMetrics(CaseStatus.INITIATE);
 *     cloudWatch.publishMetrics(CaseStatus.SUCCESS);
 *
 * File Types:
 *     const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.FILE_TYPES);
 *     cloudWatch.publishMetrics(SupportedFileTypes.JPG);
 *     cloudWatch.publishMetrics(SupportedFileTypes.JPG, 2); // for multiple documents
 *
 *     const fileExtension = 'png';
 *     cloudWatch.publishMetrics(fileExtension);
 *
 * Workflows:
 *     const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.WORKFLOW_TYPES);
 *     cloudWatch.publishMetrics(ComprehendAPIs.COMPREHEND_DETECT_ENTITIES_SYNC);
 *     cloudWatch.publishMetrics(ComprehendAPIs.COMPREHEND_DETECT_ENTITIES_SYNC, 2);  // for multiple documents
 *
 * To enable switching between namespaces:
 *     const cloudWatch = new CloudWatchMetrics(CloudwatchNamespace.FILE_TYPES);
 *     cloudWatch.publishMetrics(SupportedFileTypes.JPEG);
 *
 *     cloudWatch.setNamespace(CloudwatchNamespace.CASE);
 *     cloudWatch.publishMetrics(CaseStatus.INITIATE);
 *
 */
class CloudWatchMetrics {
    constructor(namespace) {
        console.log(`namespace received: ${namespace}`)
        if (!namespace) {
            console.error(`${error} Provided namespace: ${namespace}`);
            throw new Error(`${error} Provided namespace: ${namespace}`);
        }
        if (Object.values(CloudwatchNamespace).includes(namespace)) {
            this.namespace = namespace;
        } else {
            console.error(`${error} Provided namespace: ${namespace}`);
            throw new Error(`${error} Provided namespace: ${namespace}`);
        }
        this.context = new CloudWatchContext();
        this.setNamespace(this.namespace);
    }

    setNamespace(namespace) {
        if (!namespace) {
            console.error('setNamespace method needs a CloudwatchNamespace type as an argument');
            throw new Error('setNamespace method needs a CloudwatchNamespace type as an argument');
        }
        if (Object.values(CloudwatchNamespace).includes(namespace)) {
            this.namespace = namespace;
            const strategyObj = this.getNamespaceObj();
            this.context.setCWStrategy(strategyObj);
        } else {
            console.error(`${error} Provided namespace: ${namespace}`);
            throw new Error(`${error} Provided namespace: ${namespace}`);
        }
    }

    getNamespaceObj() {
        /*eslint indent: [2, 4, {"SwitchCase": 1}]*/
        switch (this.namespace) {
            case CloudwatchNamespace.DOCUMENTS: {
                return new DocumentMetrics();
            }
            case CloudwatchNamespace.CASE: {
                return new CaseProcessedMetrics();
            }
            case CloudwatchNamespace.FILE_TYPES: {
                return new FileTypeMetrics();
            }
            case CloudwatchNamespace.WORKFLOW_TYPES: {
                return new WorkflowMetrics();
            }
            default:
                // should not reach here from the code.
                console.error(`${error} Provided namespace: ${namespace}`);
                throw new Error(`${error} Provided namespace: ${namespace}`);
        }
    }

    async publishMetrics(...args) {
        return await this.context.publishMetricsData(this.namespace, ...args);
    }
}

module.exports = { CloudWatchContext, CloudWatchMetrics };
