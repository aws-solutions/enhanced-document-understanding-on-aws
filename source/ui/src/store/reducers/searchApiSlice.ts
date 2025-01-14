// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { api } from "../api/api";

export const searchApiSlice = api.injectEndpoints({
    endpoints: (builder) => ({
       queryOpenSearch: builder.query({
        query: (params) => ({
            url: `search/opensearch/${params.searchValue}`,
            params: params.params
        })
       }),
       queryKendra: builder.query({
        query: (params) => ({
            url: `search/kendra/${params.searchValue}`,
            params: params.params
        })
       })
    })
})

export const {useLazyQueryOpenSearchQuery, useLazyQueryKendraQuery} = searchApiSlice