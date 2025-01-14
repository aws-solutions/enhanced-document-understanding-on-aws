// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { StatusIndicatorProps } from "@cloudscape-design/components";
import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "./rootReducer";

interface EntityState {
    status?: StatusIndicatorProps.Type 
}

export const entityInitialState: EntityState = {
status: undefined
} 

export const entitySlice = createSlice({
    name: 'entity',
    initialState: entityInitialState,
    reducers: ({
        setStatus: (state: EntityState, action) => {
            state.status = action.payload
        }
    })
})

export const {setStatus} = entitySlice.actions

export const selectEntityStatus = (state: RootState) => state.entity.status