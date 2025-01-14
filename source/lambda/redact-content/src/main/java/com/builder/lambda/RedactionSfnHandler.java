// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package com.builder.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.SQSEvent;
import com.builder.lambda.utils.CloudWatchMetrics;
import com.builder.lambda.utils.DependencyFactory;
import com.builder.lambda.utils.LambdaContextParser;
import com.builder.lambda.utils.S3Storage;
import com.builder.lambda.utils.SfnRequestProcessor;
import com.builder.lambda.utils.StepFunctionConnector;

import software.amazon.awssdk.services.cloudwatch.CloudWatchClient;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.sfn.SfnClient;
import software.amazon.lambda.powertools.logging.Logging;

/**
 * Lambda handler that redacts documents based on event inputs
 */
public class RedactionSfnHandler implements RequestHandler<SQSEvent, Void> {
    private final S3Client s3Client;
    private final SfnClient sfnClient;
    private final CloudWatchClient cwClient;

    public RedactionSfnHandler() {
        // Initialize the SDK client outside of the handler method so that it can be
        // reused for subsequent invocations.
        // This constructor is run on each cold start.
        s3Client = DependencyFactory.s3Client();
        sfnClient = DependencyFactory.sfnClient();
        cwClient = DependencyFactory.cloudWatchClient();
    }

    @Logging
    @Override
    public Void handleRequest(final SQSEvent event, final Context context) {

        // get invokedFunctionArn from the context, parse to get the account ID, then
        // send to the sfnRequestProcessor
        SfnRequestProcessor requestProcessor = new SfnRequestProcessor(
                new StepFunctionConnector(sfnClient),
                new S3Storage(s3Client, new LambdaContextParser(context)),
                new CloudWatchMetrics(cwClient));
        requestProcessor.process(event);
        return null;
    }
}
