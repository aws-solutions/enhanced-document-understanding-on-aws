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

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import com.builder.lambda.model.EventDataInput;
import com.google.gson.Gson;

import software.amazon.awssdk.services.sfn.SfnClient;
import software.amazon.awssdk.services.sfn.model.SendTaskFailureRequest;
import software.amazon.awssdk.services.sfn.model.SendTaskHeartbeatRequest;
import software.amazon.awssdk.services.sfn.model.SendTaskSuccessRequest;
import software.amazon.lambda.powertools.logging.Logging;

public class StepFunctionConnector {
    Logger log = LogManager.getLogger(StepFunctionConnector.class);
    private SfnClient client;

    /**
     * Constructor allowing injection of existing client
     * 
     * @param client
     */
    public StepFunctionConnector(SfnClient client) {
        this.client = client;
    }

    /**
     * Notifies the step function of a success
     * 
     * @param output    The stringified JSON success response to be sent
     * @param taskToken Step function task token for the execution.
     */
    @Logging
    public void sendTaskSuccess(EventDataInput output, String taskToken) {
        try {
            log.info("Sending success response to Step Function for task token {}", taskToken);
            String outputString = new Gson().toJson(output);
            SendTaskSuccessRequest request = SendTaskSuccessRequest.builder().output(outputString).taskToken(taskToken)
                    .build();
            this.client.sendTaskSuccess(request);
            // CHECKSTYLE:OFF
        } catch (Exception e) {
            log.error("Sending success failed with {}, attempting to send failure status", e.getMessage());
            sendTaskFailure(e, taskToken);
        }
        // CHECKSTYLE:ON
    }

    /**
     * Notifies the step function of a failure
     * 
     * @param error     The exception caught which caused failure.
     * @param taskToken Step function task token for the execution.
     */
    @Logging
    public void sendTaskFailure(Exception error, String taskToken) {
        log.info("Sending failure response to Step Function for task token {}", taskToken);
        SendTaskFailureRequest request = SendTaskFailureRequest.builder().cause(error.getMessage())
                .error(error.toString()).taskToken(taskToken).build();
        this.client.sendTaskFailure(request);
    }

    /**
     * Notifies the step function of life
     * 
     * @param taskToken Step function task token for the execution.
     */
    @Logging
    public void sendTaskHeartbeat(String taskToken) {
        log.info("Sending heartbeat to Step Function for task token {}", taskToken);
        SendTaskHeartbeatRequest request = SendTaskHeartbeatRequest.builder().taskToken(taskToken).build();
        this.client.sendTaskHeartbeat(request);
    }
}
