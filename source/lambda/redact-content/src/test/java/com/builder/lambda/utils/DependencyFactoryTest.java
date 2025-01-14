// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package com.builder.lambda.utils;

import org.junit.jupiter.api.Test;

import software.amazon.awssdk.core.SdkSystemSetting;
import software.amazon.awssdk.services.cloudwatch.CloudWatchClient;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.sfn.SfnClient;
import uk.org.webcompere.systemstubs.environment.EnvironmentVariables;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class DependencyFactoryTest {

    @Test
    public void testGetAmazonS3() throws Exception {
        EnvironmentVariables environmentVariables = new EnvironmentVariables(
                SdkSystemSetting.AWS_REGION.environmentVariable(), "fake-region");
        environmentVariables.execute(() -> {
            S3Client s3Client = DependencyFactory.s3Client();
            assertNotNull(s3Client, "S3 client instance should not be null");
        });
    }

    @Test
    public void testGetSfnClient() throws Exception {
        EnvironmentVariables environmentVariables = new EnvironmentVariables(
                SdkSystemSetting.AWS_REGION.environmentVariable(), "fake-region");
        environmentVariables.execute(() -> {
            SfnClient sfnClient = DependencyFactory.sfnClient();
            assertNotNull(sfnClient, "StepFunction client instance should not be null");
        });
    }

    @Test
    public void testGetCloudWatchClient() throws Exception {
        EnvironmentVariables environmentVariables = new EnvironmentVariables(
                SdkSystemSetting.AWS_REGION.environmentVariable(), "fake-region");
        environmentVariables.execute(() -> {
            CloudWatchClient cloudWatchClient = DependencyFactory.cloudWatchClient();
            assertNotNull(cloudWatchClient, "CloudWatch client instance should not be null");
        });
    }
}