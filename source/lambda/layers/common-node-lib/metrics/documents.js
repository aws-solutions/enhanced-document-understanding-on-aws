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
