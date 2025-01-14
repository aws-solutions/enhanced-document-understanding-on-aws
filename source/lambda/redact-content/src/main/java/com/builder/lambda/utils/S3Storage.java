// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package com.builder.lambda.utils;

import java.io.ByteArrayOutputStream;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.util.List;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectTaggingRequest;
import software.amazon.awssdk.services.s3.model.GetObjectTaggingResponse;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectTaggingRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.model.S3Object;
import software.amazon.awssdk.services.s3.model.Tag;
import software.amazon.lambda.powertools.logging.Logging;

/**
 * This class connects to Amazon S3 storage service to get and upload files.
 */
public class S3Storage {

    Logger log = LogManager.getLogger(S3Storage.class);
    private final S3Client client;

    private final LambdaContextParser lambdaContextParser;

    /**
     * Constructor to inject existing client
     *
     * @param client
     */
    public S3Storage(S3Client client, LambdaContextParser lambdaContextParser) {
        this.client = client;
        this.lambdaContextParser = lambdaContextParser;
    }

    /**
     * This method is to get a file from S3 using provided bucketName and s3Key
     *
     * @param bucketName - location of the file in Amazon s3
     * @param s3Key      - file key
     * @return - the desired file as an {@link InputStream}.
     * @throws FileNotFoundException if it fails to get the file
     */
    @Logging
    public InputStream getFile(String bucketName, String s3Key) throws FileNotFoundException {
        try {
            log.info("Getting file from S3 with bucket: {}, s3Key: {}", bucketName, s3Key);
            GetObjectRequest getObjectRequest = GetObjectRequest
                    .builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .expectedBucketOwner(this.lambdaContextParser.getInvocationAccountId())
                    .build();
            return client.getObject(getObjectRequest);
        } catch (S3Exception s3Exception) {
            String errMsg = String.format(
                    "Failed to get the file from S3 with bucket: %s, s3Key: %s",
                    bucketName,
                    s3Key);
            log.error(errMsg);
            throw new FileNotFoundException(errMsg);
        }
    }

    /**
     * Lists all objects matching a given prefix in a bucket
     *
     * @param bucketName - location of the file in Amazon s3
     * @param prefix     - prefix of the files we are looking for
     * @return - the desired file as an {@link InputStream}.
     * @throws S3Exception - if it fails to list
     */
    @Logging
    public List<S3Object> listObjects(String bucketName, String prefix) throws S3Exception {
        try {
            log.info("Listing files from S3 with bucket: {}, prefix: {}", bucketName, prefix);
            ListObjectsV2Request request = ListObjectsV2Request
                    .builder()
                    .bucket(bucketName)
                    .prefix(prefix)
                    .expectedBucketOwner(this.lambdaContextParser.getInvocationAccountId())
                    .build();
            return client.listObjectsV2(request).contents();
        } catch (S3Exception s3Exception) {
            log.error("Failed to list objects from S3 with bucket: {}, prefix: {}", bucketName, prefix);
            throw s3Exception;
        }
    }

    /**
     * This method is to upload a file in the S3 bucket using
     * provided buckName, s3Key and file
     *
     * @param bucketName   - where in S3 file to be uploaded
     * @param s3Key        - file key
     * @param fileToUpload - input file to be uploaded
     * @throws S3Exception - if it fails to upload the file
     */
    @Logging
    public void putFile(String bucketName, String s3Key, ByteArrayOutputStream fileToUpload) throws S3Exception {
        try {
            log.info("Putting  file in S3 with bucket: {}, s3Key: {}", bucketName, s3Key);
            byte[] data = fileToUpload.toByteArray();
            PutObjectRequest objectRequest = PutObjectRequest.builder().bucket(bucketName).key(s3Key)
                    .expectedBucketOwner(this.lambdaContextParser.getInvocationAccountId()).build();
            client.putObject(objectRequest, RequestBody.fromBytes(data));
        } catch (S3Exception s3Exception) {
            log.error("Failed to upload the file in S3 with bucket: {}, s3Key: {}", bucketName, s3Key);
            throw s3Exception;
        }
    }

    /**
     * Retrieve the tags for a given object stored in a s3 bucket
     *
     * @param bucketName
     * @param s3Key
     * @return
     * @throws S3Exception
     */
    @Logging
    public List<Tag> getObjectTags(String bucketName, String s3Key) throws S3Exception {
        try {
            log.info("Getting object tags from S3 with bucket: {}, s3Key: {}", bucketName, s3Key);
            GetObjectTaggingRequest objectRequest = GetObjectTaggingRequest
                    .builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .expectedBucketOwner(this.lambdaContextParser.getInvocationAccountId())
                    .build();

            GetObjectTaggingResponse tags = this.client.getObjectTagging(objectRequest);
            return tags.tagSet();
        } catch (S3Exception s3Exception) {
            log.error(
                    "Failed to get object tags: S3 bucket: {}, s3Key: {}\n Error message: {}",
                    bucketName,
                    s3Key,
                    s3Exception.awsErrorDetails().errorMessage());
            throw s3Exception;
        }
    }

    /**
     * Add a list of tags to an object stored in s3
     *
     * @param bucketName
     * @param s3Key
     * @param tags
     * @throws S3Exception
     */
    @Logging
    public void setObjectTags(String bucketName, String s3Key, List<Tag> tags) throws S3Exception {
        try {
            log.info("Setting object tags in S3 with bucket: {}, s3Key: {}", bucketName, s3Key);
            client.putObjectTagging(
                    PutObjectTaggingRequest.builder().bucket(bucketName).key(s3Key).tagging(tag -> tag.tagSet(tags))
                            .expectedBucketOwner(this.lambdaContextParser.getInvocationAccountId())
                            .build());
        } catch (S3Exception s3Exception) {
            log.error(
                    "Failed to set object tags: S3 bucket: {}, s3Key: {}\n Error message: {}",
                    bucketName,
                    s3Key,
                    s3Exception.awsErrorDetails().errorMessage());
            throw s3Exception;
        }
    }
}
