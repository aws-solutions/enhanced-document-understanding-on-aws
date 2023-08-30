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

let UPLOAD_DOCS_BUCKET_NAME;
let S3_UPLOAD_PREFIX;

function checkS3BucketNameEnvSetup() {
    if (process.env.UPLOAD_DOCS_BUCKET_NAME) {
        UPLOAD_DOCS_BUCKET_NAME = process.env.UPLOAD_DOCS_BUCKET_NAME;
        console.debug(`UPLOAD_DOCS_BUCKET_NAME is: ${UPLOAD_DOCS_BUCKET_NAME}`);
    } else {
        throw new Error('UPLOAD_DOCS_BUCKET_NAME Lambda Environment variable not set.');
    }
}

function checkS3KeyPrefixEnvSetup() {
    if (process.env.S3_UPLOAD_PREFIX) {
        S3_UPLOAD_PREFIX = process.env.S3_UPLOAD_PREFIX;
        console.debug(`S3_UPLOAD_PREFIX is: ${S3_UPLOAD_PREFIX}`);
    } else {
        throw new Error('S3_UPLOAD_PREFIX Lambda Environment variable not set.');
    }
}

function checkAllEnvSetup() {
    checkS3BucketNameEnvSetup();
    checkS3KeyPrefixEnvSetup();
}

module.exports = { checkAllEnvSetup, checkS3BucketNameEnvSetup, checkS3KeyPrefixEnvSetup };
