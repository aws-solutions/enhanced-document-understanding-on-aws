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

const AWS = require('aws-sdk');
const UserAgentConfig = require('aws-node-user-agent-config');
const SharedLib = require('common-node-lib');
const { PdfLib } = require('common-node-lib');
const path = require('path');

/**
 * Given a s3 object key for a multipage pdf document, this
 * function will split the pdf into individual pages. Each page is saved
 * to a different prefix in the same bucket. The prefix is configured with
 * an environment variable set at deployment of this lambda.
 * @param {Object} params
 * @param {string} params.s3Key object key
 * @param {string} params.s3Bucket bucket where the split document will be uploaded
 */
exports.splitAndSavePdfPages = async (params) => {
    const s3 = new AWS.S3(UserAgentConfig.customAwsConfig());
    console.log(`splitAndSavePdfPages params: ${JSON.stringify(params)}`);

    const pdfDoc = await this.loadFileAsPdf(params.s3Key);
    const pdfPageCount = pdfDoc.getPageCount();
    if (pdfPageCount === 1) {
        console.log('Single page pdf document. Nothing to extract');
        return [params.s3Key];
    }

    if (pdfPageCount > SharedLib.TextractDefaults.PDF_PAGE_LIMIT) {
        const errorMsg = `PDF Document exceeds max page limit of ${SharedLib.TextractDefaults.PDF_PAGE_LIMIT}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    const [dirName, baseFileName] = this.parseS3Key(params.s3Key);

    const splitPagesDirName = path.join(process.env.S3_MULTI_PAGE_PDF_PREFIX, dirName, baseFileName);

    const splitPdfKeys = [];
    const promises = [];
    for (let index = 0; index < pdfPageCount; index++) {
        const subDocument = await PdfLib.PDFDocument.create();
        const [copiedPage] = await subDocument.copyPages(pdfDoc, [index]);
        subDocument.addPage(copiedPage);
        const pdfBytes = await subDocument.save();
        const splitFileName = path.join(splitPagesDirName, `${index}.pdf`);

        const s3PutParams = {
            Bucket: params.s3Bucket ?? process.env.DOCUMENT_BUCKET_NAME,
            Key: splitFileName,
            Body: pdfBytes
        };

        promises.push(s3.putObject(s3PutParams).promise());
        splitPdfKeys.push(splitFileName);
    }

    const putObjectResults = await Promise.allSettled(promises);
    const rejected = putObjectResults.filter((result) => result.status === 'rejected');
    if (rejected.length) {
        console.error(`One of more pages failed to upload. rejection response: ${JSON.stringify(rejected)}`);
        throw new Error('Failed to extract and save pdf pages');
    }
    return splitPdfKeys;
};

/**
 * Use the common lib to download the object and load as a PDF file
 * @param {string} s3Key Pdf file location
 */
exports.loadFileAsPdf = async (s3Key) => {
    const response = await SharedLib.downloadObjectFromS3({
        Key: s3Key
    });
    return PdfLib.PDFDocument.load(response.Body);
};

/**
 * Parse s3 object key to return filename without extension and directory name
 * @param {string} s3Key
 * @returns {[string, string]}
 */
exports.parseS3Key = (s3Key) => {
    const extension = path.extname(s3Key);
    const baseFileName = path.basename(s3Key, extension);
    const dirName = path.dirname(s3Key);
    return [dirName, baseFileName];
};
