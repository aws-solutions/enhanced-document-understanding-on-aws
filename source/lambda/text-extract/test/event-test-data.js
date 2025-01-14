// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

// Used for synchronous processing

exports.inputBodies = [
    {
        'taskToken': 'fakeToken1',
        'input': {
            'stage': 'textract',
            'document': {
                'caseId': 'fakecaseId',
                'id': 'fakedocId1',
                'selfCertifiedDocType': 'Paystub',
                's3Prefix': 's3://fake-s3uri/fake-bucket/file1.jpg',
                'piiFlag': true,
                'runTextractAnalyzeAction': true,
                'analyzeDocFeatureType': ['FORMS'],
                'processingType': 'sync'
            }
        }
    },
    {
        'taskToken': 'fakeToken2',
        'input': {
            'stage': 'textract',
            'document': {
                'caseId': 'fakecaseId',
                'id': 'fakedocId2',
                'selfCertifiedDocType': 'invoice',
                's3Prefix': 's3://fake-s3uri/fake-bucket/file2.jpg',
                'piiFlag': true,
                'runTextractAnalyzeAction': true,
                'processingType': 'sync'
            }
        }
    },
    {
        'taskToken': 'fakeToken3',
        'input': {
            'stage': 'textract',
            'document': {
                'caseId': 'fakecaseId',
                'id': 'fakedocId3',
                'selfCertifiedDocType': 'passport',
                's3Prefix': 's3://fake-s3uri/fake-bucket/file3.jpg',
                'piiFlag': true,
                'runTextractAnalyzeAction': true,
                'processingType': 'sync'
            }
        }
    },
    {
        'taskToken': 'fakeToken4',
        'input': {
            'stage': 'textract',
            'document': {
                'caseId': 'fakecaseId',
                'id': 'fakedocId4',
                'selfCertifiedDocType': 'unknown',
                's3Prefix': 's3://fake-s3uri/fake-bucket/file4.jpg',
                'piiFlag': false,
                'processingType': 'sync'
            }
        }
    },
    {
        'taskToken': 'fakeToken5',
        'input': {
            'stage': 'textract',
            'document': {
                'caseId': 'fakecaseId',
                'id': 'fakedocId5',
                'selfCertifiedDocType': 'Passport',
                's3Prefix': 's3://fake-s3uri/fake-bucket/file5.xls',
                'piiFlag': true,
                'processingType': 'sync'
            }
        }
    }
];

