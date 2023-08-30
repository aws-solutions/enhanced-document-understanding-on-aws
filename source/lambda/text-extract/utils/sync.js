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

const AWS = require('aws-sdk');
const UserAgentConfig = require('aws-node-user-agent-config');
const utils = require('./generic');
const PdfSplitter = require('./pdf-splitter');
const SharedLib = require('common-node-lib');

let S3_MULTI_PAGE_PDF_PREFIX;

/**
 * Checks the Lambda environment variables for Textract. It sets:
 *
 * `S3_MULTI_PAGE_PDF_PREFIX`: the Lambda environment variables for prefix where the pages of a multi-page
 * pdf document will be split and saved to.
 *
 * - If any of the above are not set, it will throw an error.
 *
 */
exports.checkTextractSyncEnvSetup = () => {
    if (process.env.S3_MULTI_PAGE_PDF_PREFIX) {
        S3_MULTI_PAGE_PDF_PREFIX = process.env.S3_MULTI_PAGE_PDF_PREFIX;
        console.debug(`S3_MULTI_PAGE_PDF_PREFIX is: ${S3_MULTI_PAGE_PDF_PREFIX}`);
    } else {
        throw new Error('S3_MULTI_PAGE_PDF_PREFIX Lambda Environment variable not set.');
    }
};

/**
 * Runs the textract inference on a given document, choosing which inference(s) to run based on SQS record content
 *
 * @param {string} taskToken
 * @param {Object} sqsRecord The record from SQS which triggered the workflow
 * @param {string=} requestAccountId S3 Bucket expected owner account id
 * @returns {Object} the textract responses as a set of key:value pairs with the inferenceType as key and s3 location
 * of inferences as value. These will be added to the 'inferences' field of the document which was processed in the
 * main event payload to be sent back to the stepfunction.
 */
exports.runSyncTextractJob = async (taskToken, sqsRecord, requestAccountId) => {
    let documentType;
    let documentInfo = JSON.parse(sqsRecord.body).input.document;
    let formattedInferences;

    const textractResponses = [];

    const bucket = documentInfo.s3Bucket;
    const [, , fileExtension] = utils.extractS3UriComponents(documentInfo.s3Prefix);

    try {
        // prettier-ignore
        const keyPrefixList = await this.createObjectKeyList({  //NOSONAR - non-redundant await
            s3Key: documentInfo.s3Prefix,
            fileExtension: fileExtension
        });

        if (!utils.supportedImageTypes.includes(fileExtension)) {
            const errMessage = `Unsupported file type: ${fileExtension}. Supported file types are: ${utils.supportedImageTypes.join(
                ', '
            )}`;
            throw new Error(errMessage);
        }

        documentType = utils.getTextractApiType(documentInfo.selfCertifiedDocType);
        const isAnalyzeJobRequired = documentInfo.runTextractAnalyzeAction;

        for (const key of keyPrefixList) {
            let textractResponse = await this.startSyncTextDetectionJob(taskToken, bucket, key);

            if (isAnalyzeJobRequired) {
                // prettier-ignore
                const textractAnalyzeResponse = await this.startAnalyzeJob( //NOSONAR - non-redundant await
                    taskToken,
                    bucket,
                    key,
                    documentType,
                    documentInfo.analyzeDocFeatureType
                );
                textractResponse = Object.assign(textractResponse, textractAnalyzeResponse);
            }
            textractResponses.push(textractResponse);
        }

        // prettier-ignore
        formattedInferences = await this.uploadSyncTextractInferences(  //NOSONAR - non-redundant await
            documentInfo,
            this.formatTextractResponses(textractResponses),
            requestAccountId
        );
    } catch (error) {
        console.error(error);
        throw error;
    }

    return { inferences: formattedInferences };
};

/**
 * Check if the AnalyzeDocFeatureType, received from the document payload,
 * created by the workflow orchestrator are valid.
 * It should raise an error if the featureTypes list contains invalid entries.
 * @param {string[]=} analyzeDocFeatureType Textract AnlyzeDocument FeatureTypes.
 *      This could also be `null` or a value that js resolves to false.
 * @throws {Error} Error: Invalid `AnalyzeDocFeatureType`
 * @returns True if `textract.analyzeDocument` can be executed, false otherwise
 */
exports.isAnalyzeDocParamValid = (analyzeDocFeatureType) => {
    const supportedFeatureTypes = Object.keys(SharedLib.TextractDefaults.ANALYZE_DOC_FEATURE_TYPES);
    if (analyzeDocFeatureType) {
        if (!analyzeDocFeatureType.every((feat) => supportedFeatureTypes.includes(feat.toUpperCase()))) {
            console.error(`Error: Invalid 'AnalyzeDocFeatureType'. Supported feature types: ${supportedFeatureTypes}`);
            throw new Error('Error: Invalid `AnalyzeDocFeatureType`');
        }
        return true;
    }
    return false;
};

