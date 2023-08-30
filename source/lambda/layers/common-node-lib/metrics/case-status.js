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
