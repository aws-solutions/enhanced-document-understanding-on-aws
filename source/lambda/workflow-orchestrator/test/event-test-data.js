// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';
const SharedLib = require('common-node-lib');

exports.casePayload = {
    case: {
        id: 'mock-user-id:mock-case-id',
        documentList: [
            {
                document: {
                    id: 'doc1',
                    s3Bucket: 'my-bucket',
                    s3Prefix: 'path/to/doc1',
                    selfCertifiedDocType: 'passport',
                    uploadedFileExtension: '.pdf',
                    uploadedFileName: 'single-page-Insulin.pdf'
                }
            },
            {
                document: {
                    id: 'doc2',
                    s3Bucket: 'my-bucket',
                    s3Prefix: 'path/to/doc2',
                    selfCertifiedDocType: 'passport',
                    uploadedFileExtension: '.pdf',
                    uploadedFileName: 'single-page-Insulin.pdf'
                }
            }
        ]
    }
};

// note unused fields (Geometry, Id, Relationships, Confidence) are omitted
exports.textractDetectTextInference = [
    {
        'DocumentMetadata': {
            'Pages': 1
        },
        'Blocks': [
            {
                'BlockType': 'PAGE'
            },
            {
                'BlockType': 'LINE',
                'Text': 'This is a 2023 test about John'
            },
            {
                'BlockType': 'LINE',
                'Text': 'Doe, New York.'
            },
            {
                'BlockType': 'WORD',
                'Text': 'This'
            },
            {
                'BlockType': 'WORD',
                'Text': 'is'
            },
            {
                'BlockType': 'WORD',
                'Text': 'a'
            },
            {
                'BlockType': 'WORD',
                'Text': '2023'
            },
            {
                'BlockType': 'WORD',
                'Text': 'test'
            },
            {
                'BlockType': 'WORD',
                'Text': 'about'
            },
            {
                'BlockType': 'WORD',
                'Text': 'John'
            },
            {
                'BlockType': 'WORD',
                'Text': 'Doe,'
            },
            {
                'BlockType': 'WORD',
                'Text': 'New'
            },
            {
                'BlockType': 'WORD',
                'Text': 'York.'
            }
        ]
    },
    {
        'DocumentMetadata': {
            'Pages': 1
        },
        'Blocks': [
            {
                'BlockType': 'PAGE'
            },
            {
                'BlockType': 'LINE',
                'Text': 'This is a 2023 test about John'
            },
            {
                'BlockType': 'LINE',
                'Text': 'Doe, New York.'
            },
            {
                'BlockType': 'WORD',
                'Text': 'This'
            },
            {
                'BlockType': 'WORD',
                'Text': 'is'
            },
            {
                'BlockType': 'WORD',
                'Text': 'a'
            },
            {
                'BlockType': 'WORD',
                'Text': '2023'
            },
            {
                'BlockType': 'WORD',
                'Text': 'test'
            },
            {
                'BlockType': 'WORD',
                'Text': 'about'
            },
            {
                'BlockType': 'WORD',
                'Text': 'John'
            },
            {
                'BlockType': 'WORD',
                'Text': 'Doe,'
            },
            {
                'BlockType': 'WORD',
                'Text': 'New'
            },
            {
                'BlockType': 'WORD',
                'Text': 'York.'
            }
        ]
    }
];

exports.expectedFormattedTextractInference = 'This is a 2023 test about John Doe, New York. This is a 2023 test about John Doe, New York. ';

