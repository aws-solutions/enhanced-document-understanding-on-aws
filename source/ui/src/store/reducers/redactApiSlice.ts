// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { api } from "../api/api";

export const redactApiSlice = api.injectEndpoints({
    endpoints: (builder) => ({
        redact: builder.mutation({
            query: (params) => ({
                url: `redact/${params.caseId}/${params.documentId}`,
                body: params.body,
                method: 'POST'
            })
        })
    })
})

export const {useRedactMutation} = redactApiSlice