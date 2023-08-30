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

package com.builder.lambda.utils;

import com.builder.config.CustomUserAgentConfig;

import software.amazon.awssdk.auth.credentials.EnvironmentVariableCredentialsProvider;
import software.amazon.awssdk.core.SdkSystemSetting;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cloudwatch.CloudWatchClient;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.sfn.SfnClient;

/**
 * The module containing all AWS dependencies required by the {@link App}.
 * Statically initializes clients for us to be reused on subsequent lambda
 * invocations.
 */
public class DependencyFactory {

    /**
     * Hides the default public constructor.
     */
    private DependencyFactory() {
    }

    /**
     * @return an instance of S3Client
     */
    public static S3Client s3Client() {
        return S3Client.builder()
                .overrideConfiguration(CustomUserAgentConfig.getCustomClientConfiguration())
                .region(Region.of(System.getenv(SdkSystemSetting.AWS_REGION.environmentVariable())))
                .credentialsProvider(EnvironmentVariableCredentialsProvider.create())
                .build();
    }

    /**
     * @return an instance of SfnClient
     */
    public static SfnClient sfnClient() {
        return SfnClient.builder()
                .overrideConfiguration(CustomUserAgentConfig.getCustomClientConfiguration())
                .region(Region.of(System.getenv(SdkSystemSetting.AWS_REGION.environmentVariable())))
                .credentialsProvider(EnvironmentVariableCredentialsProvider.create())
                .build();
    }

    /**
     * @return an instance of CloudWatchClient
     */
    public static CloudWatchClient cloudWatchClient() {
        return CloudWatchClient.builder()
                .overrideConfiguration(CustomUserAgentConfig.getCustomClientConfiguration())
                .region(Region.of(System.getenv(SdkSystemSetting.AWS_REGION.environmentVariable())))
                .credentialsProvider(EnvironmentVariableCredentialsProvider.create())
                .build();
    }
}
