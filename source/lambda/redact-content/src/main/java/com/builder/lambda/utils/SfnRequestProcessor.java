// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
package com.builder.lambda.utils;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import software.amazon.awssdk.services.s3.model.Tag;
import software.amazon.lambda.powertools.logging.Logging;

import com.amazonaws.services.lambda.runtime.events.SQSEvent;
import com.amazonaws.services.lambda.runtime.events.SQSEvent.SQSMessage;
import com.amazonaws.util.IOUtils;
import com.builder.lambda.model.BoundingBox;
import com.builder.lambda.model.Document;
import com.builder.lambda.model.EntityDetails;
import com.builder.lambda.model.EventDataBody;
import com.builder.lambda.model.FileType;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

public class SfnRequestProcessor extends RequestProcessor<SQSEvent> {
    private final StepFunctionConnector sfn;
    private final CloudWatchMetrics cwMetrics;

    public SfnRequestProcessor(StepFunctionConnector sfn, S3Storage s3Storage, CloudWatchMetrics cwMetrics) {
        super(s3Storage);
        this.sfn = sfn;
        this.cwMetrics = cwMetrics;
    }

    /**
     * Lambda handler calls this method and passes in the SQS Event which triggered
     * it.
     * This method goes through the received records and performs redaction as
     * specified.
     *
     * @param sqsMessageEvent
     */
    @Logging
    @Override
    public void process(SQSEvent sqsMessageEvent) {
        log.info("Processing SQS Event");
        for (SQSMessage message : sqsMessageEvent.getRecords()) {
            EventDataBody parsedBody = new Gson().fromJson(message.getBody(), EventDataBody.class);
            String taskToken = parsedBody.getTaskToken();

            // This variable is to read the status of this workflow for CloudWatch metric
            String cwRedactDocumentStatus = null;

            try {
                sfn.sendTaskHeartbeat(taskToken);

                // Load the document from S3
                String s3Key = parsedBody.getInput().getDocument().getS3Prefix();
                FileType fileType = FileUtils.getFileType(s3Key); // will throw for unsupported file type
                String extension = FileUtils.getFileExtension(s3Key);

                log.info("Processing input at bucket: {}, key: {}, and task token {}", s3InputBucketName, s3InputPrefix,
                        taskToken);

                // Parsed redact data map
                Map<String, Map<String, Map<String, Map<String, List<EntityDetails>>>>> parsedRedactDataMap = this
                        .getParsedRedactDataMap(parsedBody.getInput().getInferences());
                // Map bounding-boxes by page
                Map<String, List<BoundingBox>> boundingBoxesByPage = this
                        .getBoundingBoxesByPage(parsedRedactDataMap);
                Document document = new Document(s3.getFile(s3InputBucketName, s3Key), fileType,
                        parsedBody.getInput().getDocument().getCaseId(), parsedBody.getInput().getDocument().getId());

                // get the tags
                List<Tag> tags = s3.getObjectTags(s3InputBucketName, s3Key);

                // redact and upload back to s3
                Redactor redactor = this.getRedactor(fileType);
                ByteArrayOutputStream redactedDoc = redactor.processDocument(document, boundingBoxesByPage);
                String outputKey = String.format("%s/%s/%s-redacted.%s", s3OutputPrefix,
                        parsedBody.getInput().getDocument().getCaseId(),
                        parsedBody.getInput().getDocument().getId(), extension);
                s3.putFile(s3InputBucketName, outputKey, redactedDoc);

                // copy over the tags
                s3.setObjectTags(s3InputBucketName, outputKey, tags);

                // Sends the payload back to the step function as-is to mark success
                sfn.sendTaskSuccess(parsedBody.getInput(), taskToken);

                // Change status to success if no exceptions are thrown during processing
                cwRedactDocumentStatus = Constants.REDACT_DOCUMENT_SUCCESS;

                // CHECKSTYLE:OFF
            } catch (Exception e) {
                log.error(e);
                sfn.sendTaskFailure(e, taskToken);

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
        }
    }

    /**
     * This method extract bounding box information for each page
     * and combine them all together in a map with the page number.
     *
     * @param parsedRedactDataMap mapped redact-data
     * @return a map of bounding boxes paired with the page number
     */
    @SuppressWarnings("java:S1602") // this rule attempts to force removal of curly braces on nested lambdas, which
    // makes it less readable and more error prone.
    private Map<String, List<BoundingBox>> getBoundingBoxesByPage(
            Map<String, Map<String, Map<String, Map<String, List<EntityDetails>>>>> parsedRedactDataMap) {

        Map<String, List<BoundingBox>> boundingBoxesByPage = new HashMap<>();

        parsedRedactDataMap.forEach((comprehendType, redactData) -> {// (eg. entityType="entity-standard",
            // redactData={})
            // NOSONAR - documentation // (eg. entityType="DATE" and entries={})
            redactData.forEach((entityType, entries) -> {
                // NOSONAR - documentation // (eg. entity="10/23/20, 3:28 PM" and pages={}
                entries.forEach((entity, pages) -> {
                    pages.forEach((pageNumber, entityDetails) -> {
                        // collect the bounding boxes for the entities specified
                        List<BoundingBox> currentBoundingBoxes = new ArrayList<>();
                        for (EntityDetails currentEntity : entityDetails) {
                            currentBoundingBoxes.addAll(currentEntity.getBoundingBoxes());
                        }

                        if (!boundingBoxesByPage.containsKey(pageNumber)) {
                            boundingBoxesByPage.put(pageNumber, currentBoundingBoxes);
                        } else {
                            List<BoundingBox> updatedPageBoundingBoxes = boundingBoxesByPage.get(pageNumber);
                            updatedPageBoundingBoxes.addAll(currentBoundingBoxes);
                            boundingBoxesByPage.put(pageNumber, updatedPageBoundingBoxes);
                        }
                    });
                });
            });
        });
        return boundingBoxesByPage;
    }

    /**
     * This method filters the correct inferences ending with `-locations` to use
     * them
     * as S3-key to get the redact-data for each.
     *
     * @param inferences sqs event inferences
     * @return a map of redact-data
     */
    @Logging
    private Map<String, Map<String, Map<String, Map<String, List<EntityDetails>>>>> getParsedRedactDataMap(
            Map<String, String> inferences) {
        Map<String, Map<String, Map<String, Map<String, List<EntityDetails>>>>> redactDataMap = new HashMap<>();
        inferences.keySet()
                .stream()
                .filter(inferenceKey -> inferenceKey.endsWith("-locations"))
                .forEach(inferenceKey -> {
                    String comprehendType = inferenceKey.substring(0, inferenceKey.indexOf("-locations"));
                    try {
                        redactDataMap.put(comprehendType, getDataToRedact(inferences.get(inferenceKey)));
                    } catch (IOException e) {
                        // failure to retrieve an entity locations result means we continue to the next
                        // one
                        log.warn("Failed to retrieve the inference {}, Skipping.", inferences.get(inferenceKey));
                        return;
                    }

                });
        return redactDataMap;
    }

    /**
     * This method parses the JSON to retrieve the data to redact
     *
     * @param s3Key file key
     * @return redact data to be used to determine the entity location
     * @throws IOException if data parsing fails
     */
    private Map<String, Map<String, Map<String, List<EntityDetails>>>> getDataToRedact(String s3Key)
            throws IOException {
        try (InputStream s3ResponseIS = s3.getFile(s3InferenceBucketName, s3Key)) {
            String redactedDataString = IOUtils.toString(s3ResponseIS);
            return new Gson().fromJson(redactedDataString,
                    new TypeToken<Map<String, Map<String, Map<String, List<EntityDetails>>>>>() {
                    }.getType());
        } catch (IOException ioException) {
            log.error("Failed to parse redact data for the key {}", s3Key);
            throw ioException;
        }
    }
}
