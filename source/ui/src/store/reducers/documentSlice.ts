// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { createSlice } from '@reduxjs/toolkit';
import { DocumentProcessingResponse } from '../../utils/interfaces';
import { RootState } from './rootReducer';
import { inferenceApiSlice } from './inferenceApiSlice';
import { caseApiSlice } from './caseApiSlice';

interface DocumentState {
    documentProcessingResults: DocumentProcessingResponse;
    filterText: string;
    lastEvaluatedKey?: boolean;
}

export const documentState: DocumentState = {
    documentProcessingResults: {
        textractDetectResponse: {
            Bucket: '',
            UploadedFileName: '',
            DocumentMetadata: { Pages: 0 },
            JobStatus: '',
            AnalyzeDocumentModelVersion: ''
        },
        comprehendGenericResponse: {
            results: []
        },
        comprehendMedicalResponse: {
            results: []
        },
        comprehendPiiResponse: {
            results: []
        }
    },
    filterText: '',
    lastEvaluatedKey: undefined
};

export const documentSlice = createSlice({
    name: 'document',
    initialState: documentState,
    reducers: {
        setFilterText: (state: DocumentState, { payload }) => {
            state.filterText = payload;
        },
        setLastEvaluatedKey: (state: DocumentState, { payload }) => {
            state.lastEvaluatedKey = payload;
        }
    },
    extraReducers(builder) {
        builder
            .addMatcher(inferenceApiSlice.endpoints.getInferences.matchFulfilled, (state, { payload }) => {
                state.documentProcessingResults = payload;
            })
            .addMatcher(caseApiSlice.endpoints.getPaginatedCases.matchFulfilled, (state, { payload }) => {
                state.lastEvaluatedKey = payload.response.lastEvaluatedKey;
            });
    }
});

export const { setFilterText, setLastEvaluatedKey } = documentSlice.actions;

export const selectDocumentProcessingResult = (state: RootState) => state.document.documentProcessingResults;
export const selectFilterText = (state: RootState) => state.document.filterText;
export const selectLastEvaluatedKey = (state: RootState) => state.document.lastEvaluatedKey;
