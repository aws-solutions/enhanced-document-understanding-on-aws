// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
'use strict';
const { MetricNames } = require('../constants');
const { sendCloudWatchMetrics } = require('./utils/send-metrics');

/**
 * Publishes metrics for documents uploaded.
 * @param  {String} namespace            passed implicitly from CloudWatchContext to reflect the namespace that the metrics are published to.
 * @return {Integer} docsUploadedCount   optional param for count of documents uploaded.
 */
class DocumentMetrics {
    async publishMetricsData(namespace, docsUploadedCount = 1) {
        const params = {
            MetricData: [
                {
                    MetricName: MetricNames.DOCUMENTS,
                    Dimensions: [
                        { Name: 'Documents', Value: 'Upload' },
                        { Name: 'serviceName', Value: `eDUS-${process.env.UUID}` }
                    ],
                    Timestamp: new Date(),
                    Unit: 'Count',
                    Value: docsUploadedCount
                }
            ],
            Namespace: namespace
        };
        const data = await sendCloudWatchMetrics(namespace, params);
        return data;
    }
}

module.exports = { DocumentMetrics };