exports.genericComprehendInference = [
    {
        'Entities': [
            {
                'Score': 0.6751586198806763,
                'Type': 'LOCATION',
                'Text': 'WA',
                'BeginOffset': 0,
                'EndOffset': 2
            },
            {
                'Score': 0.5226935148239136,
                'Type': 'LOCATION',
                'Text': 'USA',
                'BeginOffset': 3,
                'EndOffset': 6
            },
            {
                'Score': 0.5826425552368164,
                'Type': 'LOCATION',
                'Text': 'WASHINGTON',
                'BeginOffset': 7,
                'EndOffset': 17
            },
            {
                'Score': 0.6758446097373962,
                'Type': 'OTHER',
                'Text': '4d',
                'BeginOffset': 54,
                'EndOffset': 56
            },
            {
                'Score': 0.8393774032592773,
                'Type': 'PERSON',
                'Text': 'JOHN',
                'BeginOffset': 111,
                'EndOffset': 115
            },
            {
                'Score': 0.9801120162010193,
                'Type': 'DATE',
                'Text': '09/04/1958',
                'BeginOffset': 124,
                'EndOffset': 134
            },
            {
                'Score': 0.8836186528205872,
                'Type': 'OTHER',
                'Text': '4a',
                'BeginOffset': 135,
                'EndOffset': 137
            },
            {
                'Score': 0.9958600401878357,
                'Type': 'DATE',
                'Text': '09/04/2018',
                'BeginOffset': 142,
                'EndOffset': 152
            },
            {
                'Score': 0.8921090960502625,
                'Type': 'OTHER',
                'Text': '8',
                'BeginOffset': 153,
                'EndOffset': 154
            },
            {
                'Score': 0.5698011517524719,
                'Type': 'OTHER',
                'Text': '123',
                'BeginOffset': 155,
                'EndOffset': 158
            },
            {
                'Score': 0.9484580755233765,
                'Type': 'OTHER',
                'Text': '99999-0000',
                'BeginOffset': 187,
                'EndOffset': 197
            },
            {
                'Score': 0.6990535259246826,
                'Type': 'QUANTITY',
                'Text': 'EYES',
                'BeginOffset': 210,
                'EndOffset': 214
            },
            {
                'Score': 0.6251657009124756,
                'Type': 'QUANTITY',
                'Text': '16 HGT',
                'BeginOffset': 219,
                'EndOffset': 225
            },
            {
                'Score': 0.8497001528739929,
                'Type': 'QUANTITY',
                'Text': '5\'',
                'BeginOffset': 226,
                'EndOffset': 228
            },
            {
                'Score': 0.881376326084137,
                'Type': 'QUANTITY',
                'Text': '08"',
                'BeginOffset': 229,
                'EndOffset': 232
            },
            {
                'Score': 0.4256371855735779,
                'Type': 'QUANTITY',
                'Text': '17',
                'BeginOffset': 233,
                'EndOffset': 235
            },
            {
                'Score': 0.8605526089668274,
                'Type': 'QUANTITY',
                'Text': '165 lb',
                'BeginOffset': 240,
                'EndOffset': 246
            },
            {
                'Score': 0.6469023823738098,
                'Type': 'OTHER',
                'Text': '9a',
                'BeginOffset': 263,
                'EndOffset': 265
            },
            {
                'Score': 0.6550707221031189,
                'Type': 'OTHER',
                'Text': '4b',
                'BeginOffset': 282,
                'EndOffset': 284
            },
            {
                'Score': 0.9722458124160767,
                'Type': 'DATE',
                'Text': '09/04/2024',
                'BeginOffset': 289,
                'EndOffset': 299
            },
            {
                'Score': 0.9793993830680847,
                'Type': 'PERSON',
                'Text': 'John ASample',
                'BeginOffset': 300,
                'EndOffset': 312
            },
            {
                'Score': 0.9956957101821899,
                'Type': 'DATE',
                'Text': '01/06/2015',
                'BeginOffset': 355,
                'EndOffset': 365
            }
        ]
    }
];

exports.expectedFormattedGenericComprehendInference = {
    'DATE': [
        '09/04/1958',
        '09/04/2018',
        '09/04/2024',
        '01/06/2015'
    ],
    'LOCATION': [
        'WA',
        'USA',
        'WASHINGTON'
    ],
    'OTHER': [
        '4d',
        '4a',
        '8',
        '123',
        '99999-0000',
        '9a',
        '4b'
    ],
    'PERSON': [
        'JOHN',
        'John ASample'
    ],
    'QUANTITY': [
        'EYES',
        '16 HGT',
        '5\'',
        '08"',
        '17',
        '165 lb'
    ]
};

