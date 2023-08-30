/**********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 **********************************************************************************************************************/

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
                "No inference called textract-detectText was found in the payload, and thus stage entity-standard can't be performed."
        }
    }
};
