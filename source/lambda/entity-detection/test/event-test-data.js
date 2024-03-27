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

exports.sqsMessage = {
    Records: [
        {
            messageId: 'fakeMessageId',
            receiptHandle: 'fakeReceiptHandler',
            body: {
                taskToken: 'fakeToken',
                input: {
                    stage: 'entity-standard',
                    document: {
                        caseId: 'fakeCaseId',
                        id: 'fakeDocId',
                        selfCertifiedDocType: 'Paystub',
                        s3Prefix: 's3://fake-s3uri/fake-bucket/file1.jpg',
                        piiFlag: true,
                        processingType: 'sync'
                    },
                    inferences: {
                        [SharedLib.InferenceTypes.TEXTRACT_DETECT_TEXT]: 'fake-s3-key1',
                        [SharedLib.InferenceTypes.TEXTRACT_ANALYZE_ID]: 'fake-s3-key2'
                    }
                }
            },
            attribute: {
                ApproximateReceiveCount: '1',
                SentTimestamp: '1545082649183',
                SenderId: 'fakeSenderId',
                ApproximateFirstReceiveTimestamp: '1545082649185'
            },
            messageAttributes: {},
            md5OfBody: 'fakeMD5OfBody',
            eventSource: 'fakeEventSource',
            eventSourceARN: 'fakeEventSourceARN',
            awsRegion: 'fakeAWSRegion'
        }
    ]
};

// polygon fields ommitted since they are unused.
// test data has the same values for both pages
exports.textractDetectTextInference = [
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
                            'X': 0,
                            'Y': 0
                        },
                        {
                            'X': 1,
                            'Y': 4.455357895949419e-7
                        },
                        {
                            'X': 1,
                            'Y': 1
                        },
                        {
                            'X': 8.267451789834013e-7,
                            'Y': 1
                        }
                    ]
                },
                'Id': 'page1',
                'Relationships': [
                    {
                        'Type': 'CHILD',
                        'Ids': ['line1', 'line2']
                    }
                ]
            },
            {
                'BlockType': 'LINE',
                'Confidence': 99.41443634033203,
                'Text': 'This is a 2023 test about John',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 7,
                        'Height': 1,
                        'Left': 0,
                        'Top': 0
                    }
                },
                'Id': 'line1',
                'Relationships': [
                    {
                        'Type': 'CHILD',
                        'Ids': ['word1', 'word2', 'word3', 'word4', 'word5', 'word6', 'word7']
                    }
                ]
            },
            {
                'BlockType': 'LINE',
                'Confidence': 98.38265228271484,
                'Text': 'Doe, New York. john doe.',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 3,
                        'Height': 1,
                        'Left': 0,
                        'Top': 1
                    }
                },
                'Id': 'line2',
                'Relationships': [
                    {
                        'Type': 'CHILD',
                        'Ids': ['word8', 'word9', 'word10', 'word11', 'word12']
                    }
                ]
            },
            {
                'BlockType': 'LINE',
                'Confidence': 98.38265228271484,
                'Text': 'it is it is repeating.',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 5,
                        'Height': 1,
                        'Left': 0,
                        'Top': 2
                    }
                },
                'Id': 'line3',
                'Relationships': [
                    {
                        'Type': 'CHILD',
                        'Ids': ['word13', 'word14', 'word15', 'word16', 'word17']
                    }
                ]
            },
            {
                'BlockType': 'WORD',
                'Confidence': 98.13988494873047,
                'Text': 'This',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 0,
                        'Top': 0
                    }
                },
                'Id': 'word1'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 98.78559875488281,
                'Text': 'is',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 1,
                        'Top': 0
                    }
                },
                'Id': 'word2'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 99.97274017333984,
                'Text': 'a',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 2,
                        'Top': 0
                    }
                },
                'Id': 'word3'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 99.97218322753906,
                'Text': '2023',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 3,
                        'Top': 0
                    }
                },
                'Id': 'word4'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 99.65723419189453,
                'Text': 'test',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 4,
                        'Top': 0
                    }
                },
                'Id': 'word5'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 99.92205810546875,
                'Text': 'about',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 5,
                        'Top': 0
                    }
                },
                'Id': 'word6'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 99.45137786865234,
                'Text': 'John',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 6,
                        'Top': 0
                    }
                },
                'Id': 'word7'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 96.13420104980469,
                'Text': 'Doe,',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 0,
                        'Top': 1
                    }
                },
                'Id': 'word8'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 99.56139373779297,
                'Text': 'New',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 1,
                        'Top': 1
                    }
                },
                'Id': 'word9'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 99.45236206054688,
                'Text': 'York.',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 2,
                        'Top': 1
                    }
                },
                'Id': 'word10'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 99.45236206054688,
                'Text': 'john.',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 3,
                        'Top': 1
                    }
                },
                'Id': 'word11'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 99.45236206054688,
                'Text': 'doe.',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 4,
                        'Top': 1
                    }
                },
                'Id': 'word12'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 99.45236206054688,
                'Text': 'it',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 0,
                        'Top': 2
                    }
                },
                'Id': 'word13'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 99.45236206054688,
                'Text': 'is',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 1,
                        'Top': 2
                    }
                },
                'Id': 'word14'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 99.45236206054688,
                'Text': 'it',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 2,
                        'Top': 2
                    }
                },
                'Id': 'word15'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 99.45236206054688,
                'Text': 'is',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 3,
                        'Top': 2
                    }
                },
                'Id': 'word16'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 99.45236206054688,
                'Text': 'repeating',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 4,
                        'Top': 2
                    }
                },
                'Id': 'word17'
            }
        ]
    },
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
                            'X': 0,
                            'Y': 0
                        },
                        {
                            'X': 1,
                            'Y': 4.455357895949419e-7
                        },
                        {
                            'X': 1,
                            'Y': 1
                        },
                        {
                            'X': 8.267451789834013e-7,
                            'Y': 1
                        }
                    ]
                },
                'Id': 'page1',
                'Relationships': [
                    {
                        'Type': 'CHILD',
                        'Ids': ['line1', 'line2']
                    }
                ]
            },
            {
                'BlockType': 'LINE',
                'Confidence': 99.41443634033203,
                'Text': 'This is a 2023 test about John',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 7,
                        'Height': 1,
                        'Left': 0,
                        'Top': 0
                    }
                },
                'Id': 'line1',
                'Relationships': [
                    {
                        'Type': 'CHILD',
                        'Ids': ['word1', 'word2', 'word3', 'word4', 'word5', 'word6', 'word7']
                    }
                ]
            },
            {
                'BlockType': 'LINE',
                'Confidence': 98.38265228271484,
                'Text': 'Doe, New York. john doe.',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 3,
                        'Height': 1,
                        'Left': 0,
                        'Top': 1
                    }
                },
                'Id': 'line2',
                'Relationships': [
                    {
                        'Type': 'CHILD',
                        'Ids': ['word8', 'word9', 'word10', 'word11', 'word12']
                    }
                ]
            },
            {
                'BlockType': 'LINE',
                'Confidence': 98.38265228271484,
                'Text': 'it is it is repeating.',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 5,
                        'Height': 1,
                        'Left': 0,
                        'Top': 2
                    }
                },
                'Id': 'line3',
                'Relationships': [
                    {
                        'Type': 'CHILD',
                        'Ids': ['word13', 'word14', 'word15', 'word16', 'word17']
                    }
                ]
            },
            {
                'BlockType': 'WORD',
                'Confidence': 98.13988494873047,
                'Text': 'This',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 0,
                        'Top': 0
                    }
                },
                'Id': 'word1'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 98.78559875488281,
                'Text': 'is',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 1,
                        'Top': 0
                    }
                },
                'Id': 'word2'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 99.97274017333984,
                'Text': 'a',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 2,
                        'Top': 0
                    }
                },
                'Id': 'word3'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 99.97218322753906,
                'Text': '2023',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 3,
                        'Top': 0
                    }
                },
                'Id': 'word4'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 99.65723419189453,
                'Text': 'test',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 4,
                        'Top': 0
                    }
                },
                'Id': 'word5'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 99.92205810546875,
                'Text': 'about',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 5,
                        'Top': 0
                    }
                },
                'Id': 'word6'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 99.45137786865234,
                'Text': 'John',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 6,
                        'Top': 0
                    }
                },
                'Id': 'word7'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 96.13420104980469,
                'Text': 'Doe,',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 0,
                        'Top': 1
                    }
                },
                'Id': 'word8'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 99.56139373779297,
                'Text': 'New',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 1,
                        'Top': 1
                    }
                },
                'Id': 'word9'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 99.45236206054688,
                'Text': 'York.',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 2,
                        'Top': 1
                    }
                },
                'Id': 'word10'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 99.45236206054688,
                'Text': 'john.',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 3,
                        'Top': 1
                    }
                },
                'Id': 'word11'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 99.45236206054688,
                'Text': 'doe.',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 4,
                        'Top': 1
                    }
                },
                'Id': 'word12'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 99.45236206054688,
                'Text': 'it',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 0,
                        'Top': 2
                    }
                },
                'Id': 'word13'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 99.45236206054688,
                'Text': 'is',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 1,
                        'Top': 2
                    }
                },
                'Id': 'word14'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 99.45236206054688,
                'Text': 'it',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 2,
                        'Top': 2
                    }
                },
                'Id': 'word15'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 99.45236206054688,
                'Text': 'is',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 3,
                        'Top': 2
                    }
                },
                'Id': 'word16'
            },
            {
                'BlockType': 'WORD',
                'Confidence': 99.45236206054688,
                'Text': 'repeating',
                'TextType': 'PRINTED',
                'Geometry': {
                    'BoundingBox': {
                        'Width': 1,
                        'Height': 1,
                        'Left': 4,
                        'Top': 2
                    }
                },
                'Id': 'word17'
            }
        ]
    }
];

