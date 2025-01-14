// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const AWS = require('aws-sdk');
const AWSMock = require('aws-sdk-mock');
const ddbInference = require('../../ddb/ddb-case-update');
const {
    workflowOrchestratorS3UploadSuccessResponse,
    workflowOrchestratorCompleteStatusDDBUploadResponses,
    workflowOrchestratorUpdateStatusDDBResponse,
    caseStatusTableGetInferencesResponse,
    ddbGetInferencePrefixesExpectedResult
} = require('../event-test-data');
const { inferenceAttributePrefix, CaseStatus } = require('../../constants');

describe('DDB Update Inferences: When provided with correct inputs', () => {
    let dynamoDB, consoleDebugSpy;

    beforeAll(() => {
        process.env.AWS_REGION = 'fakeRegion';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.CASE_DDB_TABLE_NAME = 'fake-table';
        let i = 0;

        // will return items from the expected responses array in order
        AWSMock.mock('DynamoDB', 'updateItem', (params, callback) => {
            callback(null, workflowOrchestratorCompleteStatusDDBUploadResponses[i++]);
        });
        dynamoDB = new AWS.DynamoDB();
        consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    });

    it('should pass successfully when input has job ids embedded', async () => {
        const response = await ddbInference.updateInferences(workflowOrchestratorS3UploadSuccessResponse);
        expect(response).toEqual(workflowOrchestratorCompleteStatusDDBUploadResponses);
    });

    it('should do nothing when given empty input', async () => {
        const response = await ddbInference.updateInferences([]);
        expect(response).toEqual([]);
    });

    it('should log environment variable correctly', async () => {
        ddbInference.checkDDBCaseUpdateEnvSetup();
        expect(consoleDebugSpy).toHaveBeenCalledWith('CASE_DDB_TABLE_NAME is: fake-table');
    });

    afterAll(() => {
        AWSMock.restore('DynamoDB');
        consoleDebugSpy.mockRestore();
        delete process.env.AWS_REGION;
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.AWS_SDK_USER_AGENT;
    });
});

describe('DDB Update Inferences: When provided with incorrect inputs', () => {
    let dynamoDB;

    beforeAll(() => {
        process.env.CASE_DDB_TABLE_NAME = 'fake-table';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
    });

    afterEach(() => {
        process.env.CASE_DDB_TABLE_NAME = 'fake-table';
        jest.clearAllMocks();
    });

    it('throws an errors due to CASE_DDB_TABLE_NAME env variable not being set', async () => {
        delete process.env.CASE_DDB_TABLE_NAME;
        expect(() => {
            ddbInference.checkDDBCaseUpdateEnvSetup();
        }).toThrow('CASE_DDB_TABLE_NAME Lambda Environment variable not set.');
    });

    it('returns empty when we have failures', async () => {
        AWSMock.mock('DynamoDB', 'updateItem', (params, callback) => {
            callback(new Error('Fake error'), null);
        });
        dynamoDB = new AWS.DynamoDB();
        const response = await ddbInference.updateInferences(workflowOrchestratorS3UploadSuccessResponse);
        expect(response).toEqual([]);
    });

    it('failure on the 3rd attempt still returns the successful responses for the first 2', async () => {
        let i = 0;
        AWSMock.remock('DynamoDB', 'updateItem', (params, callback) => {
            if (i >= 2) {
                callback(new Error('Fake error'), null);
            } else {
                callback(null, workflowOrchestratorCompleteStatusDDBUploadResponses[i++]);
            }
        });
        dynamoDB = new AWS.DynamoDB();
        const response = await ddbInference.updateInferences(workflowOrchestratorS3UploadSuccessResponse);
        expect(response).toEqual(workflowOrchestratorCompleteStatusDDBUploadResponses.slice(0, 2));
    });

    afterAll(() => {
        AWSMock.restore('DynamoDB');
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.AWS_SDK_USER_AGENT;
    });
});

