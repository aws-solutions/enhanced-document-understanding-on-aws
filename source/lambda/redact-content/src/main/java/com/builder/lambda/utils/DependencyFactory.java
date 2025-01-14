// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
