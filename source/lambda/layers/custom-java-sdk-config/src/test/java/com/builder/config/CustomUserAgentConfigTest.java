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
