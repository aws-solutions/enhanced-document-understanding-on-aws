// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { BaseQueryFn, createApi, FetchArgs, fetchBaseQuery, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { generateToken, getRuntimeConfig } from '../../utils/apiHelper';

export const dynamicBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
    args: any,
    api: any,
    extraOptions: any
) => {
    const runtimeConfig = await getRuntimeConfig();
    const rawBaseQuery = fetchBaseQuery({
        baseUrl: runtimeConfig.ApiEndpoint,
        prepareHeaders: async (headers: any) => {
            if (process.env.NODE_ENV !== 'test') {
                const token = await generateToken();
                headers.set('Authorization', `${token}`);
            }
            return headers;
        }
    });
    return rawBaseQuery(args, api, extraOptions);
};
export const api = createApi({
    reducerPath: 'api',
    baseQuery: dynamicBaseQuery,
    tagTypes: ['Cases'],
    endpoints: () => ({
       
    }),
    refetchOnMountOrArgChange: true
});

