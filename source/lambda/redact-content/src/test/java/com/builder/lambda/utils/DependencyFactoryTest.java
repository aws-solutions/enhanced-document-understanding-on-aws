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
**********************************************************************************************************************/

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