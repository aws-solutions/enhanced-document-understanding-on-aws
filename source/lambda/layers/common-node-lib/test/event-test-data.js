// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const { WorkflowEventDetailTypes, EventSources, CaseStatus } = require('../constants');

// Used for job initiation
exports.jobMessage = {
    'Records': [
        {
            'messageId': 'fake-msg-id',
            'receiptHandle': 'MessageReceiptHandle',
            'body': '{"taskToken":"fakeToken1","input":{"id":"fakedocId1","selfCertifiedDocType":"Paystub","s3Prefix":"s3://fake-s3uri/fake-bucket/file1.jpg","piiFlag":true,"featureTypes":["FORMS"],"processingType":"sync"}}',
            'attributes': {
                'ApproximateReceiveCount': '1',
                'SentTimestamp': '1523232000000',
                'SenderId': '12345',
                'ApproximateFirstReceiveTimestamp': '1523232000001'
            },
            'messageAttributes': {},
            'md5OfBody': '{{{md5_of_body}}}',
            'eventSource': 'aws:sqs',
            'eventSourceARN': 'arn:aws:sqs:us-east-1:123456789012:MyQueue',
            'awsRegion': 'us-east-1'
        },
        {
            'messageId': 'fake-msg-id',
            'receiptHandle': 'MessageReceiptHandle',
            'body': '{"taskToken":"fakeToken1","input":{"id":"fakedocId1","selfCertifiedDocType":"Paystub","s3Prefix":"s3://fake-s3uri/fake-bucket/file1.jpg","piiFlag":true,"featureTypes":["FORMS"],"processingType":"sync","inferences":{"textract-analyzeDoc":"mocked-analyze-doc-response"}}}',
            'attributes': {
                'ApproximateReceiveCount': '1',
                'SentTimestamp': '1523232000000',
                'SenderId': '12345',
                'ApproximateFirstReceiveTimestamp': '1523232000001'
            },
            'messageAttributes': {},
            'md5OfBody': '{{{md5_of_body}}}',
            'eventSource': 'aws:sqs',
            'eventSourceARN': 'arn:aws:sqs:us-east-1:123456789012:MyQueue',
            'awsRegion': 'us-east-1'
        }
    ]
};

// Used for synchronous processing
exports.sqsMessage = {
    'Records': [
        {
            messageId: 'fakeMessageId',
            receiptHandle: 'fakeReceiptHandler',
            body: {
                taskToken: 'fakeToken',
                input: {
                    message: 'Passport, Name fakePerson Address fakeAddress Nationality fakeNationality passportNo fakePNumber'
                }
            },
            attribute: {
                ApproximateReceiveCount: '1',
                SentTimestamp: '1234567890',
                SenderId: 'fakeSenderId',
                ApproximateFirstReceiveTimestamp: '1545082649185'
            },
            messageAttributes: {},
            md5OfBody: 'fakeMD5OfBody',
            eventSource: 'fakeEventSource',
            eventSourceARN: 'arn:aws:fakeEventSourceARN:my-queue',
            awsRegion: 'fakeAWSRegion'
        }
    ]
};

exports.syncComprehendSuccessResponse = {
    source: 'Name fakePerson Address fakeAddress Nationality fakeNationality passportNo fakePNumber',
    Classes: [
        { 'Name': 'Passport', 'Score': 0.8642 },
        { 'Name': 'Other National Identity Document', 'Score': 0.768 }
    ]
};

exports.asyncComprehendSuccessResponse = {
    JobArn: 'arn:fake-partition:comprehend:fake-region:123456789012-id:document-classification-job/fake-job-id-12345',
    JobId: 'fake-job-id-12345',
    JobStatus: 'IN PROGRESS'
};

