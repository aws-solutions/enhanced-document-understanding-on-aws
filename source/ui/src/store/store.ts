// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { configureStore, } from "@reduxjs/toolkit";
import { api } from "./api/api";
import rootReducer, { RootState } from "./reducers/rootReducer";

export const setupStore = (preloadedState: Partial<RootState>) => {
    return configureStore({
        reducer: rootReducer,
        preloadedState,
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({
                immutableCheck: false,
                serializableCheck: false
            }).concat(api.middleware)
    });
};

// Inferred type: {}
export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore["dispatch"];
