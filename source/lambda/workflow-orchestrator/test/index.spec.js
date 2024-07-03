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

'use strict';

const index = require('../index.js');
const S3Trigger = require('../utils/s3-event-trigger');
const SharedLib = require('common-node-lib');
const _ = require('lodash');

jest.mock('../utils/s3-event-trigger');
jest.mock('common-node-lib');
const kendra = require('../utils/kendra-upload');
const { failureEvent } = require('./event-test-data.js');
jest.mock('../utils/kendra-upload');

describe('When processing a Sfn event from the custom event bus', () => {
    let publishMetricsSpy, uploadToKendraIndexSpy, publishEventSpy, updateCaseStatusSpy;

    beforeAll(() => {
        jest.spyOn(S3Trigger, 'parseFileKey').mockImplementation(() => {
            return {
                caseId: 'fake-case',
                uploadPrefix: 'initial',
                fileName: 'doc-id.txt'
            };
        });
        updateCaseStatusSpy = jest.spyOn(SharedLib, 'updateCaseStatus');
        publishMetricsSpy = jest
            .spyOn(SharedLib.CloudWatchMetrics.prototype, 'publishMetrics')
            .mockImplementation(() => {
                return 'success';
            });

        publishEventSpy = jest.spyOn(SharedLib, 'publishEvent').mockImplementation(async (detail, detailType) => {
            return 'success';
        });
    });

    beforeEach(() => {
        process.env.CASE_DDB_TABLE_NAME = 'testTable';
        process.env.WORKFLOW_CONFIG_TABLE_NAME = 'fake-workflow-config-table';
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customerAgent": "fakedata" }';
        process.env.EVENT_BUS_ARN = 'mock-arn';
        process.env.S3_UPLOAD_PREFIX = 'initial';
        process.env.APP_NAMESPACE = 'app.idp';
        process.env.KENDRA_ROLE_ARN = 'fake-arn';
    });

    it('Should successfully generate a new SfnEvent', async () => {
        const mockSfnEvent = {
            detail: {
                case: {
                    id: 'fake-case-id-2',
                    status: 'success',
                    stage: 'textract',
                    workflows: ['textract', 'classification', 'entity-pii'],
                    documentList: [
                        {
                            'stage': 'classification',
                            'inferences': {},
                            'document': {
                                'id': 'fake-doc-id-1',
                                'selfCertifiedDocType': 'passport',
                                's3Prefix': 's3-prefix',
                                'processingType': 'sync'
                            }
                        }
                    ]
                }
            },
            source: `${SharedLib.EventSources.WORKFLOW_STEPFUNCTION}.${process.env.APP_NAMESPACE}`
        };

        const mockContext = {
            invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:my-function'
        };

        const expectedNextEvent = _.cloneDeep(mockSfnEvent);
        (expectedNextEvent.detail.case.status = 'initiate'), (expectedNextEvent.detail.case.stage = 'classification');

        const publishEventSpy = jest.spyOn(SharedLib, 'publishEvent').mockImplementation(async (detail, detailType) => {
            return 'success';
        });

        const receivedResponse = await index.generateNextStageEventDetail(mockSfnEvent);
        expect(receivedResponse).toEqual(expectedNextEvent.detail);
        expect(await index.handler(mockSfnEvent, mockContext)).toEqual('success');

        // source is not aws.s3, and success metrics not called as there are workflows to process
        expect(publishMetricsSpy).toHaveBeenCalledTimes(0);
    });

    it('On completion, Should successfully upload to kendra index, publish metrics, update status, and generate event', async () => {
        const mockSfnEvent = {
            detail: {
                case: {
                    id: 'fake-case-id-2',
                    status: 'success',
                    stage: 'entity-pii',
                    workflows: ['textract', 'entity-pii'],
                    documentList: [
                        {
                            'stage': 'classification',
                            'inferences': {},
                            'document': {
                                'id': 'fake-doc-id-1',
                                'selfCertifiedDocType': 'passport',
                                's3Prefix': 's3-prefix',
                                'processingType': 'sync'
                            }
                        }
                    ]
                }
            },
            source: `${SharedLib.EventSources.WORKFLOW_STEPFUNCTION}.${process.env.APP_NAMESPACE}`
        };
        const mockContext = {
            invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:my-function'
        };

        uploadToKendraIndexSpy = jest.spyOn(kendra, 'uploadToKendraIndex');
        process.env.KENDRA_INDEX_ID = 'some-uuid';

        const expectedNextEvent = _.cloneDeep(mockSfnEvent);
        (expectedNextEvent.detail.case.status = 'initiate'), (expectedNextEvent.detail.case.stage = 'classification');

        expect(await index.handler(mockSfnEvent, mockContext)).toEqual('success');

        // source is not aws.s3, but metrics for success called as no next stage post 'entity-pii'
        expect(publishMetricsSpy).toHaveBeenCalledTimes(1);
        expect(uploadToKendraIndexSpy).toHaveBeenCalledTimes(1);
        expect(updateCaseStatusSpy).toHaveBeenCalledTimes(1);
        expect(updateCaseStatusSpy).toHaveBeenCalledWith('fake-case-id-2', SharedLib.CaseStatus.SUCCESS);
    });

    it('On completion, does not upload to kendra if not deployed', async () => {
        const mockSfnEvent = {
            detail: {
                case: {
                    id: 'fake-case-id-2',
                    status: 'success',
                    stage: 'entity-pii',
                    workflows: ['textract', 'entity-pii'],
                    documentList: [
                        {
                            'stage': 'classification',
                            'inferences': {},
                            'document': {
                                'id': 'fake-doc-id-1',
                                'selfCertifiedDocType': 'passport',
                                's3Prefix': 's3-prefix',
                                'processingType': 'sync'
                            }
                        }
                    ]
                }
            },
            source: `${SharedLib.EventSources.WORKFLOW_STEPFUNCTION}.${process.env.APP_NAMESPACE}`
        };
        const mockContext = {
            invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:my-function'
        };

        uploadToKendraIndexSpy = jest.spyOn(kendra, 'uploadToKendraIndex');
        await index.handler(mockSfnEvent, mockContext);
        expect(uploadToKendraIndexSpy).toHaveBeenCalledTimes(0);
    });

    it('Should publish failure metric and status updates on failure', async () => {
        await index.handler(failureEvent);
        expect(publishMetricsSpy).toHaveBeenCalledTimes(1);
        expect(updateCaseStatusSpy).toHaveBeenCalledTimes(1);
        expect(updateCaseStatusSpy).toHaveBeenCalledWith('fake-case', SharedLib.CaseStatus.FAILURE);
    });

    afterEach(() => {
        jest.clearAllMocks();
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.WORKFLOW_CONFIG_TABLE_NAME;
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.EVENT_BUS_ARN;
        delete process.env.S3_UPLOAD_PREFIX;
        delete process.env.APP_NAMESPACE;
        delete process.env.KENDRA_INDEX_ID;
        delete process.env.KENDRA_ROLE_ARN;
    });
});