exports.textractFullPageText = 'This is a 2023 test about John Doe, New York. john doe. it is it is repeating';

exports.expectedSyncComprehendResponse = {
    'Entities': [
        {
            'Score': 0.8919363021850586,
            'Type': 'DATE',
            'Text': '2023',
            'BeginOffset': 10,
            'EndOffset': 14
        },
        {
            'Score': 0.8900869488716125,
            'Type': 'PERSON',
            'Text': 'John Doe',
            'BeginOffset': 26,
            'EndOffset': 34
        },
        {
            'Score': 0.8900869488716125,
            'Type': 'LOCATION',
            'Text': 'New York',
            'BeginOffset': 36,
            'EndOffset': 44
        },
        {
            'Score': 0.8900869488716125,
            'Type': 'OTHER',
            'Text': 'This is a 2023',
            'BeginOffset': 0,
            'EndOffset': 14
        },
        {
            'Score': 0.8900869488716125,
            'Type': 'PERSON',
            'Text': 'john doe',
            'BeginOffset': 46,
            'EndOffset': 54
        },
        {
            'Score': 0.8900869488716125,
            'Type': 'OTHER',
            'Text': 'it is repeating',
            'BeginOffset': 56,
            'EndOffset': 77
        }
    ]
};

exports.expectedSyncComprehendPiiResponse = {
    'Entities': [
        {
            'Score': 0.8919363021850586,
            'Type': 'DATE',
            'BeginOffset': 10,
            'EndOffset': 14
        },
        {
            'Score': 0.8900869488716125,
            'Type': 'PERSON',
            'BeginOffset': 26,
            'EndOffset': 34
        },
        {
            'Score': 0.8900869488716125,
            'Type': 'LOCATION',
            'BeginOffset': 36,
            'EndOffset': 44
        },
        {
            'Score': 0.8900869488716125,
            'Type': 'OTHER',
            'BeginOffset': 0,
            'EndOffset': 14
        },
        {
            'Score': 0.8900869488716125,
            'Type': 'PERSON',
            'BeginOffset': 46,
            'EndOffset': 54
        }
    ]
};

