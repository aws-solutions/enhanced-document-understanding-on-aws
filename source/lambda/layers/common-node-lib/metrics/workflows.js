// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
'use strict';

const { ComprehendAPIs, TextractAPIs, MetricNames } = require('../constants');
const { sendCloudWatchMetrics } = require('./utils/send-metrics');

/**
 * Publishes metrics for file types uploaded.
 * @param  {String} namespace              passed implicitly from CloudWatchContext to reflect the namespace that the metrics are published to.
 * @return {String} apiName                API called for the workflow
 * @return {Integer} filesProcessedCount   optional param for number of API calls made of type 'apiName'
 */
class WorkflowMetrics {
    async publishMetricsData(namespace, apiName, apiCallCount = 1) {
        let metricName, dimensionName;
        if (Object.values(ComprehendAPIs).includes(apiName)) {
            metricName = MetricNames.COMPREHEND;
            dimensionName = 'ComprehendAPI';
        } else if (Object.values(TextractAPIs).includes(apiName)) {
            metricName = MetricNames.TEXTRACT;
            dimensionName = 'TextractAPI';
        } else {
            const error = `Provided API in publishMetrics method is not supported.`;
            console.error(error);
            throw new Error(error);
        }

        const params = {
            MetricData: [
                {
                    MetricName: metricName,
                    Dimensions: [
                        { Name: dimensionName, Value: apiName },
                        { Name: 'serviceName', Value: `eDUS-${process.env.UUID}` }
                    ],
                    Timestamp: new Date(),
                    Unit: 'Count',
                    Value: apiCallCount
                }
            ],
            Namespace: namespace
        };
        const data = await sendCloudWatchMetrics(namespace, params);
        return data;
    }
}

module.exports = { WorkflowMetrics };
