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

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { CASE_PLACEHOLDER_DOCUMENT_ID, DISPLAY_DATE_FORMAT } from '../utils/constants';

dayjs.extend(utc);

export type CaseDoc = {
    name: string;
    dateCreated: string;
    fileType: 'pdf' | 'png' | 'jpg' | 'jpeg' | '';
    status?: string;
    caseDocuments?: CaseDoc[];
};

export type CaseIdToStatus = {
    [caseId: string]: string;
};

/**
 * Transform the response of the dynamoDB query to an array of objects with the following shape:
 *
 * [
 *  {
 *      name: 'caseId',
 *      dateCreated: 'dateCreated',
 *      caseDocuments: [
 *          {
 *              name: 'documentId',
 *              fileType: 'fileType',
 *              status: 'status',
 *              dateCreated: 'dateCreated'
 *          ],
 *  },
 *  {...}
 * ]
 * @param results The `Items` of a response from DynamoDB for a query to retrieve all cases
 *      for a given user
 * @returns
 */
export function mapResultsToCases(results: any[]): any[] {
    const cases: any = {};
    const caseIdToStatus: CaseIdToStatus = {};

    // Retrieve the case status from the default entry with docId="0000" form results
    for (const result of results) {
        if (result.DOCUMENT_ID.S === CASE_PLACEHOLDER_DOCUMENT_ID) {
            caseIdToStatus[result.CASE_ID.S] = result.STATUS.S;
        }
    }

    // Group records with the same caseId together
    for (const result of results) {
        const caseId = result.CASE_ID.S;
        if (!cases[caseId]) {
            cases[caseId] = {
                caseId: caseId,
                name: result.CASE_NAME.S,
                caseDocuments: [],
                status: caseIdToStatus[caseId]
            };
        }

        if (result.DOCUMENT_ID.S !== CASE_PLACEHOLDER_DOCUMENT_ID) {
            cases[caseId].caseDocuments.push({
                docId: result.DOCUMENT_ID.S,
                name: result.UPLOADED_FILE_NAME.S,
                fileType: result.UPLOADED_FILE_EXTENSION.S,
                dateCreated: dayjs.utc(result.CREATION_TIMESTAMP.S).local().format(DISPLAY_DATE_FORMAT),
                docType: result.DOCUMENT_TYPE.S
            });
        } else {
            // as case creation timestamp is different from document creation timestamp
            cases[caseId].dateCreated = dayjs.utc(result.CREATION_TIMESTAMP.S).local().format(DISPLAY_DATE_FORMAT);
        }
    }
    return Object.values(cases);
}
