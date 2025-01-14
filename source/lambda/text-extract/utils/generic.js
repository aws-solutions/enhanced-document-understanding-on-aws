// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';
const path = require('path');

/**
 * Takes an s3 URI and splits it into useful components
 * @param {string} s3Uri
 * @returns {Array} array containing the bucket name, the full key, the filename, and the file extension
 */
exports.extractS3UriComponents = (s3Uri) => {
    let s3Parts = s3Uri.replace('s3://', '').split('/');
    let key = s3Parts.join('/');

    const fileName = path.basename(s3Uri);
    const fileExtension = path.extname(s3Uri).replace('.', '');

    return [key, fileName, fileExtension];
};

exports.supportedImageTypes = ['jpeg', 'jpg', 'png', 'tiff', 'pdf'];

exports.documentTypes = {
    ID: 'ID',
    Expense: 'Expense',
    Document: 'Document'
};

exports.docTypeMapping = {
    'driving-license': exports.documentTypes.ID,
    'passport': exports.documentTypes.ID,
    'receipt': exports.documentTypes.Expense,
    'invoice': exports.documentTypes.Expense,
    'vaccination-card': exports.documentTypes.Document,
    'paystub': exports.documentTypes.Document,
    'loan-information': exports.documentTypes.Document,
    'health-insurance-card': exports.documentTypes.Document,
    'generic': exports.documentTypes.Document
};

/**
 * Takes the self-certified document type provided by the user and maps it to the corresponding textract document type
 * (one of the values defined in documentTypes)
 *
 * @param {String} selfCertifiedDocType String representing the document type as selected by the user
 * @returns String representing the document type for the purpose of selecting the correct textract API
 * @throws if the provided doc type is invalid.
 */
exports.getTextractApiType = (selfCertifiedDocType) => {
    let docType = selfCertifiedDocType.toLowerCase();
    if (docType in exports.docTypeMapping) {
        return exports.docTypeMapping[docType];
    } else {
        // Alternative: possibly folding other types into one of the types mentioned above.
        const errMsg = `The document type (${selfCertifiedDocType}) is not valid for Textract processing.`;
        throw new Error(errMsg);
    }
};
