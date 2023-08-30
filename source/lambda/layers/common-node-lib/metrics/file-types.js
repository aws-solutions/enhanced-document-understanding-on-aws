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

const { SupportedFileTypes, MetricNames } = require('../constants');
const { sendCloudWatchMetrics } = require('./utils/send-metrics');
/**
 * Publishes metrics for file types uploaded.
 * @param  {String} namespace               passed implicitly from CloudWatchContext to reflect the namespace that the metrics are published to.
 * @return {String} fileType                file extension, such as 'pdf', 'jpg', 'jpeg' or 'png'
 * @return {Integer} filesProcessedCount    optional param for count of files of 'fileType' extension that were uploaded
 */
class FileTypeMetrics {
    async publishMetricsData(namespace, fileType, filesProcessedCount = 1) {
        if (!Object.values(SupportedFileTypes).includes(fileType)) {
            const error = `Provided File Extension Type in publishMetrics method is not supported. Possible values: ${Object.keys(
                SupportedFileTypes
            )}`;

            console.error(error);
            throw new Error(error);
        }

        if (fileType == SupportedFileTypes.JPEG || fileType == SupportedFileTypes.JPG) {
            fileType = 'jpeg/jpg';
        }

        const params = {
            MetricData: [
                {
                    MetricName: MetricNames.FILE_TYPES,
                    Dimensions: [
                        { Name: 'FileTypesUploaded', Value: fileType },
                        { Name: 'serviceName', Value: `eDUS-${process.env.UUID}` }
                    ],
                    Timestamp: new Date(),
                    Unit: 'Count',
                    Value: filesProcessedCount
                }
            ],
            Namespace: namespace
        };
        const data = await sendCloudWatchMetrics(namespace, params);
        return data;
    }
}

module.exports = { FileTypeMetrics };
