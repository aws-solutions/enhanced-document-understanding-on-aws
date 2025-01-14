// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package com.builder.lambda;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.Map;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPResponse;
import com.builder.lambda.utils.ApiRequestProcessor;
import com.builder.lambda.utils.CloudWatchMetrics;
import com.builder.lambda.utils.Constants;
import com.builder.lambda.utils.DependencyFactory;
import com.builder.lambda.utils.LambdaContextParser;
import com.builder.lambda.utils.S3Storage;

import software.amazon.awssdk.services.cloudwatch.CloudWatchClient;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.lambda.powertools.logging.Logging;

/**
 * Lambda handler that redacts documents based on event inputs
 */
public class RedactionApiHandler implements RequestHandler<APIGatewayV2HTTPEvent, APIGatewayV2HTTPResponse> {
    private final S3Client s3Client;
    private final CloudWatchClient cloudWatchClient;

    private Logger log = LogManager.getLogger(RedactionApiHandler.class);

    public RedactionApiHandler() {
        // Initialize the SDK client outside of the handler method so that it can be
        // reused for subsequent invocations.
        // This constructor is run on each cold start.
        s3Client = DependencyFactory.s3Client();
        cloudWatchClient = DependencyFactory.cloudWatchClient();
    }

    @Logging
    @Override
    public APIGatewayV2HTTPResponse handleRequest(final APIGatewayV2HTTPEvent event, final Context context) {
        CloudWatchMetrics cwMetrics = new CloudWatchMetrics(cloudWatchClient);
        S3Storage s3Storage = new S3Storage(this.s3Client, new LambdaContextParser(context));
        ApiRequestProcessor requestProcessor = new ApiRequestProcessor(s3Storage);

        APIGatewayV2HTTPResponse response;
        // This variable is to read the status of this workflow for CloudWatch metric
        String cwRedactDocumentStatus = null;
        // CHECKSTYLE:OFF
        try {
            requestProcessor.process(event);
            response = APIGatewayV2HTTPResponse.builder()
                    .withStatusCode(201)
                    .withHeaders(Map.of(
                            "Access-Control-Allow-Origin", "*",
                            "Content-Type", "application/json",
                            "Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept",
                            "Access-Control-Allow-Methods", "OPTIONS,POST,GET"))
                    .build();
            // Change status to success if no exceptions are thrown during processing
            cwRedactDocumentStatus = Constants.REDACT_DOCUMENT_SUCCESS;
        } catch (IllegalArgumentException e) {
            log.error(e);
            response = APIGatewayV2HTTPResponse.builder()
                    .withStatusCode(400)
                    .withBody(
                            "The provided input failed to be processed due to being badly formatted. Ensure your "
                                    + "request contains at least 1 valid redaction for the requested document, and "
                                    + "that you are invoking the correct API.")
                    .build();
            // Change status to failure if no exceptions are thrown during processing
            cwRedactDocumentStatus = Constants.REDACT_DOCUMENT_FAILURE;
        } catch (FileNotFoundException e) {
            log.error(e);
            response = APIGatewayV2HTTPResponse.builder()
                    .withStatusCode(400)
                    .withBody(
                            "One or more files requested for processing failed to be retrieved. Ensure the provided"
                                    + " case and document IDs are correct.")
                    .build();
            // Change status to failure if no exceptions are thrown during processing
            cwRedactDocumentStatus = Constants.REDACT_DOCUMENT_FAILURE;
        } catch (IOException e) {
            log.error(e);
            response = APIGatewayV2HTTPResponse.builder()
                    .withStatusCode(500)
                    .withBody("An internal error occurred in redaction of requested file.")
                    .build();
            // Change status to failure if no exceptions are thrown during processing
            cwRedactDocumentStatus = Constants.REDACT_DOCUMENT_FAILURE;
        } catch (S3Exception e) {
            log.error(e);
            response = APIGatewayV2HTTPResponse.builder()
                    .withStatusCode(500)
                    .withBody("An internal error occurred in when interacting with S3")
                    .build();
            // Change status to failure if no exceptions are thrown during processing
            cwRedactDocumentStatus = Constants.REDACT_DOCUMENT_FAILURE;
        } catch (Exception e) {
            log.error(e);
            // all errors not specifically handled get this generic 500
            response = APIGatewayV2HTTPResponse.builder()
                    .withStatusCode(500)
                    .withBody("Error occurred in processing the request.")
                    .build();
            // Change status to failure if no exceptions are thrown during processing
            cwRedactDocumentStatus = Constants.REDACT_DOCUMENT_FAILURE;
        } finally {
            // Send metrics to CloudWatch
            if (cwRedactDocumentStatus != null) {
                try {
                    cwMetrics.putMetricsData(cwRedactDocumentStatus);
                    log.info("Published cw metrics to {}.", Constants.NAMESPACE_WORKFLOW_TYPES);
                } catch (Exception e) {
                    log.error("Failed to put metrics data in cloudwatch", e);
                }
            }
        }
        // CHECKSTYLE:ON
        return response;
    }
}
