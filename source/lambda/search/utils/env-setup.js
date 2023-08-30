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

let KENDRA_INDEX_ID;

function checkKendraIndexIdEnvSetup() {
    if (process.env.KENDRA_INDEX_ID) {
        KENDRA_INDEX_ID = process.env.KENDRA_INDEX_ID;
    } else {
        throw new Error(
            'KENDRA_INDEX_ID Lambda Environment variable not set. Ensure you have set the DeployKendraIndex parameter to "Yes" when deploying the CloudFormation template'
        );
    }
}

function checkAllEnvSetup() {
    checkKendraIndexIdEnvSetup();
}

module.exports = {
    checkKendraIndexIdEnvSetup,
    checkAllEnvSetup
};
