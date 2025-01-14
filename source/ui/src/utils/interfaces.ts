// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
export interface TextractLine {
    text: string;
    pageNumber: number;
    boundingBox: {
        Width: number;
        Height: number;
        Left: number;
        Top: number;
    };
    id: string;
}

export interface TextractKV {
    key: string;
    value: string;
    pageNumber: number;
    keyBoundingBox: {
        Width: number;
        Height: number;
        Left: number;
        Top: number;
    };
    valueBoundingBox: {
        Width: number;
        Height: number;
        Left: number;
        Top: number;
    };
    id: string;
}

export interface TextractTable {
    table: {
        BlockType: string;
        Confidence: number;
        Geometry: Geometry;
        Id: string;
        Relationships?: Relationships[];
        Page: number;
    };
    pageNumber: number;
    rows: Row[];
}

export interface ComprehendEntities {
    // key: string;
    value: string[];
    pageNumber: number;
    keyBoundingBox?: {
        Width: number;
        Height: number;
        Left: number;
        Top: number;
    };
    valueBoundingBox?: {
        Width: number;
        Height: number;
        Left: number;
        Top: number;
    };
    // id: string;
    entity: any;
}

export interface DocumentProcessingResponse {
    textractDetectResponse?: TextractResponse;
    textractAnalyzeResponse?: any;
    comprehendGenericResponse?: ComprehendResponse;
    comprehendMedicalResponse?: ComprehendResponse;
    comprehendPiiResponse?: ComprehendResponse;
}

export interface TextractResponse {
    Bucket?: string;
    UploadedFileName?: string;
    DocumentMetadata: DocumentMetadata;
    JobStatus?: string;
    Blocks?: BlocksEntity[] | null;
    AnalyzeDocumentModelVersion: string;
}

export interface ComprehendResponse {
    results: ComprehendBlocks[];
}

export interface ComprehendBlocks {
    Page: number;
    Entities: Entity[];
}

export interface Entity {
    Score: number;
    Type: string;
    Text: string;
    BeginOffset: number;
    EndOffset: number;
}
export interface DocumentMetadata {
    Pages: number;
}

export interface BlocksEntity {
    BlockType: string;
    Geometry: Geometry;
    Id: string;
    Relationships?: Relationships[] | null;
    Page?: number;
    Confidence?: number | null;
    Text?: string | null;
    TextType?: string | null;
    EntityTypes?: string[] | null;
    RowIndex?: number | null;
    ColumnIndex?: number | null;
    RowSpan?: number | null;
    ColumnSpan?: number | null;
}

export interface Geometry {
    BoundingBox: BoundingBox;
    Polygon?: Polygon[] | null;
}

export interface BoundingBox {
    Width: number;
    Height: number;
    Left: number;
    Top: number;
}

export interface Polygon {
    X: number;
    Y: number;
}

export interface Relationships {
    Type: string;
    Ids?: string[] | null;
}

export interface Marks {
    Width: number;
    Height: number;
    Left: number;
    Top: number;
    id?: string;
    type?: string;
}

export type Row = Cell[];

export type Cell = {
    RowIndex: number;
    ColumnIndex: number;
    RowSpan: number;
    ColumnSpan: number;
    content: string;
    Geometry: Geometry;
};

interface DocumentAttributeValue {
    StringValue: string;
}

interface DocumentAttributeValueCountPair {
    DocumentAttributeValue: DocumentAttributeValue;
    Count: number;
}
export interface FacetResult {
    DocumentAttributeKey: string;
    DocumentAttributeValueType: string;
    DocumentAttributeValueCountPairs: DocumentAttributeValueCountPair[];
}