// Used for asynchronous processing
exports.sqsMessages = {
    'Messages': [
        {
            messageId: 'fakeMessageId1',
            receiptHandle: 'fakeReceiptHandler1',
            body: {
                taskToken: 'fakeToken1',
                input: {
                    message: 's3://dir1/subdir/filename1.jpg'
                }
            },
            attribute: {
                ApproximateReceiveCount: '1',
                SentTimestamp: '1234567890',
                SenderId: 'fakeSenderId',
                ApproximateFirstReceiveTimestamp: '1545082649185'
            },
            messageAttributes: {},
            md5OfBody: 'fakeMD5OfBody',
            eventSource: 'fakeEventSource',
            eventSourceARN: 'arn:aws:fakeEventSourceARN:my-queue',
            awsRegion: 'fakeAWSRegion'
        },
        {
            messageId: 'fakeMessageId2',
            receiptHandle: 'fakeReceiptHandler2',
            body: {
                taskToken: 'fakeToken2',
                input: {
                    message: 's3://dir1/subdir/filename2.jpg'
                }
            },
            attribute: {
                ApproximateReceiveCount: '1',
                SentTimestamp: '1234567892',
                SenderId: 'fakeSenderId',
                ApproximateFirstReceiveTimestamp: '1545082649187'
            },
            messageAttributes: {},
            md5OfBody: 'fakeMD5OfBody',
            eventSource: 'fakeEventSource',
            eventSourceARN: 'arn:aws:fakeEventSourceARN:my-queue',
            awsRegion: 'fakeAWSRegion'
        }
    ]
};

exports.listComprehendJobs = {
    'DocumentClassificationJobPropertiesList': [
        {
            'DataAccessRoleArn': 'fake-role',
            'DocumentClassifierArn': 'arn:aws:fakeComprehendARN:document-classfier/',
            'EndTime': 1234567892,
            'InputDataConfig': {
                'InputFormat': 'ONE_DOC_PER_FILE',
                'S3Uri': 's3://fake-s3uri/fake-bucket/prefix1/input/'
            },
            'JobArn': 'arn:aws:comprehend:fake-region:111122223333:document-classification-job/abcdef',
            'JobId': 'fake-jobID',
            'JobStatus': 'IN_PROGRESS',
            'Message': 'Job in progress',
            'OutputDataConfig': {
                'S3Uri': 's3://fake-s3uri/fake-bucket/prefix1/output/'
            },
            'SubmitTime': 111111111
        },
        {
            'DataAccessRoleArn': 'fake-role',
            'DocumentClassifierArn': 'arn:aws:fakeComprehendARN:document-classfier/',
            'EndTime': 1234567895,
            'InputDataConfig': {
                'InputFormat': 'ONE_DOC_PER_FILE',
                'S3Uri': 's3://fake-s3uri/fake-bucket/prefix2/input/'
            },
            'JobArn': 'arn:aws:comprehend:fake-region:111122223333:document-classification-job/abcdef',
            'JobId': 'fake-jobID',
            'JobStatus': 'IN_PROGRESS',
            'Message': 'Job in progress',
            'OutputDataConfig': {
                'S3Uri': 's3://fake-s3uri/fake-bucket/prefix2/output/'
            },
            'SubmitTime': 111111112
        }
    ],
    'NextToken': 'next-page'
};

exports.dynamoDbInput = [
    {
        'taskToken': 'fakeToken1',
        's3Prefix': 'fake-prefix/input/filename1.jpg',
        's3FileName': 'filename1.jpg',
        'receiptHandle': 'fakeReceiptHandler1'
    },
    {
        'taskToken': 'fakeToken2',
        's3Prefix': 'fake-prefix/input/filename2.jpg',
        's3FileName': 'filename2.jpg',
        'receiptHandle': 'fakeReceiptHandler2'
    }
];

exports.dynamoDbInputFormatted = [
    {
        'PutRequest': {
            'Item': {
                'ID': { 'S': 'test-stage$fake-id' },
                'TASK_TOKEN': { 'S': 'fakeToken1' },
                'S3_PREFIX': { 'S': 'fake-prefix/input/filename1.jpg' },
                'S3_FILE_NAME': { 'S': 'filename1.jpg' },
                'RECEIPT_HANDLE': { 'S': 'fakeReceiptHandler1' },
                'JOB_ID': { 'S': 'fake-id' },
                'EXPIRATION_TIME': { 'N': NaN }
            }
        }
    },
    {
        'PutRequest': {
            'Item': {
                'ID': { 'S': 'test-stage$fake-id' },
                'TASK_TOKEN': { 'S': 'fakeToken2' },
                'S3_PREFIX': { 'S': 'fake-prefix/input/filename2.jpg' },
                'S3_FILE_NAME': { 'S': 'filename2.jpg' },
                'RECEIPT_HANDLE': { 'S': 'fakeReceiptHandler2' },
                'JOB_ID': { 'S': 'fake-id' },
                'EXPIRATION_TIME': { 'N': NaN }
            }
        }
    }
];