exports.sqsMessages = {
    'Records': [
        {
            'messageId': '5c235c64-7830-4fb2-b3ee-a5b62d4223e7',
            'receiptHandle': 'MessageReceiptHandle',
            'body': JSON.stringify(this.inputBodies[0]),
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
            'messageId': '5c235c64-7830-4fb2-b3ee-a5b62d4223e7',
            'receiptHandle': 'MessageReceiptHandle',
            'body': JSON.stringify(this.inputBodies[1]),
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
            'messageId': '5c235c64-7830-4fb2-b3ee-a5b62d4223e7',
            'receiptHandle': 'MessageReceiptHandle',
            'body': JSON.stringify(this.inputBodies[2]),
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
            'messageId': '5c235c64-7830-4fb2-b3ee-a5b62d4223e7',
            'receiptHandle': 'MessageReceiptHandle',
            'body': JSON.stringify(this.inputBodies[3]),
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
            'messageId': '5c235c64-7830-4fb2-b3ee-a5b62d4223e7',
            'receiptHandle': 'MessageReceiptHandle',
            'body': JSON.stringify(this.inputBodies[4]),
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

exports.syncTextractDocumentSuccessResponse = {
    'DocumentMetadata': {
        'Pages': 1
    },
    'Blocks': ['mocked-response', 'mocked-response'],
    'AnalyzeDocumentModelVersion': '1.0'
};

exports.syncTextractExpenseSuccessResponse = {
    'DocumentMetadata': {
        'Pages': 1
    },
    'ExpenseDocuments': ['mocked-response']
};

exports.syncTextractIdSuccessResponse = {
    'IdentityDocuments': ['mocked-response'],
    'DocumentMetadata': {
        'Pages': 1
    },
    'AnalyzeIDModelVersion': '1.0'
};

exports.syncTextractDetectTextSuccessResponse = {
    'DocumentMetadata': {
        'Pages': 1
    },
    'Blocks': ['mocked-response', 'mocked-response', 'mocked-response'],
    'DetectDocumentTextModelVersion': '1.0'
};

exports.asyncScheduledCloudwatchEvent = {
    'id': 'fake-id',
    'detail-type': 'SQS Instance Event',
    'source': 'aws.sqs',
    'account': '123456789012',
    'time': '1970-01-01T00:00:00Z',
    'region': 'us-east-1',
    'taskToken': 'fake-token1',
    'detail': {}
};

exports.sqsMessagesAsync = {
    'Records': [
        {
            'messageId': '5c235c64-7830-4fb2-b3ee-a5b62d4223e7',
            'receiptHandle': 'MessageReceiptHandle',
            'body': {
                'taskToken': 'fakeToken1',
                'input': {
                    'id': 'fakedocId1',
                    'selfCertifiedDocType': 'Paystub', // Document type
                    's3Prefix': 's3://fake-s3uri/fake-bucket/file1.jpg',
                    'piiFlag': true,
                    'featureTypes': ['FORMS'],
                    'processingType': 'async'
                }
            },
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
            'messageId': '5c235c64-7830-4fb2-b3ee-a5b62d4223e7',
            'receiptHandle': 'MessageReceiptHandle',
            'body': {
                'taskToken': 'fakeToken2',
                'input': {
                    'id': 'fakedocId2',
                    'selfCertifiedDocType': 'invoice', // expense type
                    's3Prefix': 's3://fake-s3uri/fake-bucket/file2.jpg',
                    'piiFlag': true,
                    'processingType': 'async'
                }
            },
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
            'messageId': '5c235c64-7830-4fb2-b3ee-a5b62d4223e7',
            'receiptHandle': 'MessageReceiptHandle',
            'body': {
                'taskToken': 'fakeToken3',
                'input': {
                    'id': 'fakedocId3',
                    'selfCertifiedDocType': 'passport', // Id type. Not supported by async so will return an error.
                    's3Prefix': 's3://fake-s3uri/fake-bucket/file3.jpg',
                    'piiFlag': true,
                    'processingType': 'async'
                }
            },
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
            'messageId': '5c235c64-7830-4fb2-b3ee-a5b62d4223e7',
            'receiptHandle': 'MessageReceiptHandle',
            'body': {
                'taskToken': 'fakeToken4',
                'input': {
                    'id': 'fakedocId4',
                    'selfCertifiedDocType': 'unknown', // unknown selfCertifiedDocType
                    's3Prefix': 's3://fake-s3uri/fake-bucket/file4.jpg',
                    'piiFlag': false, // will do standard text detection so type is irrelevant
                    'processingType': 'async'
                }
            },
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
            'messageId': '5c235c64-7830-4fb2-b3ee-a5b62d4223e7',
            'receiptHandle': 'MessageReceiptHandle',
            'body': {
                'taskToken': 'fakeToken5',
                'input': {
                    'id': 'fakedocId5',
                    'selfCertifiedDocType': 'unknown', // Id type.
                    's3Prefix': 's3://fake-s3uri/fake-bucket/file5.xls', // unsupported file extension
                    'piiFlag': true,
                    'processingType': 'async'
                }
            },
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

exports.startAsyncTextractJobResponses = [
    {
        'taskToken': 'fakeToken1',
        's3Prefix': 's3://fake-s3uri/fake-bucket/file1.jpg',
        'receiptHandle': 'MessageReceiptHandle',
        'jobId': 'fakeJobId1'
    },
    {
        'taskToken': 'fakeToken2',
        's3Prefix': 's3://fake-s3uri/fake-bucket/file2.jpg',
        'receiptHandle': 'MessageReceiptHandle',
        'jobId': 'fakeJobId2'
    },
    {
        'taskToken': 'fakeToken4',
        's3Prefix': 's3://fake-s3uri/fake-bucket/file4.jpg',
        'receiptHandle': 'MessageReceiptHandle',
        'jobId': 'fakeJobId4'
    }
];

exports.asyncTextractResponse1 = {
    'JobId': 'fakeJobId1'
};
exports.asyncTextractResponse2 = {
    'JobId': 'fakeJobId2'
};
exports.asyncTextractResponse4 = {
    'JobId': 'fakeJobId4'
};

exports.asyncTextractDocumentSuccessResponseSingle = [
    {
        'DocumentMetadata': {
            'Pages': 1
        },
        'Blocks': [
            {
                'BlockType': 'PAGE',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 0,
                        'Top': 0
                    },
                    'Polygon': [
                        {
                            'X': 1.5362668328086767e-16,
                            'Y': 0
                        },
                        {
                            'X': 1,
                            'Y': 9.762365737016131e-17
                        },
                        {
                            'X': 1,
                            'Y': 1
                        },
                        {
                            'X': 0,
                            'Y': 1
                        }
                    ]
                },
                'Id': '380a18de-6f16-4735-ab7d-df84c0e92df8',
                'Relationships': [
                    {
                        'Type': 'CHILD',
                        'Ids': [
                            '1a0f9c5a-647b-4c73-9af7-5ed6781f0a51',
                            '668bab12-ccb4-4194-a3ed-362d8e2c5f57',
                            '81757bf0-1536-4691-a5d2-0175d7e87424',
                            'd49a8673-e78c-433c-9716-73ecde933ba2',
                            '08c9e707-c5d0-40b5-ac23-7e4b98fff5c7',
                            '959dede5-26c3-4de4-aed6-1065854e36f4'
                        ]
                    }
                ]
            },
            {
                'BlockType': 'LINE',
                'Confidence': 99.85951232910156,
                'Text': 'Stream Verification Form',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 0.3064603805541992,
                        'Height': 0.017731210216879845,
                        'Left': 0.31575310230255127,
                        'Top': 0.06468543410301208
                    },
                    'Polygon': [
                        {
                            'X': 0.31575310230255127,
                            'Y': 0.06468543410301208
                        },
                        {
                            'X': 0.6222134828567505,
                            'Y': 0.06468543410301208
                        },
                        {
                            'X': 0.6222134828567505,
                            'Y': 0.08241664618253708
                        },
                        {
                            'X': 0.31575310230255127,
                            'Y': 0.08241664618253708
                        }
                    ]
                },
                'Id': '1a0f9c5a-647b-4c73-9af7-5ed6781f0a51',
                'Relationships': [
                    {
                        'Type': 'CHILD',
                        'Ids': [
                            '0ba27dc8-5df4-4c4b-9e99-b9a11c2b53cb',
                            'a9f45bd8-62a7-4c8b-a2ab-2cb50b5daa05',
                            '029e838e-bb46-459a-a139-9b82e5542939'
                        ]
                    }
                ]
            }
        ],
        'AnalyzeDocumentModelVersion': '1.0',
        'JobStatus': 'SUCCEEDED'
    }
];

exports.asyncTextractDocumentSuccessResponses = [
    {
        'DocumentMetadata': {
            'Pages': 1
        },
        'Blocks': [
            {
                'BlockType': 'PAGE',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 0,
                        'Top': 0
                    },
                    'Polygon': [
                        {
                            'X': 1.5362668328086767e-16,
                            'Y': 0
                        },
                        {
                            'X': 1,
                            'Y': 9.762365737016131e-17
                        },
                        {
                            'X': 1,
                            'Y': 1
                        },
                        {
                            'X': 0,
                            'Y': 1
                        }
                    ]
                },
                'Id': '380a18de-6f16-4735-ab7d-df84c0e92df8',
                'Relationships': [
                    {
                        'Type': 'CHILD',
                        'Ids': [
                            '1a0f9c5a-647b-4c73-9af7-5ed6781f0a51',
                            '668bab12-ccb4-4194-a3ed-362d8e2c5f57',
                            '81757bf0-1536-4691-a5d2-0175d7e87424',
                            'd49a8673-e78c-433c-9716-73ecde933ba2',
                            '08c9e707-c5d0-40b5-ac23-7e4b98fff5c7',
                            '959dede5-26c3-4de4-aed6-1065854e36f4'
                        ]
                    }
                ]
            },
            {
                'BlockType': 'LINE',
                'Confidence': 99.85951232910156,
                'Text': 'Stream Verification Form',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 0.3064603805541992,
                        'Height': 0.017731210216879845,
                        'Left': 0.31575310230255127,
                        'Top': 0.06468543410301208
                    },
                    'Polygon': [
                        {
                            'X': 0.31575310230255127,
                            'Y': 0.06468543410301208
                        },
                        {
                            'X': 0.6222134828567505,
                            'Y': 0.06468543410301208
                        },
                        {
                            'X': 0.6222134828567505,
                            'Y': 0.08241664618253708
                        },
                        {
                            'X': 0.31575310230255127,
                            'Y': 0.08241664618253708
                        }
                    ]
                },
                'Id': '1a0f9c5a-647b-4c73-9af7-5ed6781f0a51',
                'Relationships': [
                    {
                        'Type': 'CHILD',
                        'Ids': [
                            '0ba27dc8-5df4-4c4b-9e99-b9a11c2b53cb',
                            'a9f45bd8-62a7-4c8b-a2ab-2cb50b5daa05',
                            '029e838e-bb46-459a-a139-9b82e5542939'
                        ]
                    }
                ]
            }
        ],
        'AnalyzeDocumentModelVersion': '1.0',
        'JobStatus': 'SUCCEEDED',
        'NextToken': 'fake-token'
    },
    {
        'DocumentMetadata': {
            'Pages': 1
        },
        'Blocks': [
            {
                'BlockType': 'LINE',
                'Confidence': 99.85951232910156,
                'Text': 'Stream Verification Form',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 0.3064603805541992,
                        'Height': 0.017731210216879845,
                        'Left': 0.31575310230255127,
                        'Top': 0.06468543410301208
                    },
                    'Polygon': [
                        {
                            'X': 0.31575310230255127,
                            'Y': 0.06468543410301208
                        },
                        {
                            'X': 0.6222134828567505,
                            'Y': 0.06468543410301208
                        },
                        {
                            'X': 0.6222134828567505,
                            'Y': 0.08241664618253708
                        },
                        {
                            'X': 0.31575310230255127,
                            'Y': 0.08241664618253708
                        }
                    ]
                },
                'Id': '1a0f9c5a-647b-4c73-9af7-5ed6781f0a51',
                'Relationships': [
                    {
                        'Type': 'CHILD',
                        'Ids': [
                            '0ba27dc8-5df4-4c4b-9e99-b9a11c2b53cb',
                            'a9f45bd8-62a7-4c8b-a2ab-2cb50b5daa05',
                            '029e838e-bb46-459a-a139-9b82e5542939'
                        ]
                    }
                ]
            }
        ],
        'AnalyzeDocumentModelVersion': '1.0',
        'JobStatus': 'SUCCEEDED'
    }
];

