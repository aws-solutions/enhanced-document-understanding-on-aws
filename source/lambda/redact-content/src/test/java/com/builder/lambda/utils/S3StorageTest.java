// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package com.builder.lambda.utils;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

import com.amazonaws.services.lambda.runtime.Context;

import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectTaggingRequest;
import software.amazon.awssdk.services.s3.model.GetObjectTaggingResponse;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectTaggingRequest;
import software.amazon.awssdk.services.s3.model.PutObjectTaggingResponse;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.model.Tag;

import java.io.ByteArrayOutputStream;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mockStatic;

class S3StorageTest {
    private static S3Client mockedClient;
    private static S3Storage s3Storage;
    private static MockedStatic<LogManager> mockLogManager;
    private static Context mockContext;
    private static LambdaContextParser lambdaContextParser;

    final static String testBucketName = "test-bucket";
    final static String testKey = "test-key";

    @BeforeAll
    public static void setUp() {
        mockedClient = mock(S3Client.class);
        mockContext = mock(Context.class);
        when(mockContext.getInvokedFunctionArn())
                .thenReturn("arn:aws:lambda:us-east-1:123456789012:function:my-function");

        lambdaContextParser = new LambdaContextParser(mockContext);
        s3Storage = new S3Storage(mockedClient, lambdaContextParser);

        // mocking the logger
        mockLogManager = mockStatic(LogManager.class);
        final Logger logger = mock(Logger.class);
        mockLogManager.when(() -> LogManager.getLogger(any(Class.class))).thenReturn(logger);
    }

    @BeforeEach
    public void clear() throws Exception {
        clearInvocations(mockedClient);
    }

    @AfterAll
    public static void tearDown() throws Exception {
        mockLogManager.close();
    }

    @Test
    public void testGetFileSuccessfully() throws Exception {
        final ResponseInputStream responseInputStream = mock(ResponseInputStream.class);
        when(mockedClient.getObject(any(GetObjectRequest.class))).thenReturn(responseInputStream);
        InputStream result = s3Storage.getFile(testBucketName, testKey);
        assertEquals(responseInputStream, result);
        verify(mockedClient, times(1)).getObject(any(GetObjectRequest.class));
    }

    @Test
    public void testGetFileShouldThrowError() throws Exception {
        doThrow(S3Exception.class).when(mockedClient).getObject(any(GetObjectRequest.class));
        assertThrows(FileNotFoundException.class, () -> s3Storage.getFile(testBucketName, testKey));
    }

    @Test
    public void testPutFileShouldBeSuccessful() throws Exception {
        final PutObjectRequest putObjectRequest = mock(PutObjectRequest.class);
        final PutObjectResponse putObjectResponse = mock(PutObjectResponse.class);
        final RequestBody requestBody = mock(RequestBody.class);
        when(mockedClient.putObject(putObjectRequest, requestBody)).thenReturn(putObjectResponse);
        s3Storage.putFile(testBucketName, testKey, new ByteArrayOutputStream());
        verify(mockedClient, times(1)).putObject(
                any(PutObjectRequest.class),
                any(RequestBody.class));

    }

    @Test
    public void testPutFileShouldThrowError() throws Exception {
        doThrow(S3Exception.class).when(mockedClient).putObject(any(PutObjectRequest.class), any(RequestBody.class));
        assertThrows(S3Exception.class, () -> s3Storage.putFile(
                testBucketName,
                testKey,
                new ByteArrayOutputStream()));
    }

    @Test
    public void testListFilesSuccessfully() throws Exception {
        final ListObjectsV2Response listResponse = mock(ListObjectsV2Response.class);
        when(mockedClient.listObjectsV2(any(ListObjectsV2Request.class))).thenReturn(listResponse);
        s3Storage.listObjects(testBucketName, testKey);
        verify(mockedClient, times(1)).listObjectsV2(any(ListObjectsV2Request.class));
    }

    @Test
    public void testListFilesShouldThrowError() throws Exception {
        doThrow(S3Exception.class).when(mockedClient).listObjectsV2(any(ListObjectsV2Request.class));
        assertThrows(S3Exception.class, () -> s3Storage.listObjects(testBucketName, testKey));
    }

    @Test
    public void testGetObjectTagsShouldBeSuccessful() throws Exception {
        final GetObjectTaggingResponse getObjectTaggingResponse = mock(GetObjectTaggingResponse.class);

        when(mockedClient.getObjectTagging(any(GetObjectTaggingRequest.class))).thenReturn(getObjectTaggingResponse);
        List<Tag> response = s3Storage.getObjectTags(testBucketName, testKey);
        assertEquals(getObjectTaggingResponse.tagSet(), response);
        verify(mockedClient, times(1)).getObjectTagging(any(GetObjectTaggingRequest.class));
    }

    @Test
    public void testSetObjectTagsShouldBeSuccessful() throws Exception {
        final List<Tag> tags = new ArrayList<>();
        final PutObjectTaggingResponse putObjectTaggingResponse = mock(PutObjectTaggingResponse.class);
        final PutObjectTaggingRequest putObjectTaggingRequest = mock(PutObjectTaggingRequest.class);
        when(mockedClient.putObjectTagging(any(PutObjectTaggingRequest.class))).thenReturn(putObjectTaggingResponse);

        s3Storage.setObjectTags(testBucketName, testKey, tags);
        verify(mockedClient, times(1)).putObjectTagging(any(PutObjectTaggingRequest.class));
    }
}