describe('When processing a PutObject event from S3', () => {
    let updateCaseStatusSpy, uploadToKendraIndexSpy;
    const mockS3Event = {
        'detail': {
            'version': '0',
            'bucket': {
                'name': 'fake-bucket'
            },
            'object': {
                'key': 'initial/fake-case/doc-id.txt',
                'size': 3541,
                'etag': 'fake-tag',
                'sequencer': 'fake-seq-value'
            }
        },
        'detail-type': 'Object Created',
        'source': 'aws.s3'
    };

    const mockContext = {
        invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:my-function'
    };

    beforeAll(() => {
        jest.spyOn(S3Trigger, 'parseFileKey').mockImplementation(() => {
            return {
                caseId: 'fake-case',
                uploadPrefix: 'initial',
                fileName: 'doc-id.txt'
            };
        });
        updateCaseStatusSpy = jest.spyOn(SharedLib, 'updateCaseStatus');
    });

    beforeEach(() => {
        process.env.CASE_DDB_TABLE_NAME = 'testTable';
        process.env.WORKFLOW_CONFIG_TABLE_NAME = 'fake-workflow-config-table';
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.EVENT_BUS_ARN = 'mock-arn';
        process.env.S3_UPLOAD_PREFIX = 'initial';
        process.env.APP_NAMESPACE = 'app.idp';
        process.env.KENDRA_ROLE_ARN = 'fake-arn';
    });

    it('should successfully not dispatch an event to trigger a workflow from an s3 upload event', async () => {
        const createEventSpy = jest.spyOn(S3Trigger, 'generateSfnEventDetail').mockImplementation(async (params) => {
            return {
                case: {
                    id: 'fake-case',
                    status: SharedLib.WorkflowStatus.INITIATE,
                    stage: 'fake-workflow1',
                    workflows: ['fake-workflow1', ['fake-workflow2']],
                    documentList: ['doc-id.txt']
                }
            };
        });

        const publishEventSpy = jest.spyOn(SharedLib, 'publishEvent').mockImplementation(async (detail, detailType) => {
            return 'success';
        });

        createEventSpy.mockRestore();
        publishEventSpy.mockRestore();
        expect(updateCaseStatusSpy).toHaveBeenCalledTimes(0);
    });

    it('should return false if upload of all required docs is not complete', async () => {
        const caseCompleteSpy = jest.spyOn(S3Trigger, 'isCaseUploadComplete').mockImplementation(async (params) => {
            return false;
        });

        expect(await index.handler(mockS3Event, mockContext)).toBeFalsy();

        caseCompleteSpy.mockRestore();

        expect(updateCaseStatusSpy).toHaveBeenCalledTimes(1);
        expect(updateCaseStatusSpy).toHaveBeenCalledWith('fake-case', SharedLib.CaseStatus.INITIATE);
    });

    it('should return false if event is not an initial document upload event', async () => {
        const event = {
            'detail': {
                'object': {
                    'key': '111/output/result-doc-id.txt'
                }
            }
        };

        expect(await index.handler(event, mockContext)).toBeFalsy();
    });

    it('upload to kendra index throws an error', async () => {
        const mockSfnEvent = {
            detail: {
                case: {
                    id: 'fake-case-id-2',
                    status: 'success',
                    stage: 'entity-pii',
                    workflows: ['textract', 'entity-pii'],
                    documentList: [
                        {
                            'stage': 'classification',
                            'inferences': {},
                            'document': {
                                'id': 'fake-doc-id-1',
                                'selfCertifiedDocType': 'passport',
                                's3Prefix': 's3-prefix',
                                'processingType': 'sync'
                            }
                        }
                    ]
                }
            },
            source: `${SharedLib.EventSources.WORKFLOW_STEPFUNCTION}.${process.env.APP_NAMESPACE}`
        };

        uploadToKendraIndexSpy = jest.spyOn(kendra, 'uploadToKendraIndex').mockImplementation(() => {
            throw new Error('Kendra upload failed.');
        });
        process.env.KENDRA_INDEX_ID = 'some-uuid';

        expect(async () => await index.handler(mockSfnEvent, mockContext)).rejects.toThrow('Kendra upload failed.');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.WORKFLOW_CONFIG_TABLE_NAME;
        delete process.env.AWS_REGION;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.EVENT_BUS_ARN;
        delete process.env.S3_UPLOAD_PREFIX;
        delete process.env.APP_NAMESPACE;
        delete process.env.KENDRA_INDEX_ID;
        delete process.env.KENDRA_ROLE_ARN;
        jest.clearAllMocks();
    });
});