exports.dynamoDbInputWithJobId = [
    {
        'taskToken': 'fakeToken1',
        's3Prefix': 'fake-prefix/input/filename1.jpg',
        'receiptHandle': 'fakeReceiptHandler1',
        's3FileName': 'filename1.jpg',
        'jobId': 'job1'
    },
    {
        'taskToken': 'fakeToken2',
        's3Prefix': 'fake-prefix/input/filename2.jpg',
        'receiptHandle': 'fakeReceiptHandler2',
        's3FileName': 'filename2.jpg',
        'jobId': 'job2'
    }
];

exports.dynamoDbInputWithJobIdFormatted = [
    {
        'PutRequest': {
            'Item': {
                'ID': { 'S': 'job1' },
                'TASK_TOKEN': { 'S': 'fakeToken1' },
                'S3_PREFIX': { 'S': 'fake-prefix/input/filename1.jpg' },
                'S3_FILE_NAME': { 'S': 'filename1.jpg' },
                'RECEIPT_HANDLE': { 'S': 'fakeReceiptHandler1' },
                'JOB_ID': { 'S': 'job1' },
                'EXPIRATION_TIME': { 'N': NaN }
            }
        }
    },
    {
        'PutRequest': {
            'Item': {
                'ID': { 'S': 'job2' },
                'TASK_TOKEN': { 'S': 'fakeToken2' },
                'S3_PREFIX': { 'S': 'fake-prefix/input/filename2.jpg' },
                'S3_FILE_NAME': { 'S': 'filename2.jpg' },
                'RECEIPT_HANDLE': { 'S': 'fakeReceiptHandler2' },
                'JOB_ID': { 'S': 'job2' },
                'EXPIRATION_TIME': { 'N': NaN }
            }
        }
    }
];

exports.dynamoDBbatchWriteResponse = {
    'ConsumedCapacity': [
        {
            'CapacityUnits': 120.55,
            'TableName': 'fake-table'
        }
    ],
    'ItemCollectionMetrics': {},
    'UnprocessedItems': {}
};

exports.dynamoDBbatchWriteUnprocessedResponse = {
    'ConsumedCapacity': [
        {
            'CapacityUnits': 120.55,
            'TableName': 'fake-table'
        }
    ],
    'ItemCollectionMetrics': {},
    'UnprocessedItems': {
        'fake-table': [
            {
                'PutRequest': {
                    'Item': {
                        'taskToken': {
                            'S': 'fakeToken2'
                        },
                        's3Prefix': {
                            'S': 'fake-prefix/input/filename2.jpg'
                        },
                        'JobID': {
                            'S': 'fake-job-id-12345'
                        },
                        'ExpirationTime': {
                            'N': '1661895221073172800'
                        }
                    }
                }
            }
        ]
    }
};

exports.dynamoDbQueryFetchResponse = {
    Key: {
        Id: {
            S: 'DOCUMENT_TEXTRACT$job-1234$file1.jpg'
        }
    },
    Item: {
        taskToken: {
            S: 'fakeToken'
        },
        receiptHandle: {
            S: 'fakeReceiptHandle'
        }
    }
};

