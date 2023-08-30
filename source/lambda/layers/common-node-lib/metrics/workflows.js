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