exports.expectedSyncComprehendMedicalResponse = {
    Entities: [
        {
            Attributes: [
                {
                    BeginOffset: 546456,
                    Category: 'fake-category',
                    EndOffset: 45846,
                    Id: 12345,
                    RelationshipScore: 43535,
                    RelationshipType: 'fake-type',
                    Score: 0.996697902,
                    Text: 'fake-text',
                    Traits: [
                        {
                            Name: 'fake-name',
                            Score: 0.99
                        }
                    ],
                    Type: 'fake-type'
                }
            ],
            BeginOffset: 10,
            Category: 'MEDICATION',
            EndOffset: 14,
            Id: 12345,
            Score: 0.8919363021850586,
            Text: '2023',
            Traits: [
                {
                    Name: 'fake-name',
                    Score: 0.98
                }
            ],
            Type: 'DX_NAME'
        }
    ]
};

exports.expectedEntityLocations = {
    'DATE': {
        '2023': {
            '1': [
                {
                    'BoundingBoxes': [
                        {
                            'Height': 1,
                            'Left': 3,
                            'Top': 0,
                            'Width': 1
                        }
                    ],
                    'Score': 0.8919363021850586
                }
            ],
            '2': [
                {
                    'BoundingBoxes': [
                        {
                            'Height': 1,
                            'Left': 3,
                            'Top': 0,
                            'Width': 1
                        }
                    ],
                    'Score': 0.8919363021850586
                }
            ]
        }
    },
    'LOCATION': {
        'NEW YORK': {
            '1': [
                {
                    'BoundingBoxes': [
                        {
                            'Height': 1,
                            'Left': 1,
                            'Top': 1,
                            'Width': 2
                        }
                    ],
                    'Score': 0.8900869488716125
                }
            ],
            '2': [
                {
                    'BoundingBoxes': [
                        {
                            'Height': 1,
                            'Left': 1,
                            'Top': 1,
                            'Width': 2
                        }
                    ],
                    'Score': 0.8900869488716125
                }
            ]
        }
    },
    'OTHER': {
        'IT IS REPEATING': {
            '1': [
                {
                    'BoundingBoxes': [
                        {
                            'Height': 1,
                            'Left': 2,
                            'Top': 2,
                            'Width': 3
                        }
                    ],
                    'Score': 0.8900869488716125
                }
            ],
            '2': [
                {
                    'BoundingBoxes': [
                        {
                            'Height': 1,
                            'Left': 2,
                            'Top': 2,
                            'Width': 3
                        }
                    ],
                    'Score': 0.8900869488716125
                }
            ]
        },
        'THIS IS A 2023': {
            '1': [
                {
                    'BoundingBoxes': [
                        {
                            'Height': 1,
                            'Left': 0,
                            'Top': 0,
                            'Width': 4
                        }
                    ],
                    'Score': 0.8900869488716125
                }
            ],
            '2': [
                {
                    'BoundingBoxes': [
                        {
                            'Height': 1,
                            'Left': 0,
                            'Top': 0,
                            'Width': 4
                        }
                    ],
                    'Score': 0.8900869488716125
                }
            ]
        }
    },
    'PERSON': {
        'JOHN DOE': {
            '1': [
                {
                    'BoundingBoxes': [
                        {
                            'Height': 1,
                            'Left': 6,
                            'Top': 0,
                            'Width': 1
                        },
                        {
                            'Height': 1,
                            'Left': 0,
                            'Top': 1,
                            'Width': 1
                        }
                    ],
                    'Score': 0.8900869488716125
                },
                {
                    'BoundingBoxes': [
                        {
                            'Height': 1,
                            'Left': 3,
                            'Top': 1,
                            'Width': 2
                        }
                    ],
                    'Score': 0.8900869488716125
                }
            ],
            '2': [
                {
                    'BoundingBoxes': [
                        {
                            'Height': 1,
                            'Left': 6,
                            'Top': 0,
                            'Width': 1
                        },
                        {
                            'Height': 1,
                            'Left': 0,
                            'Top': 1,
                            'Width': 1
                        }
                    ],
                    'Score': 0.8900869488716125
                },
                {
                    'BoundingBoxes': [
                        {
                            'Height': 1,
                            'Left': 3,
                            'Top': 1,
                            'Width': 2
                        }
                    ],
                    'Score': 0.8900869488716125
                }
            ]
        }
    }
};

