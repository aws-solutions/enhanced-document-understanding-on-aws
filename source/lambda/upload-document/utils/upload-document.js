// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const _ = require('lodash');

const AWS = require('aws-sdk');
const crypto = require('crypto');
const UserAgentConfig = require('aws-node-user-agent-config');
const { loadWorkflowConfig } = require('../config/ddb-loader');
const SharedLib = require('common-node-lib');

const MAX_UPLOAD_FILE_SIZE = 5242880; //bytes

/**
 * Generates a documentId. Its a uuidv4 string with 'doc-' prepended
 * @returns {String}
 */
const createDocumentId = () => {
    return `doc-${crypto.randomUUID()}`;
};

/**
 * Generate the xml tag string that will be used to add tags to objects uploaded to s3
 * using the presigned post url
 * @param {string} tagKey
 * @param {string} tagValue
 * @returns
 */
const createTag = (tagKey, tagValue) => {
    return `<Tag><Key>${tagKey}</Key><Value>${tagValue}</Value></Tag>`;
};

/**
 * Generate the xml tag set that will be used to add tags to objects uploaded to s3
 * @params {string[]} tags
 * @return string
 */

const createTagSet = (tags) => {
    return `<Tagging><TagSet>${tags.join('')}</TagSet></Tagging>`;
};

/**
 * Create a POST request with conditions.
 * @param {Object} params must contain attributes `caseId, fileExtension`
 * @returns
 */
const generatePresignedS3PostUrl = async (params) => {
    const awsUserAgentConfig = UserAgentConfig.customAwsConfig();
    const s3 = new AWS.S3(awsUserAgentConfig);
    const keyPrefix = `${process.env.S3_UPLOAD_PREFIX}/${params.caseId}/`;

    let contentType = undefined;

    if (['.jpeg', '.jpg', '.png'].includes(params.fileExtension)) {
        contentType = `image/${params.fileExtension.replace('.', '')}`;
    } else if (params.fileExtension === '.pdf') {
        contentType = `application/${params.fileExtension.replace('.', '')}`;
    } else {
        const errMsg = `File extension is ${params.fileExtension}, which does not fall into supported content-types`;
        console.error(errMsg);
        throw new Error(errMsg);
    }

    const userIdTag = createTag(SharedLib.userIdKey, params.userId);

    const documentTypeTag = createTag(SharedLib.documentTypeKey, params.documentType);
    const fileNameBase64EncodedTag = createTag(SharedLib.fileNameBase64EncodedKey, btoa(params.fileName));

    const tags = [userIdTag, documentTypeTag, fileNameBase64EncodedTag];

    const tagging = createTagSet(tags);

    const s3Params = {
        Bucket: process.env.UPLOAD_DOCS_BUCKET_NAME,
        Conditions: [
            ['starts-with', '$key', keyPrefix],
            ['content-length-range', 1, MAX_UPLOAD_FILE_SIZE], // 1 means empty files cannot be uploaded
            ['eq', '$x-amz-meta-userid', params.userId],
            ['eq', '$x-amz-meta-fileExtension', contentType],
            ['eq', '$tagging', tagging]
        ],
        Fields: {
            key: params.filekey,
            'x-amz-meta-userId': params.userId,
            'x-amz-meta-fileExtension': contentType,
            'Content-Type': contentType,
            'Content-Disposition': `inline; filename="${params.fileName}"`,
            'tagging': tagging
        },
        Expires: 600
    };

    try {
        return await s3.createPresignedPost(s3Params);
    } catch (error) {
        console.error(
            `Error generating presigned POST url. params: ${JSON.stringify(params)}, error: ${error.message}`
        );
        throw new Error('Error generating PresignedPost URL');
    }
};

/**
 * Given a caseId and docId an unique key is generated for a document.
 * This key is
 * @param {String} caseId
 * @param {String} docId
 * @param {String} fileExtension
 *
 * @returns file key
 */
const createFileKey = (caseId, docId, fileExtension) => {
    const s3UploadPrefix = process.env.S3_UPLOAD_PREFIX;
    const cleanFileExt = fileExtension.replace(/^\./, '');

    return `${s3UploadPrefix}/${caseId}/${docId}.${cleanFileExt}`;
};

