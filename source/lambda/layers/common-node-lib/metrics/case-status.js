// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
'use strict';

const { CaseStatus, MetricNames } = require('../constants');
const { sendCloudWatchMetrics } = require('./utils/send-metrics');

/**
 * Publishes metrics for documents uploaded.
 * @param  {String} namespace               passed implicitly from CloudWatchContext to reflect the namespace that the metrics are published to.
 * @return {String} caseProcessingStatus    CaseStatus type
 */
class CaseProcessedMetrics {
    async publishMetricsData(namespace, caseProcessingStatus) {
        const caseCount = 1; // one case is processed at a time.
        if (!Object.values(CaseStatus).includes(caseProcessingStatus)) {
            const error = `Provided CaseStatus in publishMetrics method is not supported. Possible values: ${Object.keys(
                CaseStatus
            )}`;
            console.error(error);
            throw new Error(error);
        }

        const params = {
            MetricData: [
                {
                    MetricName: MetricNames.CASE_PROCESSED_STATUS,
                    Dimensions: [
                        { Name: 'CaseStatus', Value: caseProcessingStatus },
                        { Name: 'serviceName', Value: `eDUS-${process.env.UUID}` }
                    ],
                    Timestamp: new Date(),
                    Unit: 'Count',
                    Value: caseCount
                }
            ],
            Namespace: namespace
        };
        const data = await sendCloudWatchMetrics(namespace, params);
        return data;
    }
}

module.exports = { CaseProcessedMetrics };