exports.expectedPiiEntityLocations = {
    'DATE': {
        '2023': {
            '1': [
                {
                    'BoundingBoxes': [
                        {
                            'Height': 1,
                            'Left': 3,
                            'Top': 0,
                            'Width': 1
                        }
                    ],
                    'Score': 0.8919363021850586
                }
            ],
            '2': [
                {
                    'BoundingBoxes': [
                        {
                            'Height': 1,
                            'Left': 3,
                            'Top': 0,
                            'Width': 1
                        }
                    ],
                    'Score': 0.8919363021850586
                }
            ]
        }
    },
    'LOCATION': {
        'NEW YORK': {
            '1': [
                {
                    'BoundingBoxes': [
                        {
                            'Height': 1,
                            'Left': 1,
                            'Top': 1,
                            'Width': 2
                        }
                    ],
                    'Score': 0.8900869488716125
                }
            ],
            '2': [
                {
                    'BoundingBoxes': [
                        {
                            'Height': 1,
                            'Left': 1,
                            'Top': 1,
                            'Width': 2
                        }
                    ],
                    'Score': 0.8900869488716125
                }
            ]
        }
    },
    'OTHER': {
        'THIS IS A 2023': {
            '1': [
                {
                    'BoundingBoxes': [
                        {
                            'Height': 1,
                            'Left': 0,
                            'Top': 0,
                            'Width': 4
                        }
                    ],
                    'Score': 0.8900869488716125
                }
            ],
            '2': [
                {
                    'BoundingBoxes': [
                        {
                            'Height': 1,
                            'Left': 0,
                            'Top': 0,
                            'Width': 4
                        }
                    ],
                    'Score': 0.8900869488716125
                }
            ]
        }
    },
    'PERSON': {
        'JOHN DOE': {
            '1': [
                {
                    'BoundingBoxes': [
                        {
                            'Height': 1,
                            'Left': 6,
                            'Top': 0,
                            'Width': 1
                        },
                        {
                            'Height': 1,
                            'Left': 0,
                            'Top': 1,
                            'Width': 1
                        }
                    ],
                    'Score': 0.8900869488716125
                },
                {
                    'BoundingBoxes': [
                        {
                            'Height': 1,
                            'Left': 3,
                            'Top': 1,
                            'Width': 2
                        }
                    ],
                    'Score': 0.8900869488716125
                }
            ],
            '2': [
                {
                    'BoundingBoxes': [
                        {
                            'Height': 1,
                            'Left': 6,
                            'Top': 0,
                            'Width': 1
                        },
                        {
                            'Height': 1,
                            'Left': 0,
                            'Top': 1,
                            'Width': 1
                        }
                    ],
                    'Score': 0.8900869488716125
                },
                {
                    'BoundingBoxes': [
                        {
                            'Height': 1,
                            'Left': 3,
                            'Top': 1,
                            'Width': 2
                        }
                    ],
                    'Score': 0.8900869488716125
                }
            ]
        }
    }
};

exports.expectedMedicalEntityLocations = {
    'MEDICATION': {
        '2023': {
            '1': [
                {
                    'BoundingBoxes': [
                        {
                            'Height': 1,
                            'Left': 3,
                            'Top': 0,
                            'Width': 1
                        }
                    ],
                    'Score': 0.8919363021850586,
                    'Type': 'DX_NAME'
                }
            ],
            '2': [
                {
                    'BoundingBoxes': [
                        {
                            'Height': 1,
                            'Left': 3,
                            'Top': 0,
                            'Width': 1
                        }
                    ],
                    'Score': 0.8919363021850586,
                    'Type': 'DX_NAME'
                }
            ]
        }
    }
};

exports.expectedStandardEntityS3Upload = {
    'document': {
        'caseId': 'fakeCaseId',
        'id': 'fakeDocId',
        'piiFlag': true,
        'processingType': 'sync',
        's3Prefix': 's3://fake-s3uri/fake-bucket/file1.jpg',
        'selfCertifiedDocType': 'Paystub'
    },
    'inferences': {
        'entity-standard': [exports.expectedSyncComprehendResponse, exports.expectedSyncComprehendResponse],
        'entity-standard-locations': exports.expectedEntityLocations,
        'textract-analyzeId': 'fake-s3-key2',
        'textract-detectText': 'fake-s3-key1'
    },
    'stage': 'entity-standard'
};

exports.expectedPiiEntityS3Upload = {
    'document': {
        'caseId': 'fakeCaseId',
        'id': 'fakeDocId',
        'piiFlag': true,
        'processingType': 'sync',
        's3Prefix': 's3://fake-s3uri/fake-bucket/file1.jpg',
        'selfCertifiedDocType': 'Paystub'
    },
    'inferences': {
        'entity-pii': [exports.expectedSyncComprehendPiiResponse, exports.expectedSyncComprehendPiiResponse],
        'entity-pii-locations': exports.expectedPiiEntityLocations,
        'textract-analyzeId': 'fake-s3-key2',
        'textract-detectText': 'fake-s3-key1'
    },
    'stage': 'entity-pii'
};

exports.expectedMedicalEntityS3Upload = {
    'document': {
        'caseId': 'fakeCaseId',
        'id': 'fakeDocId',
        'piiFlag': true,
        'processingType': 'sync',
        's3Prefix': 's3://fake-s3uri/fake-bucket/file1.jpg',
        'selfCertifiedDocType': 'Paystub'
    },
    'inferences': {
        'entity-medical': [
            exports.expectedSyncComprehendMedicalResponse,
            exports.expectedSyncComprehendMedicalResponse
        ],
        'entity-medical-locations': exports.expectedMedicalEntityLocations,
        'textract-analyzeId': 'fake-s3-key2',
        'textract-detectText': 'fake-s3-key1'
    },
    'stage': 'entity-medical'
};

exports.expectedStandardResponse = {
    inferences: {
        'entity-standard': 'entity-standard-s3-key',
        'entity-standard-locations': 'entity-standard-locations-s3-key'
    }
};

exports.expectedPiiResponse = {
    inferences: {
        'entity-pii': 'entity-pii-s3-key',
        'entity-pii-locations': 'entity-pii-locations-s3-key'
    }
};

exports.expectedMedicalResponse = {
    inferences: {
        'entity-medical': 'entity-medical-s3-key',
        'entity-medical-locations': 'entity-medical-locations-s3-key'
    }
};

