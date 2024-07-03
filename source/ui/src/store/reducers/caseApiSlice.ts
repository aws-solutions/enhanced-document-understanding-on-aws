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
