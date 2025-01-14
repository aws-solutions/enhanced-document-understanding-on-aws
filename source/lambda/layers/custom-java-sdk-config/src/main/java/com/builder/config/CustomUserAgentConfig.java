// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package com.builder.config;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import software.amazon.lambda.powertools.logging.Logging;
import software.amazon.lambda.powertools.tracing.Tracing;
import software.amazon.awssdk.core.client.config.ClientOverrideConfiguration;
import software.amazon.awssdk.core.client.config.SdkAdvancedClientOption;

/**
 * A class that creates custom ClientConfiguration for AWS SDK calls. It adds
 * the user-agent string to the configuration and also sets the TCP connection
 * to be kept alive to reduce the network handshake overhead and use the same
 * connection for subsequent calls.
 */
public class CustomUserAgentConfig {
    /*
     * Custom ClientConfiguration object
     */
    private static ClientOverrideConfiguration customClientConfiguration;

    Logger log = LogManager.getLogger();

    /**
     * Static initializers are thread-safe and hence using a static initializer to
     * create an instance of ClientConfiguration and setting AWS Solutions
     * User-Agent string and TCP connection Keep-Alive to true.
     */
    static {
        if (customClientConfiguration == null) {
            customClientConfiguration = ClientOverrideConfiguration.builder()
                    .putAdvancedOption(SdkAdvancedClientOption.USER_AGENT_SUFFIX, System.getenv("AWS_SDK_USER_AGENT"))
                    .build();
        }
    }

    private CustomUserAgentConfig() {
        // empty construct for singleton pattern. Object initialized through static
        // initializer for thread safety
    }

    /**
     * Method to retrieve custom ClientConfiguration
     * 
     * @return ClientConfiguration that has AWS Solutions User Agent string and TCP
     *         Keep Alive set to true
     */
    @Logging
    @Tracing(segmentName = "custom-user-agent")
    public static ClientOverrideConfiguration getCustomClientConfiguration() {
        return customClientConfiguration;
    }
}