exports.workflowOrchestratorCompleteStatusEvent = {
    'version': '0',
    'id': 'd26b4cf5-ba68-744f-4d69-ffde1f3acf20',
    'detail-type': WorkflowEventDetailTypes.TRIGGER_WORKFLOW,
    'source': `${EventSources.WORKFLOW_STEPFUNCTION}.app.idp`,
    'account': '123456789012',
    'time': '2023-01-27T22:31:43Z',
    'region': 'us-east-1',
    'resources': [],
    'detail': {
        'case': {
            'id': 'caseId1',
            'status': 'complete',
            'stage': 'entity-standard',
            'workflows': ['textract', 'entity-standard'],
            'documentList': [
                {
                    'stage': 'textract',
                    'inferences': {
                        'textract-detectText': {
                            'DocumentMetadata': {
                                'Pages': 1
                            },
                            'Blocks': [
                                {
                                    'BlockType': 'LINE',
                                    'Confidence': 99.52398681640625,
                                    'Text': 'Amazon.com, Inc. is located in Seattle, WA',
                                    'Geometry': {
                                        'BoundingBox': {
                                            'Width': 0.512660026550293,
                                            'Height': 0.06824082136154175,
                                            'Left': 0.06333211064338684,
                                            'Top': 0.1989629715681076
                                        },
                                        'Polygon': [
                                            {
                                                'X': 0.06337157636880875,
                                                'Y': 0.20793944597244263
                                            },
                                            {
                                                'X': 0.5759921669960022,
                                                'Y': 0.1989629715681076
                                            },
                                            {
                                                'X': 0.5759671330451965,
                                                'Y': 0.2590251564979553
                                            },
                                            {
                                                'X': 0.06333211064338684,
                                                'Y': 0.26720380783081055
                                            }
                                        ]
                                    },
                                    'Id': 'b009b113-1f3e-42d0-b716-20bc173f9afb',
                                    'Relationships': [
                                        {
                                            'Type': 'CHILD',
                                            'Ids': [
                                                'cd1429a1-f066-4dbd-8b81-7d8b81369347',
                                                'e7af6961-db70-426f-a56a-b4cd55c9e366',
                                                'f2e48233-4cd2-4172-9695-f3b3a7d83634',
                                                'c2fb673f-f68c-447c-b980-d6bd6951c005',
                                                '03835e6e-a0da-44f1-99bc-620b97453338',
                                                'dd72bb07-1f05-459a-afbb-ccfe62583d17',
                                                '7f0066c4-f1af-4838-ac4a-12d8ab1fd4e1'
                                            ]
                                        }
                                    ]
                                }
                            ],
                            'DetectDocumentTextModelVersion': '1.0'
                        },
                        'test-inference': {
                            'test': 'test'
                        }
                    },
                    'document': {
                        'id': 'docId1',
                        'caseId': 'caseId1',
                        'piiFlag': false,
                        'selfCertifiedDocType': 'passport',
                        'processingType': 'sync',
                        's3Bucket': 'fake-bucket',
                        's3Prefix': 'caseId1/initial/docId1.jpg',
                        'documentWorkflow': ['textract', 'entity-standard']
                    }
                },
                {
                    'stage': 'textract',
                    'inferences': {
                        'test-inference': {
                            'test': 'test'
                        }
                    },
                    'document': {
                        'id': 'docId2',
                        'caseId': 'caseId1',
                        'piiFlag': false,
                        'selfCertifiedDocType': 'passport',
                        'processingType': 'sync',
                        's3Bucket': 'fake-bucket',
                        's3Prefix': 'caseId1/initial/docId2.jpg',
                        'documentWorkflow': ['textract', 'entity-standard']
                    }
                }
            ]
        }
    }
};

exports.workflowOrchestratorS3UploadSuccessResponse = [
    {
        'caseId': 'caseId1',
        'documentId': 'docId1',
        'inferenceType': 'textract-detectText',
        's3Key': 'caseId1/docId1/textract-detectText.json'
    },
    {
        'caseId': 'caseId1',
        'documentId': 'docId1',
        'inferenceType': 'test-inference',
        's3Key': 'caseId1/docId1/test-inference.json'
    },
    {
        'caseId': 'caseId1',
        'documentId': 'docId2',
        'inferenceType': 'test-inference',
        's3Key': 'caseId1/docId2/test-inference.json'
    }
];