// Used for asynchronous processing
exports.sqsMessagesAsync = {
    'Messages': [
        {
            taskToken: 'fakeToken1',
            message: `s3://dir1/subdir/filename1.jpg`,
            messageId: 'fakeMessageId1',
            receiptHandle: 'fakeReceiptHandler',
            body: `Test Message.`,
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
            taskToken: 'fakeToken2',
            message: `s3://dir1/subdir/filename2.jpg`,
            messageId: 'fakeMessageId2',
            receiptHandle: 'fakeReceiptHandler',
            body: `Test Message.`,
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

exports.asyncComprehendSuccessResponse = {
    JobArn: 'arn:fake-partition:comprehend:fake-region:123456789012-id:pii-entities-detection-job/fake-job-id-12345',
    JobId: 'fake-job-id-12345',
    JobStatus: 'IN PROGRESS'
};

exports.listComprehendJobs = {
    PiiEntitiesDetectionJobPropertiesList: [
        {
            DataAccessRoleArn: 'fakeDataAccessArn',
            EndTime: 123456789,
            InputDataConfig: {
                InputFormat: 'ONE_DOC_PER_FILE',
                S3Uri: 's3://fake-s3uri/fake-bucket/prefix1/input/'
            },
            JobArn: 'arn:aws:comprehend:fake-region:111122223333:pii-entities-detection-job/abcdef',
            JobId: 'fakeJobId',
            JobStatus: 'fakeJobStatus',
            LanguageCode: 'en',
            Message: 'Job in progress',
            Mode: 'fake-mode',
            OutputDataConfig: {
                S3Uri: 's3://fake-s3uri/fake-bucket/prefix2/output/'
            },
            SubmitTime: 111111111
        },
        {
            DataAccessRoleArn: 'fakeDataAccessArn',
            EndTime: 1234567899,
            InputDataConfig: {
                InputFormat: 'ONE_DOC_PER_FILE',
                S3Uri: 's3://fake-s3uri/fake-bucket/prefix1/input/'
            },
            JobArn: 'arn:aws:comprehend:fake-region:111122223333:pii-entities-detection-job/abcdef',
            JobId: 'fakeJobId',
            JobStatus: 'fakeJobStatus',
            LanguageCode: 'en',
            Message: 'Job in progress',
            Mode: 'fake-mode',
            OutputDataConfig: {
                S3Uri: 's3://fake-s3uri/fake-bucket/prefix2/output/'
            },
            SubmitTime: 111111155
        }
    ],
    NextToken: 'fakeNextToken'
};

exports.listComprehendMedicalJobs = {
    ComprehendMedicalAsyncJobPropertiesList: [
        {
            DataAccessRoleArn: 'fakeDataAccessArn',
            EndTime: 1234567899,
            ExpirationTime: 1234567856,
            InputDataConfig: {
                S3Bucket: 'my-bucket',
                S3Key: 'pii/input'
            },
            JobId: 'fakeJobId',
            JobName: 'fakeJobName',
            JobStatus: 'fakeJobStatus',
            KMSKey: 'fakeKey',
            LanguageCode: 'en',
            ManifestFilePath: 'fakePath',
            Message: 'Job in progress',
            ModelVersion: 'fakeVersion',
            OutputDataConfig: {
                S3Bucket: 'my-bucket',
                S3Key: 'pii/output'
            },
            SubmitTime: 111111111
        },
        {
            DataAccessRoleArn: 'fakeDataAccessArn',
            EndTime: 1234567899,
            ExpirationTime: 1234567856,
            InputDataConfig: {
                S3Bucket: 'my-bucket',
                S3Key: 'pii/input'
            },
            JobId: 'fakeJobId',
            JobName: 'fakeJobName',
            JobStatus: 'fakeJobStatus',
            KMSKey: 'fakeKey',
            LanguageCode: 'en',
            ManifestFilePath: 'fakePath',
            Message: 'Job in progress',
            ModelVersion: 'fakeVersion',
            OutputDataConfig: {
                S3Bucket: 'my-bucket',
                S3Key: 'pii/output'
            },
            SubmitTime: 111111155
        }
    ],
    NextToken: 'fakeNextToken'
};

exports.dynamoDBBatchWriteResponse = {
    'ConsumedCapacity': [
        {
            'CapacityUnits': 120.55,
            'TableName': 'fake-table'
        }
    ],
    'ItemCollectionMetrics': {},
    'UnprocessedItems': {}
};

exports.dynamoDbInput = [
    {
        'taskToken': 'fakeToken1',
        's3_prefix': `fake-prefix/input/filename1.jpg`
    },
    {
        'taskToken': 'fakeToken2',
        's3_prefix': `fake-prefix/input/filename2.jpg`
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
                        's3_prefix': {
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

//Pii job result dataset
exports.eventMessage = {
    jobID: 'fakeJobID'
};

exports.expectedJobResultResponse = [
    {
        response: {
            Entities: [],
            File: 'Sample.txt',
            Line: 23
        },
        taskToken: 'fakeToken'
    },
    {
        response: {
            Entities: [],
            File: 'Sample.txt',
            Line: 24
        },
        taskToken: 'fakeToken'
    }
];

exports.dataRecord = {
    Key: {
        FILE_NAME: {
            S: 'Sample.txt.out'
        },
        JOB_ID: {
            S: 'fakeJobID'
        }
    },
    Item: {
        TASK_TOKEN: {
            S: 'fakeToken'
        }
    }
};

exports.expectedS3getObjectResponse = {
    Body: '{"Entities": [], "File": "Sample.txt", "Line": 23}\n' + '{"Entities": [], "File": "Sample.txt", "Line": 24}'
};

exports.offsetToLineIdMapPii = [
    { 'offset': 0, 'id': 'line1' },
    { 'offset': 31, 'id': 'line2' }
];

exports.errorCaseOffsetToLineIdMapPii = [
    { 'offset': 0, 'id': 'line1' },
    { 'offset': 31, 'id': 'line2' },
    { 'offset': 40, 'dummy': 'line3' }
];

exports.blockDictPii = {
    'page1': {
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
                    'X': 0,
                    'Y': 0
                },
                {
                    'X': 1,
                    'Y': 4.455357895949419e-7
                },
                {
                    'X': 1,
                    'Y': 1
                },
                {
                    'X': 8.267451789834013e-7,
                    'Y': 1
                }
            ]
        },
        'Id': 'page1',
        'Relationships': [
            {
                'Type': 'CHILD',
                'Ids': ['line1', 'line2']
            }
        ]
    },
    'line1': {
        'BlockType': 'LINE',
        'Confidence': 99.41443634033203,
        'Text': 'This is a 2023 test about John',
        'Geometry': {
            'BoundingBox': {
                'Width': 7,
                'Height': 1,
                'Left': 0,
                'Top': 0
            }
        },
        'Id': 'line1',
        'Relationships': [
            {
                'Type': 'CHILD',
                'Ids': ['word1', 'word2', 'word3', 'word4', 'word5', 'word6', 'word7']
            }
        ]
    },
    'line2': {
        'BlockType': 'LINE',
        'Confidence': 98.38265228271484,
        'Text': 'Doe, New York. john doe.',
        'Geometry': {
            'BoundingBox': {
                'Width': 3,
                'Height': 1,
                'Left': 0,
                'Top': 1
            }
        },
        'Id': 'line2',
        'Relationships': [
            {
                'Type': 'CHILD',
                'Ids': ['word8', 'word9', 'word10', 'word11', 'word12']
            }
        ]
    },
    'word1': {
        'BlockType': 'WORD',
        'Confidence': 98.13988494873047,
        'Text': 'This',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 0,
                'Top': 0
            }
        },
        'Id': 'word1'
    },
    'word2': {
        'BlockType': 'WORD',
        'Confidence': 98.78559875488281,
        'Text': 'is',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 1,
                'Top': 0
            }
        },
        'Id': 'word2'
    },
    'word3': {
        'BlockType': 'WORD',
        'Confidence': 99.97274017333984,
        'Text': 'a',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 2,
                'Top': 0
            }
        },
        'Id': 'word3'
    },
    'word4': {
        'BlockType': 'WORD',
        'Confidence': 99.97218322753906,
        'Text': '2023',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 3,
                'Top': 0
            }
        },
        'Id': 'word4'
    },
    'word5': {
        'BlockType': 'WORD',
        'Confidence': 99.65723419189453,
        'Text': 'test',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 4,
                'Top': 0
            }
        },
        'Id': 'word5'
    },
    'word6': {
        'BlockType': 'WORD',
        'Confidence': 99.92205810546875,
        'Text': 'about',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 5,
                'Top': 0
            }
        },
        'Id': 'word6'
    },
    'word7': {
        'BlockType': 'WORD',
        'Confidence': 99.45137786865234,
        'Text': 'John',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 6,
                'Top': 0
            }
        },
        'Id': 'word7'
    },
    'word8': {
        'BlockType': 'WORD',
        'Confidence': 96.13420104980469,
        'Text': 'Doe,',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 0,
                'Top': 1
            }
        },
        'Id': 'word8'
    },
    'word9': {
        'BlockType': 'WORD',
        'Confidence': 99.56139373779297,
        'Text': 'New',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 1,
                'Top': 1
            }
        },
        'Id': 'word9'
    },
    'word10': {
        'BlockType': 'WORD',
        'Confidence': 99.45236206054688,
        'Text': 'York.',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 2,
                'Top': 1
            }
        },
        'Id': 'word10'
    },
    'word11': {
        'BlockType': 'WORD',
        'Confidence': 99.45236206054688,
        'Text': 'john',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 3,
                'Top': 1
            }
        },
        'Id': 'word10'
    },
    'word12': {
        'BlockType': 'WORD',
        'Confidence': 99.45236206054688,
        'Text': 'doe',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 4,
                'Top': 1
            }
        },
        'Id': 'word10'
    }
};

