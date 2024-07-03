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

