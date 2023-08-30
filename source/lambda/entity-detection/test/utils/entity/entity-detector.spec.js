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

const utils = require('../../../utils/generic');
const { EntityDetector } = require('../../../utils/entity/entity-detector');
const { EntityContext } = require('../../../utils/entity/entity-context');
const { MedicalEntityDetectionStrategy } = require('../../../utils/entity/medical-entity-detection-strategy');
const { PiiEntityDetectionStrategy } = require('../../../utils/entity/pii-entity-detection-strategy');
const { GenericEntityDetectionStrategy } = require('../../../utils/entity/generic-entity-detection-strategy');

const {
    entityDetectionInference,
    bondingBoxResultMedical,
    expectedSyncComprehendMedicalResponse,
    offsetToLineIdMapMedical,
    blockDictMedical,
    textractFullPageText
} = require('../../event-test-data');

describe('Comprehend: When provided with correct inputs', () => {
    let getComprehendResult, addEntityLocations;
    beforeEach(() => {
        process.env.AWS_REGION = 'fakeRegion';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
    });

    it('should pass successfully with a valid jobType', async () => {
        const entityDetector = new EntityDetector(utils.jobTypes.MEDICAL);
        expect(entityDetector.jobType).toEqual(utils.jobTypes.MEDICAL);
    });

    it('should create a GenericEntityDetectionStrategy  instance for the give jobType', async () => {
        const entityDetector = new EntityDetector(utils.jobTypes.STANDARD);
        expect(entityDetector.context).toBeDefined();
        expect(entityDetector.context).toBeInstanceOf(EntityContext);
        expect(entityDetector.context.jobType).toBeDefined();
        expect(entityDetector.context.jobType).toBeInstanceOf(GenericEntityDetectionStrategy);
    });

    it('should create a PiiEntityDetectionStrategy instance for the give jobType', async () => {
        const entityDetector = new EntityDetector(utils.jobTypes.PII);
        expect(entityDetector.context).toBeDefined();
        expect(entityDetector.context).toBeInstanceOf(EntityContext);
        expect(entityDetector.context.jobType).toBeDefined();
        expect(entityDetector.context.jobType).toBeInstanceOf(PiiEntityDetectionStrategy);
    });

    it('should create a MedicalEntityDetectionStrategy instance for the give jobType', async () => {
        const entityDetector = new EntityDetector(utils.jobTypes.MEDICAL);
        expect(entityDetector.context).toBeDefined();
        expect(entityDetector.context).toBeInstanceOf(EntityContext);
        expect(entityDetector.context.jobType).toBeDefined();
        expect(entityDetector.context.jobType).toBeInstanceOf(MedicalEntityDetectionStrategy);
    });

    it('getComprehendResult should return result successfully', async () => {
        getComprehendResult = jest.spyOn(EntityContext.prototype, 'getComprehendResult');
        getComprehendResult.mockImplementation(async (...params) => {
            return entityDetectionInference;
        });

        const entityDetector = new EntityDetector(utils.jobTypes.STANDARD);
        const result = await entityDetector.getComprehendResult({
            pageText: 'Some Text',
            taskToken: 'fake-token',
            languageCode: 'en',
            endpointArn: 'custom-arn'
        });
        expect(result).toEqual(entityDetectionInference);
    });

    it('addEntityLocations should return result successfully', async () => {
        addEntityLocations = jest.spyOn(EntityContext.prototype, 'addEntityLocations');
        addEntityLocations.mockImplementation(async (...params) => {
            return bondingBoxResultMedical;
        });

        const entityDetector = new EntityDetector(utils.jobTypes.MEDICAL);
        const result = await entityDetector.addEntityLocations({
            response: expectedSyncComprehendMedicalResponse,
            offsetToLineIdMap: offsetToLineIdMapMedical,
            blockDict: blockDictMedical,
            pageIdx: 1,
            pageText: textractFullPageText
        });
        expect(result).toEqual(bondingBoxResultMedical);
    });
});

describe('When provided with incorrect inputs', () => {
    it('should throw an error with a invalid jobType', async () => {
        const invalidJobType = 'invalid-jonType';
        expect(() => new EntityDetector(invalidJobType)).toThrow(`Unsupported jobType ${invalidJobType} provided.`);
    });

    it('should throw an error with a invalid languageCode', async () => {
        const invalidLanguageCode = 'invalid-languageCode';
        const entityDetector = new EntityDetector(utils.jobTypes.STANDARD);
        await expect(
            entityDetector.getComprehendResult({
                pageText: 'Some Text',
                taskToken: 'fake-token',
                languageCode: invalidLanguageCode,
                endpointArn: 'custom-arn'
            })
        ).rejects.toThrow(`Unsupported language ${invalidLanguageCode} provided.`);
    });
});
