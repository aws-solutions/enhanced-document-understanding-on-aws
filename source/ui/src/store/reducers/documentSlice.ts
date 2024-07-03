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
