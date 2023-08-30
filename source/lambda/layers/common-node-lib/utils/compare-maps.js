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

/**
 * Compare 2 maps, if docUploadedMap (first parameter) is missing a key entry or its value is less than requiredDocsMaps's key,
 * it will return true, else false
 *
 * @param {*} docUploadedMap - map of documents uploaded <doc type, count>
 * @param {*} requiredDocsMap - map of documents required by the workflow configuration <doc type, count>
 * @param {*} newUploadDocType - the type of document being uploaded. This parameter will only be passed when called
 * from upload functionality. The workflow orchestrator lambda will not pass this parameter. The workflow orchestrator
 * lambda only checks if the uploaded documents align with what is required by the configuration.
 * @returns true/ false
 */
function isUploadMissingDocument(docUploadedMap, requiredDocsMap, newUploadDocType = undefined) {
    if (docUploadedMap == undefined) {
        return false;
    }

    if (requiredDocsMap === undefined) {
        console.error('The requiredDocsMap is not defined and hence it cannot perform comparison');
        throw new Error('Cannot perform comparison');
    }

    for (let [requiredDocType, requiredDocCount] of requiredDocsMap) {
        const uploadedDocCount = docUploadedMap.get(requiredDocType);

        if ((!newUploadDocType && uploadedDocCount === undefined) || uploadedDocCount < requiredDocCount) {
            console.debug(
                `Document of type ${requiredDocType} either does not exist or is still allowed to be uploaded`
            );
            return true;
        } else if (
            newUploadDocType === requiredDocType &&
            (uploadedDocCount === undefined || uploadedDocCount < requiredDocCount)
        ) {
            return true;
        }
    }

    console.debug('Returning false. since all documents are uploaded');
    return false;
}

module.exports = { isUploadMissingDocument };