exports.medicalComprehendInference = [
    {
        'Entities': [
            {
                'Id': 11,
                'BeginOffset': 0,
                'EndOffset': 40,
                'Score': 0.9585031867027283,
                'Text': 'WA USA WASHINGTON DRIVER LICENSE FEDERAL',
                'Category': 'PROTECTED_HEALTH_INFORMATION',
                'Type': 'ADDRESS',
                'Traits': []
            },
            {
                'Id': 12,
                'BeginOffset': 111,
                'EndOffset': 117,
                'Score': 0.46847689151763916,
                'Text': 'JOHN A',
                'Category': 'PROTECTED_HEALTH_INFORMATION',
                'Type': 'NAME',
                'Traits': []
            },
            {
                'Id': 13,
                'BeginOffset': 124,
                'EndOffset': 134,
                'Score': 0.9999805688858032,
                'Text': '09/04/1958',
                'Category': 'PROTECTED_HEALTH_INFORMATION',
                'Type': 'DATE',
                'Traits': []
            },
            {
                'Id': 14,
                'BeginOffset': 142,
                'EndOffset': 152,
                'Score': 0.9999794960021973,
                'Text': '09/04/2018',
                'Category': 'PROTECTED_HEALTH_INFORMATION',
                'Type': 'DATE',
                'Traits': []
            },
            {
                'Id': 15,
                'BeginOffset': 179,
                'EndOffset': 192,
                'Score': 0.7516414523124695,
                'Text': 'CITY WA 99999',
                'Category': 'PROTECTED_HEALTH_INFORMATION',
                'Type': 'ADDRESS',
                'Traits': []
            },
            {
                'Id': 1,
                'BeginOffset': 210,
                'EndOffset': 214,
                'Score': 0.6811714172363281,
                'Text': 'EYES',
                'Category': 'ANATOMY',
                'Type': 'SYSTEM_ORGAN_SITE',
                'Traits': []
            },
            {
                'Id': 7,
                'BeginOffset': 236,
                'EndOffset': 239,
                'Score': 0.9781067967414856,
                'Text': 'WGT',
                'Category': 'TEST_TREATMENT_PROCEDURE',
                'Type': 'TEST_NAME',
                'Traits': [],
                'Attributes': [
                    {
                        'Type': 'TEST_VALUE',
                        'Score': 0.9908319115638733,
                        'RelationshipScore': 0.988867461681366,
                        'RelationshipType': 'TEST_VALUE',
                        'Id': 8,
                        'BeginOffset': 240,
                        'EndOffset': 243,
                        'Text': '165',
                        'Category': 'TEST_TREATMENT_PROCEDURE',
                        'Traits': []
                    },
                    {
                        'Type': 'TEST_UNIT',
                        'Score': 0.9211665987968445,
                        'RelationshipScore': 0.9999858140945435,
                        'RelationshipType': 'TEST_UNIT',
                        'Id': 9,
                        'BeginOffset': 244,
                        'EndOffset': 246,
                        'Text': 'lb',
                        'Category': 'TEST_TREATMENT_PROCEDURE',
                        'Traits': []
                    }
                ]
            },
            {
                'Id': 10,
                'BeginOffset': 285,
                'EndOffset': 288,
                'Score': 0.6065412759780884,
                'Text': 'EXP',
                'Category': 'TEST_TREATMENT_PROCEDURE',
                'Type': 'TEST_NAME',
                'Traits': []
            },
            {
                'Id': 16,
                'BeginOffset': 289,
                'EndOffset': 299,
                'Score': 0.9998247027397156,
                'Text': '09/04/2024',
                'Category': 'PROTECTED_HEALTH_INFORMATION',
                'Type': 'DATE',
                'Traits': []
            },
            {
                'Id': 17,
                'BeginOffset': 300,
                'EndOffset': 312,
                'Score': 0.9849896430969238,
                'Text': 'John ASample',
                'Category': 'PROTECTED_HEALTH_INFORMATION',
                'Type': 'NAME',
                'Traits': []
            },
            {
                'Id': 18,
                'BeginOffset': 315,
                'EndOffset': 342,
                'Score': 0.9572470784187317,
                'Text': 'DDWDLFBCD789GK1234567XX1101',
                'Category': 'PROTECTED_HEALTH_INFORMATION',
                'Type': 'ID',
                'Traits': []
            },
            {
                'Id': 19,
                'BeginOffset': 355,
                'EndOffset': 365,
                'Score': 0.9999629259109497,
                'Text': '01/06/2015',
                'Category': 'PROTECTED_HEALTH_INFORMATION',
                'Type': 'DATE',
                'Traits': []
            }
        ],
        'UnmappedAttributes': [],
        'ModelVersion': '2.4.0'
    }
];