/**
 * Given a list of textract responses corresponding to the number of api calls, one
 * for each page in a multi page pdf doc, this function returns an object whose key is
 * the textract api type and the value is a list of responses. For single page documents
 * a list with only one item is returned in this list of responses.
 * ```
 * {
 *      "textract-detectText": [
 *          {"textract response for pg1"},
 *          {"textract response for pg2"}
 *      ]
 * }
 * ```
 * @param {Array[Object]} textractResponseList list of responses from calling textract
 * @returns {Object} formatted response
 */
exports.formatTextractResponses = (textractResponseList) => {
    const formattedResponse = {};
    // single page conditions

    textractResponseList.forEach((response) => {
        for (const [apiName, apiResponse] of Object.entries(response)) {
            if (apiName in formattedResponse) {
                formattedResponse[apiName].push(apiResponse);
            } else {
                formattedResponse[apiName] = [apiResponse];
            }
        }
    });

    return formattedResponse;
};

/**
 * Given the key of a file this returns a list containing the file key. If the file is a pdf
 * this function uses the `pdf-splitter` to extract and save each page, and then return a list
 * of the saved object keys.
 *
 * @param {Object} params Parameters used to create list of s3 keys to run textract on
 * @param {string} params.s3Key Key of the uploaded file
 * @param {string} params.fileExtension Extension of the file.
 * @param {string=} params.s3Bucket [process.env.DOCUMENT_BUCKET_NAME]
 * @returns {string[]}
 */
exports.createObjectKeyList = async (params) => {
    const s3Key = params.s3Key;
    const fileExt = params.fileExtension;

    if (fileExt === 'pdf') {
        return PdfSplitter.splitAndSavePdfPages(params);
    } else {
        return [s3Key];
    }
};

/**
 * Given the inferences for the document being processed, upload the inference data to s3 and add DDB attribute(s)
 * for this document pointing to the s3 location of the inference files.
 *
 * @param {Object} documentInfo The body.input.document field of the SQS input, containing info about the document
 * @param {Object} inferences The inferences to be uploaded, generated by text detection and/or analysis. Should be
 * key:value pairs where key is the inferenceType (name) and value is the contents of the inference.
 * @param {string=} requestAccountId S3 Bucket expected owner account id
 *
 * @returns {Object} key:value pairs of inferenceType and s3Key for the inference
 */
exports.uploadSyncTextractInferences = async (documentInfo, inferences, requestAccountId) => {
    const uploadObj = { document: documentInfo, inferences: inferences };
    const s3Results = await SharedLib.uploadDocumentInferences(uploadObj, requestAccountId);
    const ddbResults = await SharedLib.updateInferences(s3Results);
    if (ddbResults.length != s3Results.length) {
        throw new Error(
            `Something went wrong while updating inferences. ${s3Results.length} inferences were uploaded to s3, while ${ddbResults.length} records were updated in DynamoDB. These values should be equal.`
        );
    }

    // formats the desired 'inferences' output
    let output = {};
    for (const inferenceInfo of s3Results) {
        output[inferenceInfo.inferenceType] = inferenceInfo.s3Key;
    }
    return output;
};

exports.startSyncTextDetectionJob = async (taskToken, bucket, key) => {
    const textract = new AWS.Textract(UserAgentConfig.customAwsConfig());
    let textractParams, textractResponse;
    const cloudWatch = new SharedLib.CloudWatchMetrics(SharedLib.CloudwatchNamespace.WORKFLOW_TYPES);

    try {
        textractParams = {
            Document: {
                S3Object: {
                    Bucket: bucket,
                    Name: key
                }
            }
        };

        textractResponse = await textract.detectDocumentText(textractParams).promise();
        await cloudWatch.publishMetrics(SharedLib.TextractAPIs.TEXTRACT_DETECT_TEXT_SYNC);
        return {
            [SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT]: textractResponse
        };
    } catch (error) {
        console.error(
            `Failed to extract text in Textract Sync job for params: ${JSON.stringify(
                textractParams
            )}$ and taskToken ${taskToken}`
        );

        await cloudWatch.publishMetrics(SharedLib.TextractAPIs.TEXTRACT_SYNC_FAILURES);
        throw error;
    }
};

/**
 * Method handling running different textract analysis jobs based on input
 *
 * @param {string} taskToken
 * @param {string} bucket
 * @param {string} key
 * @param {string} documentType see documentTypes enum for choices
 * @param {string[]} featureTypes one or more of "TABLES", "FORMS", "SIGNATURES"
 * @returns {Object} key:value pairs of key inferenceType and value the inference contents
 */
