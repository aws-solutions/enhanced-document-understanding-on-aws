// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { combineReducers } from "@reduxjs/toolkit";
import { api } from "../api/api";
import { entitySlice } from "./entitySlice";
import { documentSlice } from "./documentSlice";

const rootReducer = combineReducers({
    [api.reducerPath]: api.reducer,
    [entitySlice.name]: entitySlice.reducer,
    [documentSlice.name]: documentSlice.reducer
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