exports.workflowOrchestratorCompleteStatusDDBUploadResponses = [
    {
        'Attributes': {
            'BUCKET_NAME': {
                'S': 'fake-bucket'
            },
            'S3_KEY': {
                'S': 'caseId1/initial/docId1.jpg'
            },
            'UPLOADED_FILE_EXTENSION': {
                'S': '.jpg'
            },
            'DOCUMENT_ID': {
                'S': 'docId1'
            },
            'UPLOADED_FILE_NAME': {
                'S': 'simple-document-image'
            },
            'CASE_ID': {
                'S': 'caseId1'
            },
            'DOCUMENT_TYPE': {
                'S': 'passport'
            },
            'textract-detectText': {
                'S': 'caseId1/docId1/textract-detectText.json'
            }
        }
    },
    {
        'Attributes': {
            'BUCKET_NAME': {
                'S': 'fake-bucket'
            },
            'S3_KEY': {
                'S': 'caseId1/initial/docId1.jpg'
            },
            'UPLOADED_FILE_EXTENSION': {
                'S': '.jpg'
            },
            'DOCUMENT_ID': {
                'S': 'docId1'
            },
            'UPLOADED_FILE_NAME': {
                'S': 'simple-document-image'
            },
            'test-inference': {
                'S': 'caseId1/docId1/test-inference.json'
            },
            'CASE_ID': {
                'S': 'caseId1'
            },
            'DOCUMENT_TYPE': {
                'S': 'passport'
            },
            'textract-detectText': {
                'S': 'caseId1/docId1/textract-detectText.json'
            }
        }
    },
    {
        'Attributes': {
            'BUCKET_NAME': {
                'S': 'fake-bucket'
            },
            'S3_KEY': {
                'S': 'caseId1/initial/docId2.jpg'
            },
            'UPLOADED_FILE_EXTENSION': {
                'S': '.jpg'
            },
            'DOCUMENT_ID': {
                'S': 'docId2'
            },
            'UPLOADED_FILE_NAME': {
                'S': 'simple-document-image'
            },
            'test-inference': {
                'S': 'caseId1/docId1/test-inference.json'
            },
            'CASE_ID': {
                'S': 'caseId1'
            },
            'DOCUMENT_TYPE': {
                'S': 'passport'
            }
        }
    }
];

exports.workflowOrchestratorUpdateStatusDDBResponse = {
    'Attributes': {
        'CASE_ID': {
            'S': 'case-id'
        },
        'STATUS': {
            'S': CaseStatus.INITIATE
        },
        'DOCUMENT_ID': {
            'S': '0000'
        },
        'USER_ID': {
            'S': 'fake-user'
        }
    }
};

exports.caseStatusTableGetInferencesResponse = {
    Item: {
        BUCKET_NAME: {
            S: 'docunderstanding-requestprocessordocumentrepo94d3-10o8ooeazkv3w'
        },
        S3_KEY: {
            S: 'caseId/initial/docId.jpg'
        },
        'inference-textract-analyzeDoc': {
            S: 'caseId/docId/textract-analyzeDoc.json'
        },
        UPLOADED_FILE_EXTENSION: { S: '.jpg' },
        UPLOADED_FILE_NAME: { S: 'simple-document-image' },
        USER_ID: { S: '0001' },
        DOCUMENT_ID: { S: 'docId' },
        CASE_ID: { S: 'caseId' },
        'inference-textract-analyzeId': {
            S: 'caseId/docId/textract-analyzeId.json'
        },
        DOCUMENT_TYPE: { S: 'passport' }
    }
};

exports.ddbGetInferencePrefixesExpectedResult = {
    'textract-analyzeDoc': 'caseId/docId/textract-analyzeDoc.json',
    'textract-analyzeId': 'caseId/docId/textract-analyzeId.json'
};

