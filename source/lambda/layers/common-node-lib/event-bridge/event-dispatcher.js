// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const AWS = require('aws-sdk');
const CustomConfig = require('aws-node-user-agent-config');

const { EventSources } = require('./../constants');

/**
 * Publish an event to the the custom event bus with the ARN as defined with
 * the `EVENT_BUS_ARN` environment variable.
 *
 * @param {Object} eventDetail an object which will be stringified and put in the event
 * @param {string} eventDetailType the detailType, used by listeners to determine which events to pick up
 *
 */
const publishEvent = async (eventDetail, eventDetailType) => {
    const awsCustomConfig = CustomConfig.customAwsConfig();
    const eventBridge = new AWS.EventBridge(awsCustomConfig);
    const eventString = JSON.stringify(eventDetail);

    const putEventsParams = {
        Entries: [
            {
                Detail: eventString,
                DetailType: eventDetailType,
                EventBusName: process.env.EVENT_BUS_ARN,
                Source: `${EventSources.WORKFLOW_ORCHESTRATOR}.${process.env.APP_NAMESPACE}`
            }
        ]
    };

    const response = await eventBridge.putEvents(putEventsParams).promise();
    return response;
};

module.exports = { publishEvent };
