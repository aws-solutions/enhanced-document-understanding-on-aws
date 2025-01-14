/* eslint-disable no-unused-vars */
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const AWSMock = require('aws-sdk-mock');
const { WorkflowEventDetailTypes } = require('common-node-lib');
const EventDispatcher = require('../../event-bridge/event-dispatcher');

jest.mock('common-node-lib');

describe('When publishing an event to the AWS eventbridge', () => {
    AWSMock.mock('EventBridge', 'putEvents', async (err, data) => {
        return 'Success';
    });
    beforeEach(() => {
        process.env.CASE_DDB_TABLE_NAME = 'testTable';
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.EVENT_BUS_ARN = 'fake-arn';
    });

    it('Should successfully publish an event', async () => {
        const response = await EventDispatcher.publishEvent(
            'fake-event-detail',
            WorkflowEventDetailTypes.TRIGGER_WORKFLOW
        );
        expect(response).toEqual('Success');
    });

    it('Should fail to publish an event', async () => {
        // eslint-disable-next-line no-unused-vars
        AWSMock.mock('EventBridge', 'putEvents', async (err, data) => {
            throw new Error('Failed to publish event');
        });
        await expect(
            EventDispatcher.publishEvent('fake-event-detail', WorkflowEventDetailTypes.TRIGGER_WORKFLOW)
        ).rejects.toThrow('Failed to publish event');
    });

    afterEach(() => {
        delete process.env.EVENT_BUS_ARN;
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.CASE_DDB_TABLE_NAME;
        AWSMock.restore('EventBridge');
    });
});
