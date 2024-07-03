/**********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the License). You may not use this file except in compliance      *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

import { GetDocumentRequest } from '../../models/requests/getDocumentRequest';
import { UploadDocumentRequest } from '../../models/requests/uploadDocumentRequest';
import { api } from '../api/api';

export const documentApiSlice = api.injectEndpoints({
    endpoints: (builder) => ({
        uploadDocument: builder.mutation({
            query: (body: UploadDocumentRequest) => ({
                url: 'document',
                method: 'POST',
                body
            }),
            invalidatesTags: ['Cases']
        }),
        documentToDownload: builder.query({
            query: (key: Record<string, string>) => ({
                url: 'document/download',
                params: key
            }),
        }),
       
        getDocumentByCaseAndDocumentId: builder.query({
           query: (params: GetDocumentRequest) => ({
            url: `document/${params.caseId}/${params.documentId}`,
            params: {redacted: params.redacted}
           }) 
        })
    })
});

export const { useUploadDocumentMutation, useLazyGetDocumentByCaseAndDocumentIdQuery, useLazyDocumentToDownloadQuery } = documentApiSlice;
