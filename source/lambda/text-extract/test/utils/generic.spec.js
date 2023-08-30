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

'use strict';

const utils = require('../../utils/generic');

describe('getTextractApiType: When provided with correct inputs', () => {
    it('receives Document type input', async () => {
        let actualResponse = utils.getTextractApiType('Paystub');
        expect(actualResponse).toBe('Document');
    });

    it('receives expense document', async () => {
        let actualResponse = utils.getTextractApiType('Invoice');
        expect(actualResponse).toBe('Expense');
    });

    it('receives ID document', async () => {
        let actualResponse = utils.getTextractApiType('Passport');
        expect(actualResponse).toBe('ID');
    });
});

describe('getTextractApiType: When provided with incorrect inputs', () => {
    it('throws an error in getTextractApiType due to unsupported document uploaded', async () => {
        let docType = 'Bank Statement';
        expect(() => {
            utils.getTextractApiType(docType);
        }).toThrow(`The document type (${docType}) is not valid for Textract processing.`);
    });
});

describe('When extracting S3Uri components', () => {
    it('Should correctly parse the S3Prefix obtained frm ddb record', () => {
        const s3Prefix = 'test-case-id/initial/doc-test-id.jpg';
        const [key, fileName, fileExtension] = utils.extractS3UriComponents(s3Prefix);

        expect(key).toEqual('test-case-id/initial/doc-test-id.jpg');
        expect(fileName).toEqual('doc-test-id.jpg');
        expect(fileExtension).toEqual('jpg');
    });
});