exports.startAnalyzeJob = async (taskToken, bucket, key, documentType, featureTypes) => {
    if (documentType == utils.documentTypes.Expense) {
        console.debug(`Textract Sync - Processing Expense Document for taskToken ${taskToken}`);

        const textractResponse = await this.textractAnalyzeExpense(taskToken, bucket, key);
        return {
            [SharedLib.InferenceTypes.TEXTRACT_ANALYZE_EXPENSE]: textractResponse
        };
    } else if (documentType == utils.documentTypes.ID) {
        console.debug(`Textract Sync - Processing ID Document for taskToken ${taskToken}`);

        const textractIdResponse = await this.textractAnalyzeID(taskToken, bucket, key);
        return {
            [SharedLib.InferenceTypes.TEXTRACT_ANALYZE_ID]: textractIdResponse
        };
    } else {
        console.debug(`Textract Sync - Processing Generic Document Type for taskToken ${taskToken}`);
        let textractDocResults;
        if (this.isAnalyzeDocParamValid(featureTypes)) {
            textractDocResults = await this.textractAnalyzeDocument(taskToken, bucket, key, featureTypes);
        } else {
            console.log('Textract AnalyzeDocument request parameters missing or invalid. Using defaults');
            textractDocResults = await this.textractAnalyzeDocument(
                taskToken,
                bucket,
                key,
                Object.keys(SharedLib.TextractDefaults.ANALYZE_DOC_FEATURE_TYPES)
            );
        }
        return {
            [SharedLib.InferenceTypes.TEXTRACT_ANALYZE_DOCUMENT]: textractDocResults
        };
    }
};

/**
 * Calls the `Textract.AnalyzeDocument` service with the received params
 * @param {string} taskToken Task token from step function state machine
 * @param {string} bucket Bucket where document is stored
 * @param {string} key Key of the object in the bucket
 * @param {string[]} featureTypes AnalyzeDocument featureTypes list
 * @returns
 */
exports.textractAnalyzeDocument = async (taskToken, bucket, key, featureTypes) => {
    const textract = new AWS.Textract(UserAgentConfig.customAwsConfig());
    let textractParams, textractResponse;
    const cloudWatch = new SharedLib.CloudWatchMetrics(SharedLib.CloudwatchNamespace.WORKFLOW_TYPES);

    try {
        textractParams = {
            Document: {
                S3Object: {
                    Bucket: bucket,
                    Name: key
                }
            },
            FeatureTypes: featureTypes
        };

        textractResponse = await textract.analyzeDocument(textractParams).promise();
        await cloudWatch.publishMetrics(SharedLib.TextractAPIs.TEXTRACT_ANALYZE_DOCUMENT_SYNC);
        return textractResponse;
    } catch (error) {
        console.error(
            `Failed to extract text in Textract Sync job for params: ${JSON.stringify(
                textractParams
            )}. TaskToken: ${taskToken}`
        );
        await cloudWatch.publishMetrics(SharedLib.TextractAPIs.TEXTRACT_SYNC_FAILURES);
        throw error;
    }
};

/**
 * Execute the Textract analyzeExpense API call synchronously.
 * @param {*} taskToken Task token from step function state machine
 * @param {*} bucket S3 bucket where document to analyze is stored
 * @param {*} key Key of the file
 * @returns Textract analyze expense response
 */
exports.textractAnalyzeExpense = async (taskToken, bucket, key) => {
    const textract = new AWS.Textract(UserAgentConfig.customAwsConfig());
    let textractParams, textractResponse;
    const cloudWatch = new SharedLib.CloudWatchMetrics(SharedLib.CloudwatchNamespace.WORKFLOW_TYPES);

    try {
        textractParams = {
            Document: {
                S3Object: {
                    Bucket: bucket,
                    Name: key
                }
            }
        };

        textractResponse = await textract.analyzeExpense(textractParams).promise();
        await cloudWatch.publishMetrics(SharedLib.TextractAPIs.TEXTRACT_ANALYZE_EXPENSE_SYNC);
    } catch (error) {
        console.error(
            `Failed to extract text in AnalyzeExpense Sync job for params: ${JSON.stringify(
                textractParams
            )}. TaskToken: ${taskToken}`
        );
        await cloudWatch.publishMetrics(SharedLib.TextractAPIs.TEXTRACT_SYNC_FAILURES);
        throw error;
    }
    return textractResponse;
};

/**
 * Execute the Textract analyzeID API call synchronously.
 * @param {*} taskToken Task token from step function state machine
 * @param {*} bucket S3 bucket where document to analyze is stored
 * @param {*} key Key of the file
 * @returns Textract analyze ID response
 */
exports.textractAnalyzeID = async (taskToken, bucket, key) => {
    let textractParams, textractResponse;
    const textract = new AWS.Textract(UserAgentConfig.customAwsConfig());
    const cloudWatch = new SharedLib.CloudWatchMetrics(SharedLib.CloudwatchNamespace.WORKFLOW_TYPES);

    try {
        textractParams = {
            DocumentPages: [
                {
                    S3Object: {
                        Bucket: bucket,
                        Name: key
                    }
                }
            ]
        };

        textractResponse = await textract.analyzeID(textractParams).promise();
        await cloudWatch.publishMetrics(SharedLib.TextractAPIs.TEXTRACT_ANALYZE_ID_SYNC);
    } catch (error) {
        console.error(
            `Failed to extract text in AnalyzeID Sync job for params: ${JSON.stringify(
                textractParams
            )}. TaskToken: ${taskToken}`
        );

        await cloudWatch.publishMetrics(SharedLib.TextractAPIs.TEXTRACT_SYNC_FAILURES);
        throw error;
    }
    return textractResponse;
};
