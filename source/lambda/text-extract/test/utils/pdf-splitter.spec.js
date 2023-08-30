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

const AWSMock = require('aws-sdk-mock');
const PdfSplitter = require('../../utils/pdf-splitter');
const SharedLib = require('common-node-lib');

const createMockPdf = async (multipage) => {
    const pdfDoc = await SharedLib.PdfLib.PDFDocument.create();
    if (multipage) {
        const page1 = pdfDoc.addPage();
        page1.drawText('This is the first sample page');
        const page2 = pdfDoc.addPage();
        page2.drawText('This is the first sample page');
    } else {
        const page = pdfDoc.addPage();
        page.drawText('This is some sample text for a pdf');
    }
    return await pdfDoc.save();
};

describe('When parsing a s3key', () => {
    it('should be able to correctly return the dirname and basefilename', () => {
        const s3Key = 'fake-user-id:fake-case-id/initial/fake-filename.pdf';
        expect(PdfSplitter.parseS3Key(s3Key)).toEqual(['fake-user-id:fake-case-id/initial', 'fake-filename']);
    });
});

describe('When downloading an object from s3 and loading as pdf', () => {
    let pdfBytes;
    beforeAll(async () => {
        process.env.DOCUMENT_BUCKET_NAME = 'test-bucket';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.AWS_REGION = 'us-east-1';
    });

    beforeEach(async () => {
        pdfBytes = await createMockPdf();
        jest.spyOn(SharedLib, 'downloadObjectFromS3').mockImplementation((params) => {
            expect(params.Key).toBeDefined();

            return { Body: pdfBytes };
        });
    });

    it('should download an object from s3 and load as pdf correctly', async () => {
        const s3Key = 'fake-user-id:fake-case-id/initial/fake-filename.pdf';
        const pdfDoc = await PdfSplitter.loadFileAsPdf(s3Key);
        expect(pdfDoc.getPageCount()).toEqual(1);
    }, 10000);

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        delete process.env.DOCUMENT_BUCKET_NAME;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.AWS_REGION;
    });
});

describe('When splitting and saving individual pdf', () => {
    let pdfBytes;
    beforeAll(async () => {
        process.env.DOCUMENT_BUCKET_NAME = 'test-bucket';
        process.env.S3_MULTI_PAGE_PDF_PREFIX = 'multi-page-pdf';
        process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO0999/v9.9.9" }';
        process.env.AWS_REGION = 'us-east-1';

        AWSMock.mock('S3', 'putObject', async (params) => {
            expect(params.Bucket).toEqual(process.env.DOCUMENT_BUCKET_NAME);
            return 'doc-uploaded-successfully';
        });
    });

    it('should download an object from s3 split each page and save the document', async () => {
        pdfBytes = await createMockPdf(true);

        jest.spyOn(SharedLib, 'downloadObjectFromS3').mockImplementation((params) => {
            expect(params.Key).toBeDefined();

            return { Body: pdfBytes };
        });

        const s3Key = 'fake-user-id:fake-case-id/initial/fake-filename.pdf';

        const response = await PdfSplitter.splitAndSavePdfPages({ s3Key: s3Key });
        expect(response).toEqual([
            `${process.env.S3_MULTI_PAGE_PDF_PREFIX}/fake-user-id:fake-case-id/initial/fake-filename/0.pdf`,
            `${process.env.S3_MULTI_PAGE_PDF_PREFIX}/fake-user-id:fake-case-id/initial/fake-filename/1.pdf`
        ]);
    });

    it('should log and return if trying to split single page document', async () => {
        pdfBytes = await createMockPdf(false);

        jest.spyOn(SharedLib, 'downloadObjectFromS3').mockImplementation((params) => {
            expect(params.Key).toBeDefined();

            return { Body: pdfBytes };
        });
        const s3Key = 'fake-user-id:fake-case-id/initial/fake-filename.pdf';

        const response = await PdfSplitter.splitAndSavePdfPages({ s3Key: s3Key });
        expect(response).toEqual([s3Key]);
    });

    afterEach(() => {
        jest.clearAllMocks();
        AWSMock.restore('S3');
    });

    afterAll(() => {
        delete process.env.DOCUMENT_BUCKET_NAME;
        delete process.env.S3_MULTI_PAGE_PDF_PREFIX;
        delete process.env.AWS_SDK_USER_AGENT;
        delete process.env.AWS_REGION;
    });
});
