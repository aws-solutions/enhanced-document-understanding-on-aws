// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { api } from '../api/api';
import { mapResultsToCases, mapResultsToDocuments, mapResultsToPaginatedCases } from '../../components/makeData';

export const caseApiSlice = api.injectEndpoints({
    endpoints: (builder) => ({
        getCases: builder.query({
            query: () => ({
                url: 'cases'
            }),

            transformResponse: (response: any) => {
                return mapResultsToCases(response.Items);
            },
            providesTags: ['Cases']
        }),
        getPaginatedCases: builder.query({
            query: (params: any) => ({
                url: 'cases',
                params
            }),
            transformResponse: (response: any) => {
                return { response, cases: mapResultsToPaginatedCases(response.Items) };
            },
            providesTags: ['Cases']
        }),
        getCaseByCaseId: builder.query({
            query: (caseId: string) => ({
                url: `case/${caseId}`
            }),
            transformResponse: (response: any) => {
                return mapResultsToDocuments(response.Items);
            }
        }),
        startJob: builder.mutation({
            query: (body) => ({
                url: 'case/start-job',
                method: 'POST',
                body
            }),
            invalidatesTags: ['Cases']
        }),
        createCase: builder.mutation({
            query: (body) => ({
                url: 'case',
                method: 'POST',
                body
            }),
            invalidatesTags: ['Cases']
        })
    })
});

export const {
    useGetPaginatedCasesQuery,
    useGetCasesQuery,
    useStartJobMutation,
    useCreateCaseMutation,
    useLazyGetCasesQuery,
    useLazyGetCaseByCaseIdQuery,
    useLazyGetPaginatedCasesQuery
} = caseApiSlice;
