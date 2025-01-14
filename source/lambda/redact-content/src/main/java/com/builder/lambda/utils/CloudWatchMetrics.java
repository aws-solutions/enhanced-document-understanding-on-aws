// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package com.builder.lambda.utils;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import software.amazon.awssdk.services.cloudwatch.CloudWatchClient;
import software.amazon.awssdk.services.cloudwatch.model.CloudWatchException;
import software.amazon.awssdk.services.cloudwatch.model.Dimension;
import software.amazon.awssdk.services.cloudwatch.model.MetricDatum;
import software.amazon.awssdk.services.cloudwatch.model.PutMetricDataRequest;
import software.amazon.awssdk.services.cloudwatch.model.StandardUnit;
import software.amazon.lambda.powertools.logging.Logging;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

public class CloudWatchMetrics {
    Logger log = LogManager.getLogger(CloudWatchMetrics.class);
    private final CloudWatchClient cloudWatchClient;

    /**
     * Constructor to inject existing client
     *
     * @param cloudWatchClient - Existing client to be injected.
     */
    public CloudWatchMetrics(CloudWatchClient cloudWatchClient) {
        this.cloudWatchClient = cloudWatchClient;
    }

    /**
     * This method is used to put the data point for the number of invocations
     * of the given api. The data point is put for every invocation.The data
     * point is put in the namespace {@link Constants#NAMESPACE_WORKFLOW_TYPES}
     *
     * @param apiName - Name of the api for which the data point is to be put.
     */
    @Logging
    public void putMetricsData(String apiName) throws CloudWatchException {
        // Build dimension for the metric.
        Dimension dimension = Dimension.builder()
                .name(Constants.DIMENSION_NAME)
                .value(apiName)
                .build();

        // Build metric data for the metric data point.
        MetricDatum datum = MetricDatum.builder()
                .metricName(Constants.METRIC_NAME)
                .unit(StandardUnit.COUNT)
                .value(Constants.METRICS_DATA_COUNT)
                .timestamp(getCurrentTimeInstant())
                .dimensions(dimension).build();

        // Build request to put the metric data.
        PutMetricDataRequest request = PutMetricDataRequest.builder()
                .namespace(Constants.NAMESPACE_WORKFLOW_TYPES)
                .metricData(datum).build();

        cloudWatchClient.putMetricData(request);
    }

    /**
     * Gets the current time in UTC.
     *
     * @return - Current time in UTC as an instant.
     */
    private Instant getCurrentTimeInstant() {
        String time = ZonedDateTime.now(ZoneOffset.UTC).format(DateTimeFormatter.ISO_INSTANT);
        return Instant.parse(time);
    }
}