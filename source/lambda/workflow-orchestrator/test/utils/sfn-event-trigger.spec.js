// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';
const SfnTrigger = require('../../utils/sfn-event-trigger');
const _ = require('lodash');

describe('When selecting the next status for an event', () => {
    beforeEach(() => {
        process.env.APP_NAMESPACE = 'app.idp';
        jest.clearAllMocks();
    });

    it('Should select the initiate status for non terminal cases', () => {
        const params = {
            stage: 'classification',
            workflows: ['classification', 'textract', 'entity-pii']
        };
        expect(SfnTrigger.selectNextStatus(params)).toBe('initiate');
    });

    it('Should select the complete status for terminal cases', () => {
        const params = {
            stage: 'entity-pii',
            workflows: ['classification', 'textract', 'entity-pii']
        };
        expect(SfnTrigger.selectNextStatus(params)).toBe('complete');
    });

    it('Should select the complete status for single workflow', () => {
        const params = {
            stage: 'textract',
            workflows: ['textract']
        };
        expect(SfnTrigger.selectNextStatus(params)).toBe('complete');
    });

    afterAll(() => {
        delete process.env.APP_NAMESPACE;
    });
});

describe('When selecting the next stage for an event', () => {
    beforeEach(() => {
        process.env.APP_NAMESPACE = 'app.idp';
    });

    it('Should select the next textract stage for non terminal cases', () => {
        const params = {
            stage: 'classification',
            workflows: ['classification', 'textract', 'entity-pii']
        };

        expect(SfnTrigger.selectNextStage(params)).toBe('textract');
    });

    it('Should throw an error if current stage is terminal stage', () => {
        const params = {
            stage: 'entity-pii',
            workflows: ['classification', 'textract', 'entity-pii']
        };

        try {
            SfnTrigger.selectNextStage(params);
        } catch (error) {
            expect(error.message).toBe('The next stage index out of bounds of workflows list.');
        }
    });

    afterAll(() => {
        delete process.env.APP_NAMESPACE;
    });
});

describe('When generating the next Step Function event', () => {
    beforeEach(() => {
        process.env.APP_NAMESPACE = 'app.idp';
        jest.clearAllMocks();
    });

    it('Should generate the correct next stage and status for non-terminal events', () => {
        const mockSfnEvent = {
            detail: {
                case: {
                    id: 'fake-case-id-2',
                    status: 'success',
                    stage: 'classification',
                    workflows: ['classification', 'textract', 'entity-pii'],
                    documentList: [
                        {
                            'document': {
                                'id': 'fake-doc-id-1',
                                'selfCertifiedDocType': 'passport',
                                's3Prefix': 's3-prefix',
                                'processingType': 'sync'
                            },
                            'stage': 'classification',
                            'inferences': {}
                        }
                    ]
                }
            },
            source: 'workflow-stepfunction.app.idp'
        };

        const expectedNextEvent = _.cloneDeep(mockSfnEvent);
        (expectedNextEvent.detail.case.status = 'initiate'), (expectedNextEvent.detail.case.stage = 'textract');

        expect(SfnTrigger.generateSfnEventDetail(mockSfnEvent)).toEqual(expectedNextEvent.detail);
    });

    it('Should generate the correct terminal stage and status single workflow cases', () => {
        const mockSfnEventSingleWorkflow = {
            detail: {
                case: {
                    id: 'fake-case-id-3',
                    status: 'success',
                    stage: 'textract',
                    workflows: ['textract'],
                    documentList: [
                        {
                            'document': {
                                'id': 'fake-doc-id-1',
                                'selfCertifiedDocType': 'passport',
                                's3Prefix': 's3-prefix',
                                'processingType': 'sync'
                            },
                            'stage': 'classification',
                            'inferences': {}
                        }
                    ]
                }
            },
            source: 'workflow-stepfunction.app.idp'
        };

        const expectedNextEvent = _.cloneDeep(mockSfnEventSingleWorkflow);
        expectedNextEvent.detail.case.status = 'complete';

        expect(SfnTrigger.generateSfnEventDetail(mockSfnEventSingleWorkflow)).toEqual(expectedNextEvent.detail);
    });

    it('Should generate the correct terminal stage and status single workflow cases', () => {
        const mockSfnFailureEvent = {
            detail: {
                case: {
                    id: 'fake-case-id-4',
                    status: 'failure',
                    stage: 'entity-pii',
                    workflows: ['classification', 'textract', 'entity-pii'],
                    documentList: [
                        {
                            'document': {
                                'id': 'fake-doc-id-1',
                                'selfCertifiedDocType': 'passport',
                                's3Prefix': 's3-prefix',
                                'processingType': 'sync'
                            },
                            'stage': 'classification',
                            'inferences': {}
                        }
                    ]
                }
            },
            source: 'workflow-stepfunction.app.idp'
        };

        try {
            SfnTrigger.generateSfnEventDetail(mockSfnFailureEvent);
        } catch (error) {
            expect(error.message).toEqual('Failure response to be implementd');
        }
    });

    afterAll(() => {
        delete process.env.APP_NAMESPACE;
    });
});