exports.getInferenceFromS3TextractAnalyzeIdResponse = {
    'IdentityDocuments': [
        {
            'DocumentIndex': 1,
            'IdentityDocumentFields': [
                { 'Type': { 'Text': 'FIRST_NAME' }, 'ValueDetection': { 'Text': '', 'Confidence': 99.24312591552734 } },
                { 'Type': { 'Text': 'LAST_NAME' }, 'ValueDetection': { 'Text': '', 'Confidence': 99.17753601074219 } },
                {
                    'Type': { 'Text': 'MIDDLE_NAME' },
                    'ValueDetection': { 'Text': '', 'Confidence': 86.38179779052734 }
                },
                { 'Type': { 'Text': 'SUFFIX' }, 'ValueDetection': { 'Text': '', 'Confidence': 99.17208099365234 } },
                {
                    'Type': { 'Text': 'CITY_IN_ADDRESS' },
                    'ValueDetection': { 'Text': '', 'Confidence': 99.0365982055664 }
                },
                {
                    'Type': { 'Text': 'ZIP_CODE_IN_ADDRESS' },
                    'ValueDetection': { 'Text': '', 'Confidence': 99.13761138916016 }
                },
                {
                    'Type': { 'Text': 'STATE_IN_ADDRESS' },
                    'ValueDetection': { 'Text': 'WA', 'Confidence': 98.50074005126953 }
                },
                { 'Type': { 'Text': 'STATE_NAME' }, 'ValueDetection': { 'Text': '', 'Confidence': 99.17942810058594 } },
                {
                    'Type': { 'Text': 'DOCUMENT_NUMBER' },
                    'ValueDetection': { 'Text': '', 'Confidence': 99.18185424804688 }
                },
                {
                    'Type': { 'Text': 'EXPIRATION_DATE' },
                    'ValueDetection': { 'Text': '', 'Confidence': 99.18173217773438 }
                },
                {
                    'Type': { 'Text': 'DATE_OF_BIRTH' },
                    'ValueDetection': { 'Text': '', 'Confidence': 93.43514251708984 }
                },
                {
                    'Type': { 'Text': 'DATE_OF_ISSUE' },
                    'ValueDetection': { 'Text': '', 'Confidence': 99.17778778076172 }
                },
                {
                    'Type': { 'Text': 'ID_TYPE' },
                    'ValueDetection': { 'Text': 'UNKNOWN', 'Confidence': 97.58924102783203 }
                },
                {
                    'Type': { 'Text': 'ENDORSEMENTS' },
                    'ValueDetection': { 'Text': '', 'Confidence': 99.18171691894531 }
                },
                { 'Type': { 'Text': 'VETERAN' }, 'ValueDetection': { 'Text': '', 'Confidence': 99.17353820800781 } },
                {
                    'Type': { 'Text': 'RESTRICTIONS' },
                    'ValueDetection': { 'Text': '', 'Confidence': 99.17918395996094 }
                },
                { 'Type': { 'Text': 'CLASS' }, 'ValueDetection': { 'Text': '', 'Confidence': 99.1806869506836 } },
                { 'Type': { 'Text': 'ADDRESS' }, 'ValueDetection': { 'Text': '', 'Confidence': 99.1456069946289 } },
                { 'Type': { 'Text': 'COUNTY' }, 'ValueDetection': { 'Text': '', 'Confidence': 99.17538452148438 } },
                {
                    'Type': { 'Text': 'PLACE_OF_BIRTH' },
                    'ValueDetection': { 'Text': '', 'Confidence': 99.17353820800781 }
                },
                { 'Type': { 'Text': 'MRZ_CODE' }, 'ValueDetection': { 'Text': '', 'Confidence': 97.52696990966797 } }
            ]
        }
    ],
    'DocumentMetadata': { 'Pages': 1 },
    'AnalyzeIDModelVersion': '1.0'
};

// for cloudwatch-metrics
exports.caseStatusMetricsResponse = {
    'MetricData': [
        {
            'MetricName': 'CaseProcessedStatus',
            'Dimensions': [
                { 'Name': 'CaseStatus', 'Value': 'initiate' },
                { 'Name': 'serviceName', 'Value': 'eDUS-fake-uuid' }
            ],
            'Timestamp': new Date('2020-01-01T00:00:00.000Z'),
            'Unit': 'Count',
            'Value': 1
        }
    ],
    'Namespace': 'Case'
};

exports.documentCountResponse = {
    'MetricData': [
        {
            'MetricName': 'DocumentCount',
            'Dimensions': [
                { 'Name': 'Documents', 'Value': 'Upload' },
                { 'Name': 'serviceName', 'Value': 'eDUS-fake-uuid' }
            ],
            'Timestamp': new Date('2020-01-01T00:00:00.000Z'),
            'Unit': 'Count',
            'Value': 1
        }
    ],
    'Namespace': 'Documents'
};

exports.fileTypeMetricsResponse = {
    'MetricData': [
        {
            'MetricName': 'FileExtensionTypes',
            'Dimensions': [
                { 'Name': 'FileTypesUploaded', 'Value': 'jpeg/jpg' },
                { 'Name': 'serviceName', 'Value': 'eDUS-fake-uuid' }
            ],
            'Timestamp': new Date('2020-01-01T00:00:00.000Z'),
            'Unit': 'Count',
            'Value': 2
        }
    ],
    'Namespace': 'FileTypes'
};