/**
 * Checks if documents can be uploaded. If based on workflow configuration, the limit
 * is reached, it will return false.
 *
 * @param {Object} params
 * @param {String} params.caseId CaseId associated with file
 * @param {String} params.fileExtension Extension of file
 *
 * @returns - true/ false if documents can be uploaded
 */
const checkIfDocumentsCanBeUploadedForCase = async (params, dynamoDB = undefined) => {
    let workflowConfig;
    if (process.env.WORKFLOW_CONFIG_NAME) {
        workflowConfig = await loadWorkflowConfig(process.env.WORKFLOW_CONFIG_NAME, dynamoDB);
    } else {
        const errMsg = "Workflow configuration name not set in Lambda's environment variable";
        console.error(errMsg);
        throw new Error(errMsg);
    }

    const requiredDocTypeMap = new Map();

    if (workflowConfig.MinRequiredDocuments) {
        for (const requiredDocuments of workflowConfig.MinRequiredDocuments) {
            const numDocuments = parseInt(requiredDocuments.NumDocuments);
            requiredDocTypeMap.set(requiredDocuments.DocumentType.toLowerCase(), numDocuments);
        }
    }

    if (!requiredDocTypeMap.has(params.documentType)) {
        console.debug(`Document of type ${params.documentType} is not valid`);
        return false;
    }

    // now we have the total required documents
    // check if the case has required number of documents. only allow to upload if uploaded documents
    // is less than the required documents
    const uploadedDocumentRecords = await SharedLib.getCase({
        caseId: params.caseId,
        ddbTableName: process.env.CASE_DDB_TABLE_NAME
    });

    // initial record has to be filtered out
    const filteredDocRecords = _.filter(uploadedDocumentRecords.Items, (record) => {
        return record.DOCUMENT_ID.S !== SharedLib.casePlaceholderDocumentId;
    });

    const uploadedDocTypeMap = new Map();
    filteredDocRecords.forEach((docRecord) => {
        const docType = docRecord['DOCUMENT_TYPE'].S.toLowerCase();
        let docCount = 0;
        if (uploadedDocTypeMap.has(docType)) {
            docCount = parseInt(uploadedDocTypeMap.get(docType));
        }
        uploadedDocTypeMap.set(docType, docCount + 1);
    });

    if (
        !SharedLib.isUploadMissingDocument(uploadedDocTypeMap, requiredDocTypeMap, params.docType) ||
        uploadedDocTypeMap.size > requiredDocTypeMap.size
    ) {
        console.error('Uploaded document types do not match required document types');
        return false;
    }

    return true;
};

/**
 * Add a record of the document to the dynamoDB case table, and using the
 * parameters generate a PresignedS3Post policy that is used to upload a document
 * directly to the S3 bucket.
 * @param {Object} params
 * @param {String} params.caseId CaseId associated with file
 * @param {String} params.fileExtension Extension of file
 *
 * @returns object containing the properties `url` and `fields`.
 */
const createUploadPostRequest = async (params) => {
    const isUndefined = (val) => typeof val === 'undefined';
    if (Object.values(params).some(isUndefined)) {
        throw new Error('Invalid parameters to create post request. Check `filetype` and `filename` in request');
    }

    const dynamoDB = new AWS.DynamoDB(UserAgentConfig.customAwsConfig());
    const canDocumentBeUploaded = await checkIfDocumentsCanBeUploadedForCase(params, dynamoDB);
    if (canDocumentBeUploaded) {
        const docId = createDocumentId();
        const filekey = createFileKey(params.caseId, docId, params.fileExtension);
        return await generatePresignedS3PostUrl({ ...params, filekey: filekey }); // NOSONAR - false positive. Await required in lambda
    } else {
        const errMsg = 'No more documents can be uploaded';
        console.error(errMsg);
        throw new Error(errMsg);
    }
};

module.exports = {
    createTag,
    createTagSet,
    createUploadPostRequest,
    createDocumentId,
    generatePresignedS3PostUrl,
    createFileKey,
    checkIfDocumentsCanBeUploadedForCase
};
