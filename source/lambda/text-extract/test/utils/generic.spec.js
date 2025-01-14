// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