describe('DDB Update Inference: When provided with correct inputs', () => {
    let dynamoDB, consoleDebugSpy;

    beforeAll(() => {
        process.env.AWS_REGION = 'fakeRegion';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.CASE_DDB_TABLE_NAME = 'fake-table';
        let i = 0;

        // will return items from the expected responses array in order
        AWSMock.mock('DynamoDB', 'updateItem', (params, callback) => {
            callback(null, workflowOrchestratorCompleteStatusDDBUploadResponses[0]);
        });
        dynamoDB = new AWS.DynamoDB();
        consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    });

    it('should pass successfully on single item when input has job ids embedded', async () => {
        console.debug(workflowOrchestratorS3UploadSuccessResponse[0]);
        const response = await ddbInference.updateInference(workflowOrchestratorS3UploadSuccessResponse[0]);
        expect(response).toEqual(workflowOrchestratorCompleteStatusDDBUploadResponses[0]);
    });

    it('should pass successfully on single item when input has job ids embedded and ddb client passed in', async () => {
        const response = await ddbInference.updateInference(workflowOrchestratorS3UploadSuccessResponse[0], dynamoDB);
        expect(response).toEqual(workflowOrchestratorCompleteStatusDDBUploadResponses[0]);
    });

    it('should pass successfully on single item, logging inference bucket', async () => {
        // resetting and re-importing the module will clear the module level CASE_DDB_TABLE_NAME
        jest.resetModules();
        // will return items from the expected responses array in order
        AWSMock.mock('DynamoDB', 'updateItem', (params, callback) => {
            callback(null, workflowOrchestratorCompleteStatusDDBUploadResponses[i++]);
        });
        dynamoDB = new AWS.DynamoDB();
        let ddbInference = require('../../ddb/ddb-case-update');
        const response = await ddbInference.updateInference(workflowOrchestratorS3UploadSuccessResponse[0], dynamoDB);
        expect(response).toEqual(workflowOrchestratorCompleteStatusDDBUploadResponses[0]);
        expect(consoleDebugSpy).toHaveBeenCalledWith('CASE_DDB_TABLE_NAME is: fake-table');
    });

    it('should log environment variable correctly', async () => {
        ddbInference.checkDDBCaseUpdateEnvSetup();
        expect(consoleDebugSpy).toHaveBeenCalledWith('CASE_DDB_TABLE_NAME is: fake-table');
    });

    afterAll(() => {
        AWSMock.restore('DynamoDB');
        consoleDebugSpy.mockRestore();
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.AWS_SDK_USER_AGENT;
    });
});

describe('DDB Update Inference: failure cases', () => {
    let dynamoDB;

    beforeAll(() => {
        process.env.CASE_DDB_TABLE_NAME = 'fake-table';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
    });

    afterEach(() => {
        process.env.CASE_DDB_TABLE_NAME = 'fake-table';
        jest.clearAllMocks();
    });

    it('throws an errors due to CASE_DDB_TABLE_NAME env variable not being set', async () => {
        delete process.env.CASE_DDB_TABLE_NAME;
        expect(() => {
            ddbInference.checkDDBCaseUpdateEnvSetup();
        }).toThrow('CASE_DDB_TABLE_NAME Lambda Environment variable not set.');
    });

    it('returns empty when we have failures', async () => {
        AWSMock.mock('DynamoDB', 'updateItem', (params, callback) => {
            callback(new Error('Fake error'), null);
        });
        dynamoDB = new AWS.DynamoDB();
        await expect(
            ddbInference.updateInference(workflowOrchestratorS3UploadSuccessResponse[0], dynamoDB)
        ).rejects.toThrow();
    });

    afterAll(() => {
        AWSMock.restore('DynamoDB');
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.AWS_SDK_USER_AGENT;
    });
});

describe('DDB Get Inference Prefixes: When provided with correct inputs', () => {
    let dynamoDB, consoleDebugSpy;

    beforeAll(() => {
        process.env.AWS_REGION = 'fakeRegion';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.CASE_DDB_TABLE_NAME = 'fake-table';

        // will return items from the expected responses array in order
        AWSMock.mock('DynamoDB', 'getItem', (params, callback) => {
            callback(null, caseStatusTableGetInferencesResponse);
        });
        dynamoDB = new AWS.DynamoDB();
        consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    });

    it('should pass successfully', async () => {
        const response = await ddbInference.getInferencePrefixes('caseId', 'documentId');
        expect(response).toEqual(ddbGetInferencePrefixesExpectedResult);
    });

    it('should return nothing when no inferences exist', async () => {
        let noInferenceDdbResponse = caseStatusTableGetInferencesResponse;
        delete noInferenceDdbResponse.Item[`${inferenceAttributePrefix}-textract-analyzeDoc`];
        delete noInferenceDdbResponse.Item[`${inferenceAttributePrefix}-textract-analyzeId`];
        AWSMock.remock('DynamoDB', 'getItem', (params, callback) => {
            callback(null, noInferenceDdbResponse);
        });

        const response = await ddbInference.getInferencePrefixes('caseId', 'documentId');
        expect(response).toEqual({});
    });

    it('should log environment variable correctly', async () => {
        ddbInference.checkDDBCaseUpdateEnvSetup();
        expect(consoleDebugSpy).toHaveBeenCalledWith('CASE_DDB_TABLE_NAME is: fake-table');
    });

    afterAll(() => {
        AWSMock.restore('DynamoDB');
        consoleDebugSpy.mockRestore();
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.AWS_SDK_USER_AGENT;
    });
});