exports.bondingBoxResultPii = {
    'DATE': {
        '2023': {
            '1': [
                {
                    'BoundingBoxes': [
                        {
                            'Height': 1,
                            'Left': 3,
                            'Top': 0,
                            'Width': 1
                        }
                    ],
                    'Score': 0.8919363021850586
                }
            ]
        }
    },
    'LOCATION': {
        'NEW YORK': {
            '1': [
                {
                    'BoundingBoxes': [
                        {
                            'Height': 1,
                            'Left': 1,
                            'Top': 1,
                            'Width': 2
                        }
                    ],
                    'Score': 0.8900869488716125
                }
            ]
        }
    },
    'OTHER': {
        'THIS IS A 2023': {
            '1': [
                {
                    'BoundingBoxes': [
                        {
                            'Height': 1,
                            'Left': 0,
                            'Top': 0,
                            'Width': 4
                        }
                    ],
                    'Score': 0.8900869488716125
                }
            ]
        }
    },
    'PERSON': {
        'JOHN DOE': {
            '1': [
                {
                    'BoundingBoxes': [
                        {
                            'Height': 1,
                            'Left': 6,
                            'Top': 0,
                            'Width': 1
                        },
                        {
                            'Height': 1,
                            'Left': 0,
                            'Top': 1,
                            'Width': 1
                        }
                    ],
                    'Score': 0.8900869488716125
                },
                {
                    'Score': 0.8900869488716125,
                    'BoundingBoxes': [
                        {
                            'Width': 2,
                            'Height': 1,
                            'Left': 3,
                            'Top': 1
                        }
                    ]
                }
            ]
        }
    }
};

exports.offsetToLineIdMapStandard = [
    { offset: 0, id: 'line1' },
    { offset: 31, id: 'line2' },
    { offset: 56, id: 'line3' }
];

exports.errorCaseOffsetToLineIdMapStandard = [
    { offset: 0, id: 'line1' },
    { offset: 31, id: 'line2' },
    { offset: 56, dummy: 'line3' }
];