exports.expectedFormattedMedicalComprehendInference = {
    'ANATOMY': [
        'EYES'
    ],
    'PROTECTED_HEALTH_INFORMATION': [
        'WA USA WASHINGTON DRIVER LICENSE FEDERAL',
        'JOHN A',
        '09/04/1958',
        '09/04/2018',
        'CITY WA 99999',
        '09/04/2024',
        'John ASample',
        'DDWDLFBCD789GK1234567XX1101',
        '01/06/2015'
    ],
    'TEST_TREATMENT_PROCEDURE': [
        'WGT',
        'EXP'
    ]
};

exports.expectedKendraIndexInput = () => {
    let Documents = [];
    for (let index = 0; index < 2; index++) {
        Documents.push({
            Id: `doc${index + 1}`,
            Blob: 'This is a 2023 test about John Doe, New York. This is a 2023 test about John Doe, New York. ',
            ContentType: 'PLAIN_TEXT',
            AccessControlList: [
                {
                    Access: 'ALLOW',
                    Name: 'mock-user-id',
                    Type: 'USER'
                }
            ],
            Attributes: [
                {
                    Key: `${SharedLib.WorkflowOrchestratorDefaults.KENDRA_ATTRIBUTES.CASE_ID}`,
                    Value: {
                        StringValue: 'mock-user-id:mock-case-id'
                    }
                },
                {
                    Key: `${SharedLib.WorkflowOrchestratorDefaults.KENDRA_ATTRIBUTES.DOC_ID}`,
                    Value: {
                        StringValue: `doc${index + 1}`
                    }
                },
                {
                    Key: `${SharedLib.WorkflowOrchestratorDefaults.KENDRA_ATTRIBUTES.DOC_TYPE}`,
                    Value: {
                        StringValue: 'passport'
                    }
                },
                {
                    Key: `${SharedLib.WorkflowOrchestratorDefaults.KENDRA_ATTRIBUTES.FILE_NAME}`,
                    Value: {
                        StringValue: 'single-page-Insulin.pdf'
                    }
                },
                {
                    Key: `${SharedLib.WorkflowOrchestratorDefaults.KENDRA_ATTRIBUTES.FILE_TYPE}`,
                    Value: {
                        StringValue: '.pdf'
                    }
                }
            ]
        });
    }

    return {
        Documents,
        IndexId: 'test-index-id',
        RoleArn: 'arn:iam::123456789012:role/test-role'
    };
};

exports.expectedPrepareDocumentsOutput = () => {
    let nestedDocuments = [];
    let documents = [];
    for (let index = 0; index < 11; index++) {
        documents.push({
            Id: `doc${index + 1}`,
            Blob: 'This is a 2023 test about John Doe, New York. This is a 2023 test about John Doe, New York. ',
            ContentType: 'PLAIN_TEXT',
            AccessControlList: [
                {
                    Access: 'ALLOW',
                    Name: 'mock-user-id',
                    Type: 'USER'
                }
            ],
            Attributes: [
                {
                    Key: `${SharedLib.WorkflowOrchestratorDefaults.KENDRA_ATTRIBUTES.CASE_ID}`,
                    Value: {
                        StringValue: 'mock-user-id:mock-case-id'
                    }
                },
                {
                    Key: `${SharedLib.WorkflowOrchestratorDefaults.KENDRA_ATTRIBUTES.DOC_ID}`,
                    Value: {
                        StringValue: `doc${index + 1}`
                    }
                },
                {
                    Key: `${SharedLib.WorkflowOrchestratorDefaults.KENDRA_ATTRIBUTES.DOC_TYPE}`,
                    Value: {
                        StringValue: 'passport'
                    }
                },
                {
                    Key: `${SharedLib.WorkflowOrchestratorDefaults.KENDRA_ATTRIBUTES.FILE_NAME}`,
                    Value: {
                        StringValue: 'single-page-Insulin.pdf'
                    }
                },
                {
                    Key: `${SharedLib.WorkflowOrchestratorDefaults.KENDRA_ATTRIBUTES.FILE_TYPE}`,
                    Value: {
                        StringValue: '.pdf'
                    }
                }
            ]
        });
        if (index == 9) {
            nestedDocuments.push(documents);
            documents = [];
        }
    }
    nestedDocuments.push(documents);
    return nestedDocuments;
};

