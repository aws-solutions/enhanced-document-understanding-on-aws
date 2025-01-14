// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package com.builder.config;

import software.amazon.awssdk.core.client.config.ClientOverrideConfiguration;
import software.amazon.awssdk.core.client.config.SdkAdvancedClientOption;

import static org.junit.jupiter.api.Assertions.assertEquals;

import uk.org.webcompere.systemstubs.environment.EnvironmentVariables;
import org.junit.jupiter.api.extension.ExtendWith;

import com.builder.config.CustomUserAgentConfig;

import uk.org.webcompere.systemstubs.jupiter.SystemStub;
import uk.org.webcompere.systemstubs.jupiter.SystemStubsExtension;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

@ExtendWith(SystemStubsExtension.class)
public class CustomUserAgentConfigTest {
    CustomUserAgentConfig customConfig;

    @SystemStub
    private EnvironmentVariables environmentVariables = new EnvironmentVariables("AWS_SDK_USER_AGENT",
            "AwsSolution/SO999/v9.9.9");

    @Test
    @DisplayName("When testing environment variable setup")
    void testEnvSetup() {
        assertEquals("AwsSolution/SO999/v9.9.9", System.getenv("AWS_SDK_USER_AGENT"));
    }

    @Test
    @DisplayName("When custom ClientConfiguration is successfully returned")
    void testCustomConfig() {
        ClientOverrideConfiguration config = CustomUserAgentConfig.getCustomClientConfiguration();
        // assertEquals(config.useTcpKeepAlive(), Boolean.TRUE);
        assertEquals(config.advancedOption(SdkAdvancedClientOption.USER_AGENT_SUFFIX).get(),
                "AwsSolution/SO999/v9.9.9");
    }
}