exports.blockDictStandard = {
    'page1': {
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
                    'X': 0,
                    'Y': 0
                },
                {
                    'X': 1,
                    'Y': 4.455357895949419e-7
                },
                {
                    'X': 1,
                    'Y': 1
                },
                {
                    'X': 8.267451789834013e-7,
                    'Y': 1
                }
            ]
        },
        'Id': 'page1',
        'Relationships': [
            {
                'Type': 'CHILD',
                'Ids': ['line1', 'line2', 'line3']
            }
        ]
    },
    'line1': {
        'BlockType': 'LINE',
        'Confidence': 99.41443634033203,
        'Text': 'This is a 2023 test about John',
        'Geometry': {
            'BoundingBox': {
                'Width': 7,
                'Height': 1,
                'Left': 0,
                'Top': 0
            }
        },
        'Id': 'line1',
        'Relationships': [
            {
                'Type': 'CHILD',
                'Ids': ['word1', 'word2', 'word3', 'word4', 'word5', 'word6', 'word7']
            }
        ]
    },
    'line2': {
        'BlockType': 'LINE',
        'Confidence': 98.38265228271484,
        'Text': 'Doe, New York. john doe.',
        'Geometry': {
            'BoundingBox': {
                'Width': 3,
                'Height': 1,
                'Left': 0,
                'Top': 1
            }
        },
        'Id': 'line2',
        'Relationships': [
            {
                'Type': 'CHILD',
                'Ids': ['word8', 'word9', 'word10', 'word11', 'word12']
            }
        ]
    },
    'line3': {
        'BlockType': 'LINE',
        'Confidence': 98.38265228271484,
        'Text': 'it is it is repeating.',
        'Geometry': {
            'BoundingBox': {
                'Width': 5,
                'Height': 1,
                'Left': 0,
                'Top': 2
            }
        },
        'Id': 'line3',
        'Relationships': [
            {
                'Type': 'CHILD',
                'Ids': ['word13', 'word14', 'word15', 'word16', 'word17']
            }
        ]
    },
    'word1': {
        'BlockType': 'WORD',
        'Confidence': 98.13988494873047,
        'Text': 'This',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 0,
                'Top': 0
            }
        },
        'Id': 'word1'
    },
    'word2': {
        'BlockType': 'WORD',
        'Confidence': 98.78559875488281,
        'Text': 'is',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 1,
                'Top': 0
            }
        },
        'Id': 'word2'
    },
    'word3': {
        'BlockType': 'WORD',
        'Confidence': 99.97274017333984,
        'Text': 'a',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 2,
                'Top': 0
            }
        },
        'Id': 'word3'
    },
    'word4': {
        'BlockType': 'WORD',
        'Confidence': 99.97218322753906,
        'Text': '2023',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 3,
                'Top': 0
            }
        },
        'Id': 'word4'
    },
    'word5': {
        'BlockType': 'WORD',
        'Confidence': 99.65723419189453,
        'Text': 'test',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 4,
                'Top': 0
            }
        },
        'Id': 'word5'
    },
    'word6': {
        'BlockType': 'WORD',
        'Confidence': 99.92205810546875,
        'Text': 'about',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 5,
                'Top': 0
            }
        },
        'Id': 'word6'
    },
    'word7': {
        'BlockType': 'WORD',
        'Confidence': 99.45137786865234,
        'Text': 'John',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 6,
                'Top': 0
            }
        },
        'Id': 'word7'
    },
    'word8': {
        'BlockType': 'WORD',
        'Confidence': 96.13420104980469,
        'Text': 'Doe,',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 0,
                'Top': 1
            }
        },
        'Id': 'word8'
    },
    'word9': {
        'BlockType': 'WORD',
        'Confidence': 99.56139373779297,
        'Text': 'New',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 1,
                'Top': 1
            }
        },
        'Id': 'word9'
    },
    'word10': {
        'BlockType': 'WORD',
        'Confidence': 99.45236206054688,
        'Text': 'York.',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 2,
                'Top': 1
            }
        },
        'Id': 'word10'
    },
    'word11': {
        'BlockType': 'WORD',
        'Confidence': 99.45236206054688,
        'Text': 'john',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 3,
                'Top': 1
            }
        },
        'Id': 'word11'
    },
    'word12': {
        'BlockType': 'WORD',
        'Confidence': 99.45236206054688,
        'Text': 'doe',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 4,
                'Top': 1
            }
        },
        'Id': 'word12'
    },
    'word13': {
        'BlockType': 'WORD',
        'Confidence': 99.45236206054688,
        'Text': 'it',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 0,
                'Top': 2
            }
        },
        'Id': 'word13'
    },
    'word14': {
        'BlockType': 'WORD',
        'Confidence': 99.45236206054688,
        'Text': 'is',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 1,
                'Top': 2
            }
        },
        'Id': 'word14'
    },
    'word15': {
        'BlockType': 'WORD',
        'Confidence': 99.45236206054688,
        'Text': 'it',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 2,
                'Top': 2
            }
        },
        'Id': 'word15'
    },
    'word16': {
        'BlockType': 'WORD',
        'Confidence': 99.45236206054688,
        'Text': 'is',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 3,
                'Top': 2
            }
        },
        'Id': 'word16'
    },
    'word17': {
        'BlockType': 'WORD',
        'Confidence': 99.45236206054688,
        'Text': 'repeating',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 4,
                'Top': 2
            }
        },
        'Id': 'word17'
    }
};