exports.expectedPrepareDocumentsInput = () => {
    let documentCase = {
        case: {
            id: 'mock-user-id:mock-case-id'
        }
    };
    let documents = [];
    for (let index = 0; index < 11; index++) {
        documents.push({
            document: {
                id: `doc${index + 1}`,
                s3Bucket: 'my-bucket',
                s3Prefix: `path/to/doc${index + 1}`,
                selfCertifiedDocType: 'passport',
                uploadedFileExtension: '.pdf',
                uploadedFileName: 'single-page-Insulin.pdf'
            }
        });
    }
    documentCase.case.documentList = documents;
    return documentCase;
};

exports.failureEvent = {
    'detail-type': 'processing_failure',
    'source': 'workflow-stepfunction.app.idp',
    'detail': {
        'detail-type': 'trigger_workflow_processing_event',
        'source': 'workflow-orchestrator.app.idp',
        'detail': {
            'case': {
                'id': 'fake-case',
                'status': 'failure',
                'stage': 'entity-standard',
                'workflows': ['textract', 'entity-standard'],
                'documentList': [
                    {
                        'stage': 'textract',
                        'inferences': {
                            'textract-detectText': 'fake-case/fake-doc/textract-detectText.json'
                        },
                        'document': {
                            'id': 'fake-doc',
                            'caseId': 'fake-case',
                            'piiFlag': false,
                            'runTextractAnalyzeAction': false,
                            'selfCertifiedDocType': 'generic',
                            'processingType': 'sync',
                            's3Bucket': 'fake-bucket',
                            's3Prefix': 'initial/fake-case/fake-doc.pdf',
                            'documentWorkflow': ['textract']
                        },
                        'stageExistsInDocumentWorkflow': true
                    }
                ]
            }
        },
        'error': {
            'Error': '{}',
            'Cause':
                'No inference called textract-detectText was found in the payload, and thus stage entity-standard can\'t be performed.'
        }
    }
};

exports.openSearchPayload = {
    'case': {
        'id': 'some-user:some-case-id',
        'status': 'success',
        'stage': 'textract',
        'workflows': [
            'textract'
        ],
        'documentList': [
            {
                'stage': 'textract',
                'inferences': {
                    'textract-detectText': 'some-user:some-case-i/some-doc-id/textract-detectText.json',
                    'textract-analyzeDoc': 'some-user:some-case-i/some-doc-id/textract-analyzeDoc.json'
                },
                'document': {
                    'id': 'some-doc-id',
                    'caseId': 'some-user:some-case-id',
                    'piiFlag': false,
                    'runTextractAnalyzeAction': true,
                    'selfCertifiedDocType': 'generic',
                    'processingType': 'sync',
                    's3Bucket': 'some-buckey-name',
                    's3Prefix': 'initial/some-user:some-case-i/some-doc-id.jpg',
                    'documentWorkflow': [
                        'textract',
                        'entity-standard',
                        'entity-pii',
                        'entity-medical',
                        'redaction'
                    ],
                    'uploadedFileExtension': '.jpg',
                    'uploadedFileName': 'example.jpg'
                },
                'stageExistsInDocumentWorkflow': true
            }
        ]
    }
};
