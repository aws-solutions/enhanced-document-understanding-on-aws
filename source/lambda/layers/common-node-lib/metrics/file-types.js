// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
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