exports.bondingBoxResultStandard = {
    'DATE': {
        '2023': {
            '1': [
                {
                    'Score': 0.8919363021850586,
                    'BoundingBoxes': [
                        {
                            'Width': 1,
                            'Height': 1,
                            'Left': 3,
                            'Top': 0
                        }
                    ]
                }
            ]
        }
    },
    'PERSON': {
        'JOHN DOE': {
            '1': [
                {
                    'Score': 0.8900869488716125,
                    'BoundingBoxes': [
                        {
                            'Width': 1,
                            'Height': 1,
                            'Left': 6,
                            'Top': 0
                        },
                        {
                            'Width': 1,
                            'Height': 1,
                            'Left': 0,
                            'Top': 1
                        }
                    ]
                },
                {
                    'Score': 0.8900869488716125,
                    'BoundingBoxes': [
                        {
                            'Width': 2,
                            'Height': 1,
                            'Left': 3,
                            'Top': 1
                        }
                    ]
                }
            ]
        }
    },
    'LOCATION': {
        'NEW YORK': {
            '1': [
                {
                    'Score': 0.8900869488716125,
                    'BoundingBoxes': [
                        {
                            'Width': 2,
                            'Height': 1,
                            'Left': 1,
                            'Top': 1
                        }
                    ]
                }
            ]
        }
    },
    'OTHER': {
        'IT IS REPEATING': {
            '1': [
                {
                    'BoundingBoxes': [
                        {
                            'Height': 1,
                            'Left': 2,
                            'Top': 2,
                            'Width': 3
                        }
                    ],
                    'Score': 0.8900869488716125
                }
            ]
        },
        'THIS IS A 2023': {
            '1': [
                {
                    'Score': 0.8900869488716125,
                    'BoundingBoxes': [
                        {
                            'Width': 4,
                            'Height': 1,
                            'Left': 0,
                            'Top': 0
                        }
                    ]
                }
            ]
        }
    }
};

exports.offsetToLineIdMapMedical = [
    { 'offset': 0, 'id': 'line1' },
    { 'offset': 31, 'id': 'line2' }
];

exports.errorCaseOffsetToLineIdMapMedical = [
    { 'offset': 0, 'dummy': 'line1' }
];

exports.blockDictMedical = {
    'page1': {
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
                    'X': 0,
                    'Y': 0
                },
                {
                    'X': 1,
                    'Y': 4.455357895949419e-7
                },
                {
                    'X': 1,
                    'Y': 1
                },
                {
                    'X': 8.267451789834013e-7,
                    'Y': 1
                }
            ]
        },
        'Id': 'page1',
        'Relationships': [
            {
                'Type': 'CHILD',
                'Ids': ['line1', 'line2']
            }
        ]
    },
    'line1': {
        'BlockType': 'LINE',
        'Confidence': 99.41443634033203,
        'Text': 'This is a 2023 test about John',
        'Geometry': {
            'BoundingBox': {
                'Width': 7,
                'Height': 1,
                'Left': 0,
                'Top': 0
            }
        },
        'Id': 'line1',
        'Relationships': [
            {
                'Type': 'CHILD',
                'Ids': ['word1', 'word2', 'word3', 'word4', 'word5', 'word6', 'word7']
            }
        ]
    },
    'line2': {
        'BlockType': 'LINE',
        'Confidence': 98.38265228271484,
        'Text': 'Doe, New York. john doe.',
        'Geometry': {
            'BoundingBox': {
                'Width': 3,
                'Height': 1,
                'Left': 0,
                'Top': 1
            }
        },
        'Id': 'line2',
        'Relationships': [
            {
                'Type': 'CHILD',
                'Ids': ['word8', 'word9', 'word10', 'word11', 'word12']
            }
        ]
    },
    'word1': {
        'BlockType': 'WORD',
        'Confidence': 98.13988494873047,
        'Text': 'This',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 0,
                'Top': 0
            }
        },
        'Id': 'word1'
    },
    'word2': {
        'BlockType': 'WORD',
        'Confidence': 98.78559875488281,
        'Text': 'is',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 1,
                'Top': 0
            }
        },
        'Id': 'word2'
    },
    'word3': {
        'BlockType': 'WORD',
        'Confidence': 99.97274017333984,
        'Text': 'a',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 2,
                'Top': 0
            }
        },
        'Id': 'word3'
    },
    'word4': {
        'BlockType': 'WORD',
        'Confidence': 99.97218322753906,
        'Text': '2023',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 3,
                'Top': 0
            }
        },
        'Id': 'word4'
    },
    'word5': {
        'BlockType': 'WORD',
        'Confidence': 99.65723419189453,
        'Text': 'test',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 4,
                'Top': 0
            }
        },
        'Id': 'word5'
    },
    'word6': {
        'BlockType': 'WORD',
        'Confidence': 99.92205810546875,
        'Text': 'about',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 5,
                'Top': 0
            }
        },
        'Id': 'word6'
    },
    'word7': {
        'BlockType': 'WORD',
        'Confidence': 99.45137786865234,
        'Text': 'John',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 6,
                'Top': 0
            }
        },
        'Id': 'word7'
    },
    'word8': {
        'BlockType': 'WORD',
        'Confidence': 96.13420104980469,
        'Text': 'Doe,',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 0,
                'Top': 1
            }
        },
        'Id': 'word8'
    },
    'word9': {
        'BlockType': 'WORD',
        'Confidence': 99.56139373779297,
        'Text': 'New',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 1,
                'Top': 1
            }
        },
        'Id': 'word9'
    },
    'word10': {
        'BlockType': 'WORD',
        'Confidence': 99.45236206054688,
        'Text': 'York.',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 2,
                'Top': 1
            }
        },
        'Id': 'word10'
    },
    'word11': {
        'BlockType': 'WORD',
        'Confidence': 99.45236206054688,
        'Text': 'john',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 3,
                'Top': 1
            }
        },
        'Id': 'word10'
    },
    'word12': {
        'BlockType': 'WORD',
        'Confidence': 99.45236206054688,
        'Text': 'doe',
        'TextType': 'PRINTED',
        'Geometry': {
            'BoundingBox': {
                'Width': 1,
                'Height': 1,
                'Left': 4,
                'Top': 1
            }
        },
        'Id': 'word10'
    }
};

exports.bondingBoxResultMedical = {
    'MEDICATION': {
        '2023': {
            '1': [
                {
                    'Score': 0.8919363021850586,
                    'BoundingBoxes': [
                        {
                            'Width': 1,
                            'Height': 1,
                            'Left': 3,
                            'Top': 0
                        }
                    ],
                    'Type': 'DX_NAME'
                }
            ]
        }
    }
};
