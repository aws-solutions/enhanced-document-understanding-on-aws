// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