exports.comprehendWorkflowMetricsResponse = {
    'MetricData': [
        {
            'MetricName': 'ComprehendWorkflow',
            'Dimensions': [
                { 'Name': 'ComprehendAPI', 'Value': 'Comprehend-DetectEntitiesSync' },
                { 'Name': 'serviceName', 'Value': 'eDUS-fake-uuid' }
            ],
            'Timestamp': new Date('2020-01-01T00:00:00.000Z'),
            'Unit': 'Count',
            'Value': 1
        }
    ],
    'Namespace': 'Workflows'
};

exports.textractWorkflowMetricsResponse = {
    'MetricData': [
        {
            'MetricName': 'TextractWorkflow',
            'Dimensions': [
                { 'Name': 'TextractAPI', 'Value': 'Textract-AnalyzeDocumentSync' },
                { 'Name': 'serviceName', 'Value': 'eDUS-fake-uuid' }
            ],
            'Timestamp': new Date('2020-01-01T00:00:00.000Z'),
            'Unit': 'Count',
            'Value': 1
        }
    ],
    'Namespace': 'Workflows'
};

exports.openSearchQueryRequest = {
    'body': {
        '_source': true,
        'highlight': {
            'fields': {
                'content': {
                    'post_tags': [
                        ''
                    ],
                    'pre_tags': [
                        ''
                    ]
                }
            },
            'require_field_match': false
        },
        'query': {
            'bool': {
                'must': [
                    {
                        'query_string': {
                            'query': 'some-keyword'
                        }
                    },
                    {
                        'bool': {
                            'should': [
                                {
                                    'term': {
                                        'case_id.keyword': 'id-1'
                                    }
                                },
                                {
                                    'term': {
                                        'case_id.keyword': 'id-2'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        'bool': {
                            'should': [
                                {
                                    'term': {
                                        'file_type.keyword': '.jpg'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        'bool': {
                            'should': [
                                {
                                    'term': {
                                        'doc_type.keyword': 'generic'
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    },
    'method': 'POST',
    'path': '/sample-index/_search',
    'querystring': {
        'filter_path': 'hits.hits._id,hits.hits._source,hits.hits.highlight'
    }
};

exports.openSearchQueryResponse = {
    'body': {
        'took': 94,
        'timed_out': false,
        '_shards': {
            'total': 0,
            'successful': 0,
            'skipped': 0,
            'failed': 0
        },
        'hits': {
            'total': {
                'value': 1,
                'relation': 'eq'
            },
            'max_score': 1.1507283,
            'hits': [
                {
                    '_index': 'edu',
                    '_id': 'id-1',
                    '_score': 1.1507283,
                    '_source': {
                        'case_id': 'id-1',
                        'user_id': 'user',
                        'document_id': 'id-1',
                        'doc_type': 'generic',
                        'file_name': 'example.jpg',
                        'file_type': '.jpg',
                        'content': 'some-content'
                    },
                    'highlight': {
                        'content': [
                            'some-content'
                        ]
                    }
                }
            ]
        }
    },
    'statusCode': 200,
    'headers': {
        'date': 'Thu, 16 Nov 2023 20:33:32 GMT',
        'content-type': 'application/json; charset=UTF-8',
        'content-length': '1207',
        'x-envoy-upstream-service-time': '78',
        'server': 'aoss-amazon-s',
        'x-request-id': '801470ec-fd03-906b-90fc-960d5e208639'
    },
    'meta': {
    }
};

exports.openSearchLambdaResponse = {
    'analytics': [
        {
            'filter': [
                {
                    'count': 1,
                    'type': '.jpg'
                }
            ],
            'type': 'file_type'
        },
        {
            'filter': [
                {
                    'count': 1,
                    'type': 'generic'
                }
            ],
            'type': 'doc_type'
        }
    ],
    'results': [
        {
            'case_id': 'id-1',
            'user_id': 'user',
            'doc_type': 'generic',
            'document_id': 'id-1',
            'file_name': 'example.jpg',
            'file_type': '.jpg',
            'lines': [
                'some-content'
            ]
        }
    ]
}
