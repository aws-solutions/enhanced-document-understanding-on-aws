// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { InferenceRequest } from '../../models/requests/inferenceRequest';
import { InferenceName } from '../../utils/constants';
import { api } from '../api/api';

const INFERENCES_PATH = 'inferences';

export const inferenceApiSlice = api.injectEndpoints({
    endpoints: (builder) => ({
        getInferences: builder.query({
            queryFn: async (arg, _queryApi, _extraOptions, baseQuery) => {
                let unformattedtextractDetectResponse,
                    unformattedtextractAnalyzeResponse,
                    entityGenericResponse,
                    entityMedicalResponse,
                    entityPiiResponse = undefined;

                const validInferencesResponse = await baseQuery(
                    `${INFERENCES_PATH}/${arg.selectedCaseId}/${arg.selectedDocumentId}`
                );
                const validInferences = validInferencesResponse.data as any;

                if (validInferences.includes(InferenceName.TEXTRACT_DETECT_TEXT)) {
                    unformattedtextractDetectResponse = await baseQuery(
                        `${INFERENCES_PATH}/${arg.selectedCaseId}/${arg.selectedDocumentId}/${InferenceName.TEXTRACT_DETECT_TEXT}`
                    );
                }

                if (validInferences.includes(InferenceName.TEXTRACT_ANALYZE_TEXT)) {
                    const response = await baseQuery(
                        `${INFERENCES_PATH}/${arg.selectedCaseId}/${arg.selectedDocumentId}/${InferenceName.TEXTRACT_ANALYZE_TEXT}`
                    );

                    unformattedtextractAnalyzeResponse = response.data as any;
                }

                if (validInferences.includes(InferenceName.COMPREHEND_GENERIC)) {
                    const response = await baseQuery(
                        `${INFERENCES_PATH}/${arg.selectedCaseId}/${arg.selectedDocumentId}/${InferenceName.COMPREHEND_GENERIC}`
                    );

                    entityGenericResponse = response.data as any;
                }

                if (validInferences.includes(InferenceName.COMPREHEND_PII)) {
                    const response = await baseQuery(
                        `${INFERENCES_PATH}/${arg.selectedCaseId}/${arg.selectedDocumentId}/${InferenceName.COMPREHEND_PII}`
                    );
                    entityPiiResponse = response.data as any;
                }

                if (validInferences.includes(InferenceName.COMPREHEND_MEDICAL)) {
                    const response = await baseQuery(
                        `${INFERENCES_PATH}/${arg.selectedCaseId}/${arg.selectedDocumentId}/${InferenceName.COMPREHEND_MEDICAL}`
                    );

                    entityMedicalResponse = response.data as any;
                }
                const returnObject = {
                    textractDetectResponse: formatTextract(unformattedtextractDetectResponse),
                    textractAnalyzeResponse: formatTextract(unformattedtextractAnalyzeResponse),
                    comprehendGenericResponse: entityGenericResponse,
                    comprehendMedicalResponse: entityMedicalResponse,
                    comprehendPiiResponse: entityPiiResponse
                } as any;
                return { data: returnObject };
            }
        }),
        getInferenceByInferenceType: builder.query({
            query: (params: InferenceRequest) => ({
                url: `inferences/${params.caseId}/${params.documentId}/${params.inferenceType}`
            })
        })
    })
});

const formatTextract = (response: any) => {
    if (response) {
        for (let pageNumber = 0; pageNumber < response.length; pageNumber++) {
            response[pageNumber].DocumentMetadata.Pages = response.length;
            for (const block of response[pageNumber].Blocks) {
                block.Page = pageNumber + 1;
            }
        }
    }
    return response;
};

export const { useGetInferencesQuery, useLazyGetInferenceByInferenceTypeQuery } = inferenceApiSlice;