exports.asyncTextractExpenseSuccessResponses = [
    {
        'DocumentMetadata': {
            'Pages': 1
        },
        'ExpenseDocuments': [
            {
                'ExpenseIndex': 1,
                'SummaryFields': [
                    {
                        'Type': {
                            'Text': 'VENDOR_NAME',
                            'Confidence': 98.45835876464844
                        },
                        'ValueDetection': {
                            'Text': "gessie's",
                            'Geometry': {
                                'BoundingBox': {
                                    'Width': 0.37027707695961,
                                    'Height': 0.09495548903942108,
                                    'Left': 0.31989923119544983,
                                    'Top': 0.05341246351599693
                                },
                                'Polygon': [
                                    {
                                        'X': 0.31989923119544983,
                                        'Y': 0.05341246351599693
                                    },
                                    {
                                        'X': 0.6901763081550598,
                                        'Y': 0.05341246351599693
                                    },
                                    {
                                        'X': 0.6901763081550598,
                                        'Y': 0.1483679562807083
                                    },
                                    {
                                        'X': 0.31989923119544983,
                                        'Y': 0.1483679562807083
                                    }
                                ]
                            },
                            'Confidence': 98.21408081054688
                        },
                        'PageNumber': 1
                    },
                    {
                        'Type': {
                            'Text': 'OTHER',
                            'Confidence': 95.5
                        },
                        'LabelDetection': {
                            'Text': 'CHANGE',
                            'Geometry': {
                                'BoundingBox': {
                                    'Width': 0.13937808573246002,
                                    'Height': 0.02390395663678646,
                                    'Left': 0.20517697930335999,
                                    'Top': 0.8792641162872314
                                },
                                'Polygon': [
                                    {
                                        'X': 0.20517697930335999,
                                        'Y': 0.8792641162872314
                                    },
                                    {
                                        'X': 0.3445550501346588,
                                        'Y': 0.8792641162872314
                                    },
                                    {
                                        'X': 0.3445550501346588,
                                        'Y': 0.9031680822372437
                                    },
                                    {
                                        'X': 0.20517697930335999,
                                        'Y': 0.9031680822372437
                                    }
                                ]
                            },
                            'Confidence': 95.48808288574219
                        },
                        'ValueDetection': {
                            'Text': '$14.35',
                            'Geometry': {
                                'BoundingBox': {
                                    'Width': 0.1408701390028,
                                    'Height': 0.02843857929110527,
                                    'Left': 0.7504773736000061,
                                    'Top': 0.8776286840438843
                                },
                                'Polygon': [
                                    {
                                        'X': 0.7504773736000061,
                                        'Y': 0.8776286840438843
                                    },
                                    {
                                        'X': 0.8913475275039673,
                                        'Y': 0.8776286840438843
                                    },
                                    {
                                        'X': 0.8913475275039673,
                                        'Y': 0.9060672521591187
                                    },
                                    {
                                        'X': 0.7504773736000061,
                                        'Y': 0.9060672521591187
                                    }
                                ]
                            },
                            'Confidence': 95.2452392578125
                        },
                        'PageNumber': 1
                    },
                    {
                        'Type': {
                            'Text': 'SUBTOTAL',
                            'Confidence': 99.91777801513672
                        },
                        'LabelDetection': {
                            'Text': 'SUBTOTAL',
                            'Geometry': {
                                'BoundingBox': {
                                    'Width': 0.185138538479805,
                                    'Height': 0.022255193442106247,
                                    'Left': 0.20403023064136505,
                                    'Top': 0.6750741600990295
                                },
                                'Polygon': [
                                    {
                                        'X': 0.20403023064136505,
                                        'Y': 0.6750741600990295
                                    },
                                    {
                                        'X': 0.38916876912117004,
                                        'Y': 0.6750741600990295
                                    },
                                    {
                                        'X': 0.38916876912117004,
                                        'Y': 0.6973294019699097
                                    },
                                    {
                                        'X': 0.20403023064136505,
                                        'Y': 0.6973294019699097
                                    }
                                ]
                            },
                            'Confidence': 99.89358520507812
                        },
                        'ValueDetection': {
                            'Text': '$127.97',
                            'Geometry': {
                                'BoundingBox': {
                                    'Width': 0.1586901694536209,
                                    'Height': 0.026706231757998466,
                                    'Left': 0.751889169216156,
                                    'Top': 0.6735904812812805
                                },
                                'Polygon': [
                                    {
                                        'X': 0.751889169216156,
                                        'Y': 0.6735904812812805
                                    },
                                    {
                                        'X': 0.9105793237686157,
                                        'Y': 0.6735904812812805
                                    },
                                    {
                                        'X': 0.9105793237686157,
                                        'Y': 0.7002967596054077
                                    },
                                    {
                                        'X': 0.751889169216156,
                                        'Y': 0.7002967596054077
                                    }
                                ]
                            },
                            'Confidence': 99.83346557617188
                        },
                        'PageNumber': 1
                    },
                    {
                        'Type': {
                            'Text': 'TAX',
                            'Confidence': 98.72119140625
                        },
                        'LabelDetection': {
                            'Text': 'TAX 6%',
                            'Geometry': {
                                'BoundingBox': {
                                    'Width': 0.13853904604911804,
                                    'Height': 0.024480711668729782,
                                    'Left': 0.20403023064136505,
                                    'Top': 0.718100905418396
                                },
                                'Polygon': [
                                    {
                                        'X': 0.20403023064136505,
                                        'Y': 0.718100905418396
                                    },
                                    {
                                        'X': 0.3425692617893219,
                                        'Y': 0.718100905418396
                                    },
                                    {
                                        'X': 0.3425692617893219,
                                        'Y': 0.7425816059112549
                                    },
                                    {
                                        'X': 0.20403023064136505,
                                        'Y': 0.7425816059112549
                                    }
                                ]
                            },
                            'Confidence': 98.7058334350586
                        },
                        'ValueDetection': {
                            'Text': '$7.68',
                            'Geometry': {
                                'BoundingBox': {
                                    'Width': 0.11335012316703796,
                                    'Height': 0.026706231757998466,
                                    'Left': 0.751889169216156,
                                    'Top': 0.718100905418396
                                },
                                'Polygon': [
                                    {
                                        'X': 0.751889169216156,
                                        'Y': 0.718100905418396
                                    },
                                    {
                                        'X': 0.8652393221855164,
                                        'Y': 0.718100905418396
                                    },
                                    {
                                        'X': 0.8652393221855164,
                                        'Y': 0.7448071241378784
                                    },
                                    {
                                        'X': 0.751889169216156,
                                        'Y': 0.7448071241378784
                                    }
                                ]
                            },
                            'Confidence': 98.65412139892578
                        },
                        'PageNumber': 1
                    }
                ],
                'LineItemGroups': [
                    {
                        'LineItemGroupIndex': 1,
                        'LineItems': [
                            {
                                'LineItemExpenseFields': [
                                    {
                                        'Type': {
                                            'Text': 'QUANTITY',
                                            'Confidence': 70
                                        },
                                        'LabelDetection': {
                                            'Text': 'QTY',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.1109384223818779,
                                                    'Height': 0.03845590725541115,
                                                    'Left': 0.04773123934864998,
                                                    'Top': 0.4537229835987091
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.49217888712882996
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.6721420288086
                                        },
                                        'ValueDetection': {
                                            'Text': '1',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.1109384223818779,
                                                    'Height': 0.05546529218554497,
                                                    'Left': 0.04773123934864998,
                                                    'Top': 0.49217888712882996
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.5476441979408264
                                                    },
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.5476441979408264
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.8576889038086
                                        },
                                        'PageNumber': 1
                                    },
                                    {
                                        'Type': {
                                            'Text': 'ITEM',
                                            'Confidence': 70
                                        },
                                        'LabelDetection': {
                                            'Text': 'DESC',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.462954580783844,
                                                    'Height': 0.03845590725541115,
                                                    'Left': 0.15866966545581818,
                                                    'Top': 0.4537229835987091
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.49217888712882996
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.87230682373047
                                        },
                                        'ValueDetection': {
                                            'Text': 'Sleeveless shirt',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.462954580783844,
                                                    'Height': 0.05546529218554497,
                                                    'Left': 0.15866966545581818,
                                                    'Top': 0.49217888712882996
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.5476441979408264
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.5476441979408264
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.98863220214844
                                        },
                                        'PageNumber': 1
                                    },
                                    {
                                        'Type': {
                                            'Text': 'PRICE',
                                            'Confidence': 70
                                        },
                                        'LabelDetection': {
                                            'Text': 'AMT',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.32854849100112915,
                                                    'Height': 0.03845590725541115,
                                                    'Left': 0.621624231338501,
                                                    'Top': 0.4537229835987091
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.49217888712882996
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.87963104248047
                                        },
                                        'ValueDetection': {
                                            'Text': '$19.99',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.32854849100112915,
                                                    'Height': 0.05546529218554497,
                                                    'Left': 0.621624231338501,
                                                    'Top': 0.49217888712882996
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.5476441979408264
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.5476441979408264
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.93428802490234
                                        },
                                        'PageNumber': 1
                                    },
                                    {
                                        'Type': {
                                            'Text': 'EXPENSE_ROW',
                                            'Confidence': 99.99391174316406
                                        },
                                        'ValueDetection': {
                                            'Text': '1 Sleeveless shirt $19.99',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.9024415016174316,
                                                    'Height': 0.05546529218554497,
                                                    'Left': 0.04773123934864998,
                                                    'Top': 0.49217888712882996
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.5476441979408264
                                                    },
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.5476441979408264
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.94229888916016
                                        },
                                        'PageNumber': 1
                                    }
                                ]
                            },
                            {
                                'LineItemExpenseFields': [
                                    {
                                        'Type': {
                                            'Text': 'QUANTITY',
                                            'Confidence': 70
                                        },
                                        'LabelDetection': {
                                            'Text': 'QTY',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.1109384223818779,
                                                    'Height': 0.03845590725541115,
                                                    'Left': 0.04773123934864998,
                                                    'Top': 0.4537229835987091
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.49217888712882996
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.6721420288086
                                        },
                                        'ValueDetection': {
                                            'Text': '1',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.1109384223818779,
                                                    'Height': 0.04733040928840637,
                                                    'Left': 0.04773123934864998,
                                                    'Top': 0.5476441979408264
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.5476441979408264
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.5476441979408264
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.5949745774269104
                                                    },
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.5949745774269104
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.90131378173828
                                        },
                                        'PageNumber': 1
                                    },
                                    {
                                        'Type': {
                                            'Text': 'ITEM',
                                            'Confidence': 70
                                        },
                                        'LabelDetection': {
                                            'Text': 'DESC',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.462954580783844,
                                                    'Height': 0.03845590725541115,
                                                    'Left': 0.15866966545581818,
                                                    'Top': 0.4537229835987091
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.49217888712882996
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.87230682373047
                                        },
                                        'ValueDetection': {
                                            'Text': 'Faded jeans',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.462954580783844,
                                                    'Height': 0.04733040928840637,
                                                    'Left': 0.15866966545581818,
                                                    'Top': 0.5476441979408264
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.5476441979408264
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.5476441979408264
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.5949745774269104
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.5949745774269104
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.9793701171875
                                        },
                                        'PageNumber': 1
                                    },
                                    {
                                        'Type': {
                                            'Text': 'PRICE',
                                            'Confidence': 70
                                        },
                                        'LabelDetection': {
                                            'Text': 'AMT',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.32854849100112915,
                                                    'Height': 0.03845590725541115,
                                                    'Left': 0.621624231338501,
                                                    'Top': 0.4537229835987091
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.49217888712882996
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.87963104248047
                                        },
                                        'ValueDetection': {
                                            'Text': '$39.99',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.32854849100112915,
                                                    'Height': 0.04733040928840637,
                                                    'Left': 0.621624231338501,
                                                    'Top': 0.5476441979408264
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.5476441979408264
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.5476441979408264
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.5949746370315552
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.5949745774269104
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.93222045898438
                                        },
                                        'PageNumber': 1
                                    },
                                    {
                                        'Type': {
                                            'Text': 'EXPENSE_ROW',
                                            'Confidence': 99.99391174316406
                                        },
                                        'ValueDetection': {
                                            'Text': '1 Faded jeans $39.99',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.9024415016174316,
                                                    'Height': 0.04733040928840637,
                                                    'Left': 0.04773123934864998,
                                                    'Top': 0.5476441979408264
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.5476441979408264
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.5476441979408264
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.5949746370315552
                                                    },
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.5949745774269104
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.94805908203125
                                        },
                                        'PageNumber': 1
                                    }
                                ]
                            },
                            {
                                'LineItemExpenseFields': [
                                    {
                                        'Type': {
                                            'Text': 'QUANTITY',
                                            'Confidence': 70
                                        },
                                        'LabelDetection': {
                                            'Text': 'QTY',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.1109384223818779,
                                                    'Height': 0.03845590725541115,
                                                    'Left': 0.04773123934864998,
                                                    'Top': 0.4537229835987091
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.49217888712882996
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.6721420288086
                                        },
                                        'ValueDetection': {
                                            'Text': '1',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.1109384223818779,
                                                    'Height': 0.0488094687461853,
                                                    'Left': 0.04773123934864998,
                                                    'Top': 0.5949745774269104
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.5949745774269104
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.5949745774269104
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.6437840461730957
                                                    },
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.6437840461730957
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.93717956542969
                                        },
                                        'PageNumber': 1
                                    },
                                    {
                                        'Type': {
                                            'Text': 'ITEM',
                                            'Confidence': 70
                                        },
                                        'LabelDetection': {
                                            'Text': 'DESC',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.462954580783844,
                                                    'Height': 0.03845590725541115,
                                                    'Left': 0.15866966545581818,
                                                    'Top': 0.4537229835987091
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.49217888712882996
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.87230682373047
                                        },
                                        'ValueDetection': {
                                            'Text': 'Long dress',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.462954580783844,
                                                    'Height': 0.0488094687461853,
                                                    'Left': 0.15866966545581818,
                                                    'Top': 0.5949745774269104
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.5949745774269104
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.5949745774269104
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.6437840461730957
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.6437840461730957
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.9900131225586
                                        },
                                        'PageNumber': 1
                                    },
                                    {
                                        'Type': {
                                            'Text': 'PRICE',
                                            'Confidence': 70
                                        },
                                        'LabelDetection': {
                                            'Text': 'AMT',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.32854849100112915,
                                                    'Height': 0.03845590725541115,
                                                    'Left': 0.621624231338501,
                                                    'Top': 0.4537229835987091
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.49217888712882996
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.87963104248047
                                        },
                                        'ValueDetection': {
                                            'Text': '$67.99',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.32854849100112915,
                                                    'Height': 0.0488094687461853,
                                                    'Left': 0.621624231338501,
                                                    'Top': 0.5949745774269104
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.5949745774269104
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.5949745774269104
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.6437840461730957
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.6437840461730957
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.90509796142578
                                        },
                                        'PageNumber': 1
                                    },
                                    {
                                        'Type': {
                                            'Text': 'EXPENSE_ROW',
                                            'Confidence': 99.99391174316406
                                        },
                                        'ValueDetection': {
                                            'Text': '1 Long dress $67.99',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.9024415016174316,
                                                    'Height': 0.0488094687461853,
                                                    'Left': 0.04773123934864998,
                                                    'Top': 0.5949745774269104
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.5949745774269104
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.5949745774269104
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.6437840461730957
                                                    },
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.6437840461730957
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.95557403564453
                                        },
                                        'PageNumber': 1
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ],
        'JobStatus': 'SUCCEEDED',
        'NextToken': 'fake-token'
    },
    {
        'DocumentMetadata': {
            'Pages': 1
        },
        'ExpenseDocuments': [
            {
                'ExpenseIndex': 1,
                'SummaryFields': [
                    {
                        'Type': {
                            'Text': 'VENDOR_NAME',
                            'Confidence': 98.45835876464844
                        },
                        'ValueDetection': {
                            'Text': "gessie's",
                            'Geometry': {
                                'BoundingBox': {
                                    'Width': 0.37027707695961,
                                    'Height': 0.09495548903942108,
                                    'Left': 0.31989923119544983,
                                    'Top': 0.05341246351599693
                                },
                                'Polygon': [
                                    {
                                        'X': 0.31989923119544983,
                                        'Y': 0.05341246351599693
                                    },
                                    {
                                        'X': 0.6901763081550598,
                                        'Y': 0.05341246351599693
                                    },
                                    {
                                        'X': 0.6901763081550598,
                                        'Y': 0.1483679562807083
                                    },
                                    {
                                        'X': 0.31989923119544983,
                                        'Y': 0.1483679562807083
                                    }
                                ]
                            },
                            'Confidence': 98.21408081054688
                        },
                        'PageNumber': 1
                    },
                    {
                        'Type': {
                            'Text': 'OTHER',
                            'Confidence': 95.5
                        },
                        'LabelDetection': {
                            'Text': 'CHANGE',
                            'Geometry': {
                                'BoundingBox': {
                                    'Width': 0.13937808573246002,
                                    'Height': 0.02390395663678646,
                                    'Left': 0.20517697930335999,
                                    'Top': 0.8792641162872314
                                },
                                'Polygon': [
                                    {
                                        'X': 0.20517697930335999,
                                        'Y': 0.8792641162872314
                                    },
                                    {
                                        'X': 0.3445550501346588,
                                        'Y': 0.8792641162872314
                                    },
                                    {
                                        'X': 0.3445550501346588,
                                        'Y': 0.9031680822372437
                                    },
                                    {
                                        'X': 0.20517697930335999,
                                        'Y': 0.9031680822372437
                                    }
                                ]
                            },
                            'Confidence': 95.48808288574219
                        },
                        'ValueDetection': {
                            'Text': '$14.35',
                            'Geometry': {
                                'BoundingBox': {
                                    'Width': 0.1408701390028,
                                    'Height': 0.02843857929110527,
                                    'Left': 0.7504773736000061,
                                    'Top': 0.8776286840438843
                                },
                                'Polygon': [
                                    {
                                        'X': 0.7504773736000061,
                                        'Y': 0.8776286840438843
                                    },
                                    {
                                        'X': 0.8913475275039673,
                                        'Y': 0.8776286840438843
                                    },
                                    {
                                        'X': 0.8913475275039673,
                                        'Y': 0.9060672521591187
                                    },
                                    {
                                        'X': 0.7504773736000061,
                                        'Y': 0.9060672521591187
                                    }
                                ]
                            },
                            'Confidence': 95.2452392578125
                        },
                        'PageNumber': 1
                    },
                    {
                        'Type': {
                            'Text': 'SUBTOTAL',
                            'Confidence': 99.91777801513672
                        },
                        'LabelDetection': {
                            'Text': 'SUBTOTAL',
                            'Geometry': {
                                'BoundingBox': {
                                    'Width': 0.185138538479805,
                                    'Height': 0.022255193442106247,
                                    'Left': 0.20403023064136505,
                                    'Top': 0.6750741600990295
                                },
                                'Polygon': [
                                    {
                                        'X': 0.20403023064136505,
                                        'Y': 0.6750741600990295
                                    },
                                    {
                                        'X': 0.38916876912117004,
                                        'Y': 0.6750741600990295
                                    },
                                    {
                                        'X': 0.38916876912117004,
                                        'Y': 0.6973294019699097
                                    },
                                    {
                                        'X': 0.20403023064136505,
                                        'Y': 0.6973294019699097
                                    }
                                ]
                            },
                            'Confidence': 99.89358520507812
                        },
                        'ValueDetection': {
                            'Text': '$127.97',
                            'Geometry': {
                                'BoundingBox': {
                                    'Width': 0.1586901694536209,
                                    'Height': 0.026706231757998466,
                                    'Left': 0.751889169216156,
                                    'Top': 0.6735904812812805
                                },
                                'Polygon': [
                                    {
                                        'X': 0.751889169216156,
                                        'Y': 0.6735904812812805
                                    },
                                    {
                                        'X': 0.9105793237686157,
                                        'Y': 0.6735904812812805
                                    },
                                    {
                                        'X': 0.9105793237686157,
                                        'Y': 0.7002967596054077
                                    },
                                    {
                                        'X': 0.751889169216156,
                                        'Y': 0.7002967596054077
                                    }
                                ]
                            },
                            'Confidence': 99.83346557617188
                        },
                        'PageNumber': 1
                    },
                    {
                        'Type': {
                            'Text': 'TAX',
                            'Confidence': 98.72119140625
                        },
                        'LabelDetection': {
                            'Text': 'TAX 6%',
                            'Geometry': {
                                'BoundingBox': {
                                    'Width': 0.13853904604911804,
                                    'Height': 0.024480711668729782,
                                    'Left': 0.20403023064136505,
                                    'Top': 0.718100905418396
                                },
                                'Polygon': [
                                    {
                                        'X': 0.20403023064136505,
                                        'Y': 0.718100905418396
                                    },
                                    {
                                        'X': 0.3425692617893219,
                                        'Y': 0.718100905418396
                                    },
                                    {
                                        'X': 0.3425692617893219,
                                        'Y': 0.7425816059112549
                                    },
                                    {
                                        'X': 0.20403023064136505,
                                        'Y': 0.7425816059112549
                                    }
                                ]
                            },
                            'Confidence': 98.7058334350586
                        },
                        'ValueDetection': {
                            'Text': '$7.68',
                            'Geometry': {
                                'BoundingBox': {
                                    'Width': 0.11335012316703796,
                                    'Height': 0.026706231757998466,
                                    'Left': 0.751889169216156,
                                    'Top': 0.718100905418396
                                },
                                'Polygon': [
                                    {
                                        'X': 0.751889169216156,
                                        'Y': 0.718100905418396
                                    },
                                    {
                                        'X': 0.8652393221855164,
                                        'Y': 0.718100905418396
                                    },
                                    {
                                        'X': 0.8652393221855164,
                                        'Y': 0.7448071241378784
                                    },
                                    {
                                        'X': 0.751889169216156,
                                        'Y': 0.7448071241378784
                                    }
                                ]
                            },
                            'Confidence': 98.65412139892578
                        },
                        'PageNumber': 1
                    }
                ],
                'LineItemGroups': [
                    {
                        'LineItemGroupIndex': 1,
                        'LineItems': [
                            {
                                'LineItemExpenseFields': [
                                    {
                                        'Type': {
                                            'Text': 'QUANTITY',
                                            'Confidence': 70
                                        },
                                        'LabelDetection': {
                                            'Text': 'QTY',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.1109384223818779,
                                                    'Height': 0.03845590725541115,
                                                    'Left': 0.04773123934864998,
                                                    'Top': 0.4537229835987091
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.49217888712882996
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.6721420288086
                                        },
                                        'ValueDetection': {
                                            'Text': '1',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.1109384223818779,
                                                    'Height': 0.05546529218554497,
                                                    'Left': 0.04773123934864998,
                                                    'Top': 0.49217888712882996
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.5476441979408264
                                                    },
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.5476441979408264
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.8576889038086
                                        },
                                        'PageNumber': 1
                                    },
                                    {
                                        'Type': {
                                            'Text': 'ITEM',
                                            'Confidence': 70
                                        },
                                        'LabelDetection': {
                                            'Text': 'DESC',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.462954580783844,
                                                    'Height': 0.03845590725541115,
                                                    'Left': 0.15866966545581818,
                                                    'Top': 0.4537229835987091
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.49217888712882996
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.87230682373047
                                        },
                                        'ValueDetection': {
                                            'Text': 'Sleeveless shirt',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.462954580783844,
                                                    'Height': 0.05546529218554497,
                                                    'Left': 0.15866966545581818,
                                                    'Top': 0.49217888712882996
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.5476441979408264
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.5476441979408264
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.98863220214844
                                        },
                                        'PageNumber': 1
                                    },
                                    {
                                        'Type': {
                                            'Text': 'PRICE',
                                            'Confidence': 70
                                        },
                                        'LabelDetection': {
                                            'Text': 'AMT',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.32854849100112915,
                                                    'Height': 0.03845590725541115,
                                                    'Left': 0.621624231338501,
                                                    'Top': 0.4537229835987091
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.49217888712882996
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.87963104248047
                                        },
                                        'ValueDetection': {
                                            'Text': '$19.99',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.32854849100112915,
                                                    'Height': 0.05546529218554497,
                                                    'Left': 0.621624231338501,
                                                    'Top': 0.49217888712882996
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.5476441979408264
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.5476441979408264
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.93428802490234
                                        },
                                        'PageNumber': 1
                                    },
                                    {
                                        'Type': {
                                            'Text': 'EXPENSE_ROW',
                                            'Confidence': 99.99391174316406
                                        },
                                        'ValueDetection': {
                                            'Text': '1 Sleeveless shirt $19.99',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.9024415016174316,
                                                    'Height': 0.05546529218554497,
                                                    'Left': 0.04773123934864998,
                                                    'Top': 0.49217888712882996
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.5476441979408264
                                                    },
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.5476441979408264
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.94229888916016
                                        },
                                        'PageNumber': 1
                                    }
                                ]
                            },
                            {
                                'LineItemExpenseFields': [
                                    {
                                        'Type': {
                                            'Text': 'QUANTITY',
                                            'Confidence': 70
                                        },
                                        'LabelDetection': {
                                            'Text': 'QTY',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.1109384223818779,
                                                    'Height': 0.03845590725541115,
                                                    'Left': 0.04773123934864998,
                                                    'Top': 0.4537229835987091
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.49217888712882996
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.6721420288086
                                        },
                                        'ValueDetection': {
                                            'Text': '1',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.1109384223818779,
                                                    'Height': 0.04733040928840637,
                                                    'Left': 0.04773123934864998,
                                                    'Top': 0.5476441979408264
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.5476441979408264
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.5476441979408264
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.5949745774269104
                                                    },
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.5949745774269104
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.90131378173828
                                        },
                                        'PageNumber': 1
                                    },
                                    {
                                        'Type': {
                                            'Text': 'ITEM',
                                            'Confidence': 70
                                        },
                                        'LabelDetection': {
                                            'Text': 'DESC',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.462954580783844,
                                                    'Height': 0.03845590725541115,
                                                    'Left': 0.15866966545581818,
                                                    'Top': 0.4537229835987091
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.49217888712882996
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.87230682373047
                                        },
                                        'ValueDetection': {
                                            'Text': 'Faded jeans',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.462954580783844,
                                                    'Height': 0.04733040928840637,
                                                    'Left': 0.15866966545581818,
                                                    'Top': 0.5476441979408264
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.5476441979408264
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.5476441979408264
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.5949745774269104
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.5949745774269104
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.9793701171875
                                        },
                                        'PageNumber': 1
                                    },
                                    {
                                        'Type': {
                                            'Text': 'PRICE',
                                            'Confidence': 70
                                        },
                                        'LabelDetection': {
                                            'Text': 'AMT',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.32854849100112915,
                                                    'Height': 0.03845590725541115,
                                                    'Left': 0.621624231338501,
                                                    'Top': 0.4537229835987091
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.49217888712882996
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.87963104248047
                                        },
                                        'ValueDetection': {
                                            'Text': '$39.99',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.32854849100112915,
                                                    'Height': 0.04733040928840637,
                                                    'Left': 0.621624231338501,
                                                    'Top': 0.5476441979408264
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.5476441979408264
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.5476441979408264
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.5949746370315552
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.5949745774269104
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.93222045898438
                                        },
                                        'PageNumber': 1
                                    },
                                    {
                                        'Type': {
                                            'Text': 'EXPENSE_ROW',
                                            'Confidence': 99.99391174316406
                                        },
                                        'ValueDetection': {
                                            'Text': '1 Faded jeans $39.99',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.9024415016174316,
                                                    'Height': 0.04733040928840637,
                                                    'Left': 0.04773123934864998,
                                                    'Top': 0.5476441979408264
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.5476441979408264
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.5476441979408264
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.5949746370315552
                                                    },
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.5949745774269104
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.94805908203125
                                        },
                                        'PageNumber': 1
                                    }
                                ]
                            },
                            {
                                'LineItemExpenseFields': [
                                    {
                                        'Type': {
                                            'Text': 'QUANTITY',
                                            'Confidence': 70
                                        },
                                        'LabelDetection': {
                                            'Text': 'QTY',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.1109384223818779,
                                                    'Height': 0.03845590725541115,
                                                    'Left': 0.04773123934864998,
                                                    'Top': 0.4537229835987091
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.49217888712882996
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.6721420288086
                                        },
                                        'ValueDetection': {
                                            'Text': '1',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.1109384223818779,
                                                    'Height': 0.0488094687461853,
                                                    'Left': 0.04773123934864998,
                                                    'Top': 0.5949745774269104
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.5949745774269104
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.5949745774269104
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.6437840461730957
                                                    },
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.6437840461730957
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.93717956542969
                                        },
                                        'PageNumber': 1
                                    },
                                    {
                                        'Type': {
                                            'Text': 'ITEM',
                                            'Confidence': 70
                                        },
                                        'LabelDetection': {
                                            'Text': 'DESC',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.462954580783844,
                                                    'Height': 0.03845590725541115,
                                                    'Left': 0.15866966545581818,
                                                    'Top': 0.4537229835987091
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.49217888712882996
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.87230682373047
                                        },
                                        'ValueDetection': {
                                            'Text': 'Long dress',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.462954580783844,
                                                    'Height': 0.0488094687461853,
                                                    'Left': 0.15866966545581818,
                                                    'Top': 0.5949745774269104
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.5949745774269104
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.5949745774269104
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.6437840461730957
                                                    },
                                                    {
                                                        'X': 0.15866966545581818,
                                                        'Y': 0.6437840461730957
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.9900131225586
                                        },
                                        'PageNumber': 1
                                    },
                                    {
                                        'Type': {
                                            'Text': 'PRICE',
                                            'Confidence': 70
                                        },
                                        'LabelDetection': {
                                            'Text': 'AMT',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.32854849100112915,
                                                    'Height': 0.03845590725541115,
                                                    'Left': 0.621624231338501,
                                                    'Top': 0.4537229835987091
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.4537229835987091
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.49217888712882996
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.49217888712882996
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.87963104248047
                                        },
                                        'ValueDetection': {
                                            'Text': '$67.99',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.32854849100112915,
                                                    'Height': 0.0488094687461853,
                                                    'Left': 0.621624231338501,
                                                    'Top': 0.5949745774269104
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.5949745774269104
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.5949745774269104
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.6437840461730957
                                                    },
                                                    {
                                                        'X': 0.621624231338501,
                                                        'Y': 0.6437840461730957
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.90509796142578
                                        },
                                        'PageNumber': 1
                                    },
                                    {
                                        'Type': {
                                            'Text': 'EXPENSE_ROW',
                                            'Confidence': 99.99391174316406
                                        },
                                        'ValueDetection': {
                                            'Text': '1 Long dress $67.99',
                                            'Geometry': {
                                                'BoundingBox': {
                                                    'Width': 0.9024415016174316,
                                                    'Height': 0.0488094687461853,
                                                    'Left': 0.04773123934864998,
                                                    'Top': 0.5949745774269104
                                                },
                                                'Polygon': [
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.5949745774269104
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.5949745774269104
                                                    },
                                                    {
                                                        'X': 0.9501727223396301,
                                                        'Y': 0.6437840461730957
                                                    },
                                                    {
                                                        'X': 0.04773123934864998,
                                                        'Y': 0.6437840461730957
                                                    }
                                                ]
                                            },
                                            'Confidence': 99.95557403564453
                                        },
                                        'PageNumber': 1
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ],
        'JobStatus': 'SUCCEEDED'
    }
];

exports.asyncTextractDetectTextSuccessResponses = [
    {
        'DocumentMetadata': {
            'Pages': 1
        },
        'Blocks': [
            {
                'BlockType': 'PAGE',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 0.9949871897697449,
                        'Height': 1,
                        'Left': 0.005012827459722757,
                        'Top': 0
                    },
                    'Polygon': [
                        {
                            'X': 0.005012827459722757,
                            'Y': 0
                        },
                        {
                            'X': 1,
                            'Y': 0
                        },
                        {
                            'X': 1,
                            'Y': 1
                        },
                        {
                            'X': 0.005034519359469414,
                            'Y': 1
                        }
                    ]
                },
                'Id': '89b86524-85f2-4e21-8a87-e8c99f7921e8',
                'Relationships': [
                    {
                        'Type': 'CHILD',
                        'Ids': [
                            'bfc857bc-7d59-4c0e-81b7-a2fd85d8b2f4',
                            '21236fbe-0c4d-46e6-b7a4-274adbf92652',
                            'a9dd1c42-1b7c-481b-a595-78836d16dab2',
                            '2fbc815b-bdcb-4748-a937-1a0441ebccbe'
                        ]
                    }
                ]
            },
            {
                'BlockType': 'LINE',
                'Confidence': 87.97724151611328,
                'Text': "Jessie's",
                'Geometry': {
                    'BoundingBox': {
                        'Width': 0.38175228238105774,
                        'Height': 0.0964236631989479,
                        'Left': 0.3136627674102783,
                        'Top': 0.0540199801325798
                    },
                    'Polygon': [
                        {
                            'X': 0.3136627674102783,
                            'Y': 0.05471234768629074
                        },
                        {
                            'X': 0.6953703165054321,
                            'Y': 0.0540199801325798
                        },
                        {
                            'X': 0.6954150795936584,
                            'Y': 0.1497698575258255
                        },
                        {
                            'X': 0.3136839270591736,
                            'Y': 0.1504436433315277
                        }
                    ]
                },
                'Id': 'bfc857bc-7d59-4c0e-81b7-a2fd85d8b2f4',
                'Relationships': [
                    {
                        'Type': 'CHILD',
                        'Ids': ['c7577634-842a-457d-b701-f8fa476de1a1']
                    }
                ]
            },
            {
                'BlockType': 'LINE',
                'Confidence': 99.93238067626953,
                'Text': '1',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 0.016791926696896553,
                        'Height': 0.020428143441677094,
                        'Left': 0.05896774306893349,
                        'Top': 0.559644877910614
                    },
                    'Polygon': [
                        {
                            'X': 0.05896774306893349,
                            'Y': 0.5596710443496704
                        },
                        {
                            'X': 0.07575829327106476,
                            'Y': 0.559644877910614
                        },
                        {
                            'X': 0.07575967162847519,
                            'Y': 0.580047070980072
                        },
                        {
                            'X': 0.05896889418363571,
                            'Y': 0.5800729990005493
                        }
                    ]
                },
                'Id': '44c01d10-677a-42c4-a542-861b864e6055',
                'Relationships': [
                    {
                        'Type': 'CHILD',
                        'Ids': ['5290b9ce-b723-46d6-b823-90b55622a003']
                    }
                ]
            }
        ],
        'DetectDocumentTextModelVersion': '1.0',
        'JobStatus': 'SUCCEEDED',
        'NextToken': 'fake-token'
    },
    {
        'DocumentMetadata': {
            'Pages': 1
        },
        'Blocks': [
            {
                'BlockType': 'LINE',
                'Confidence': 99.93238067626953,
                'Text': '1',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 0.016791926696896553,
                        'Height': 0.020428143441677094,
                        'Left': 0.05896774306893349,
                        'Top': 0.559644877910614
                    },
                    'Polygon': [
                        {
                            'X': 0.05896774306893349,
                            'Y': 0.5596710443496704
                        },
                        {
                            'X': 0.07575829327106476,
                            'Y': 0.559644877910614
                        },
                        {
                            'X': 0.07575967162847519,
                            'Y': 0.580047070980072
                        },
                        {
                            'X': 0.05896889418363571,
                            'Y': 0.5800729990005493
                        }
                    ]
                },
                'Id': '44c01d10-677a-42c4-a542-861b864e6055',
                'Relationships': [
                    {
                        'Type': 'CHILD',
                        'Ids': ['5290b9ce-b723-46d6-b823-90b55622a003']
                    }
                ]
            }
        ],
        'DetectDocumentTextModelVersion': '1.0',
        'JobStatus': 'SUCCEEDED',
        'NextToken': 'fake-token'
    },
    {
        'DocumentMetadata': {
            'Pages': 1
        },
        'Blocks': [
            {
                'BlockType': 'LINE',
                'Confidence': 99.93238067626953,
                'Text': '1',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 0.016791926696896553,
                        'Height': 0.020428143441677094,
                        'Left': 0.05896774306893349,
                        'Top': 0.559644877910614
                    },
                    'Polygon': [
                        {
                            'X': 0.05896774306893349,
                            'Y': 0.5596710443496704
                        },
                        {
                            'X': 0.07575829327106476,
                            'Y': 0.559644877910614
                        },
                        {
                            'X': 0.07575967162847519,
                            'Y': 0.580047070980072
                        },
                        {
                            'X': 0.05896889418363571,
                            'Y': 0.5800729990005493
                        }
                    ]
                },
                'Id': '44c01d10-677a-42c4-a542-861b864e6055',
                'Relationships': [
                    {
                        'Type': 'CHILD',
                        'Ids': ['5290b9ce-b723-46d6-b823-90b55622a003']
                    }
                ]
            }
        ],
        'DetectDocumentTextModelVersion': '1.0',
        'JobStatus': 'SUCCEEDED'
    }
];

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

exports.asyncTextractSQSLambdaSuccessEvent = {
    'Records': [
        {
            'messageId': '5c235c64-7830-4fb2-b3ee-a5b62d4223e7',
            'receiptHandle': 'MessageReceiptHandle',
            'body': {
                'JobId': 'job-id',
                'Status': 'SUCCEEDED',
                'API': 'StartDocumentAnalysis',
                'JobTag': 'String',
                'Timestamp': 1234,
                'DocumentLocation': {
                    'S3ObjectName': 'location',
                    'S3Bucket': 'bucket'
                }
            },
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

exports.asyncTextractSQSLambdaFailureEvent = {
    'Records': [
        {
            'messageId': '5c235c64-7830-4fb2-b3ee-a5b62d4223e7',
            'receiptHandle': 'MessageReceiptHandle',
            'body': {
                'JobId': 'job-id',
                'Status': 'FAILED',
                'API': 'StartDocumentAnalysis',
                'JobTag': 'String',
                'Timestamp': 1234,
                'DocumentLocation': {
                    'S3ObjectName': 'location',
                    'S3Bucket': 'bucket'
                }
            },
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