describe('DDB Get Inference Prefixes: When provided with incorrect inputs', () => {
    let dynamoDB;

    beforeAll(() => {
        process.env.CASE_DDB_TABLE_NAME = 'fake-table';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
    });

    afterEach(() => {
        process.env.CASE_DDB_TABLE_NAME = 'fake-table';
        jest.clearAllMocks();
    });

    it('throws an errors due to CASE_DDB_TABLE_NAME env variable not being set', async () => {
        delete process.env.CASE_DDB_TABLE_NAME;
        expect(() => {
            ddbInference.checkDDBCaseUpdateEnvSetup();
        }).toThrow('CASE_DDB_TABLE_NAME Lambda Environment variable not set.');
    });

    it('returns empty when we have failures', async () => {
        AWSMock.mock('DynamoDB', 'getItem', (params, callback) => {
            callback(new Error('Fake error'), null);
        });
        dynamoDB = new AWS.DynamoDB();
        await expect(ddbInference.getInferencePrefixes(workflowOrchestratorS3UploadSuccessResponse)).rejects.toThrow(
            'Fake error'
        );
    });

    afterAll(() => {
        AWSMock.restore('DynamoDB');
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.AWS_SDK_USER_AGENT;
    });
});

describe('DDB Update Case Status: When provided with correct inputs', () => {
    let dynamoDB, consoleDebugSpy;

    beforeAll(() => {
        jest.resetModules();

        process.env.AWS_REGION = 'fakeRegion';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.CASE_DDB_TABLE_NAME = 'fake-table';
        let i = 0;

        // will return items from the expected responses array in order
        AWSMock.mock('DynamoDB', 'updateItem', (params, callback) => {
            callback(null, workflowOrchestratorUpdateStatusDDBResponse);
        });
        dynamoDB = new AWS.DynamoDB();
        consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    });

    it('should pass successfully', async () => {
        let ddbInference = require('../../ddb/ddb-case-update');
        const response = await ddbInference.updateCaseStatus('case-id', CaseStatus.INITIATE, dynamoDB);
        expect(response).toEqual(workflowOrchestratorUpdateStatusDDBResponse);
        expect(consoleDebugSpy).toHaveBeenCalledWith('CASE_DDB_TABLE_NAME is: fake-table');
    });

    afterAll(() => {
        AWSMock.restore('DynamoDB');
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.AWS_SDK_USER_AGENT;
    });
});

// failure case test for updateCaseStatus
describe('DDB Update Case Status: When provided with incorrect inputs', () => {
    let dynamoDB;

    beforeAll(() => {
        process.env.CASE_DDB_TABLE_NAME = 'fake-table';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
    });

    afterEach(() => {
        process.env.CASE_DDB_TABLE_NAME = 'fake-table';
        jest.clearAllMocks();
    });

    it('throws an errors due to CASE_DDB_TABLE_NAME env variable not being set', async () => {
        delete process.env.CASE_DDB_TABLE_NAME;
        expect(() => {
            ddbInference.checkDDBCaseUpdateEnvSetup();
        }).toThrow('CASE_DDB_TABLE_NAME Lambda Environment variable not set.');
    });

    it('throws when we have failures', async () => {
        AWSMock.mock('DynamoDB', 'updateItem', (params, callback) => {
            callback(new Error('Fake error'), null);
        });
        dynamoDB = new AWS.DynamoDB();
        await expect(ddbInference.updateCaseStatus('case', 'status', dynamoDB)).rejects.toThrow('Fake error');
    });

    afterAll(() => {
        AWSMock.restore('DynamoDB');
        delete process.env.CASE_DDB_TABLE_NAME;
        delete process.env.AWS_SDK_USER_AGENT;
    });
});
