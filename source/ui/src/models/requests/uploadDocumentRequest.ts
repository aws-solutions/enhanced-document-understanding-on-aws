// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


export interface UploadDocumentRequest {
    userId?: string,
    caseId?: string,
    caseName?: string,
    fileName: string,
    fileExtension:  string,
    documentType:string
}