// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

exports.documentLines = [
    { text: 'fake text 1', pageNumber: 1, id: '1', boundingBox: { Width: 10, Height: 20, Left: 30, Top: 40 } },
    { text: 'fake text 2', pageNumber: 1, id: '2', boundingBox: { Width: 50, Height: 60, Left: 70, Top: 80 } }
];

exports.kvPairs = [
    {
        id: '1',
        key: 'first name',
        value: 'fake-name',
        pageNumber: 1,
        keyBoundingBox: { Width: 10, Height: 20, Left: 30, Top: 40 },
        valueBoundingBox: { Width: 100, Height: 200, Left: 300, Top: 400 }
    },
    {
        id: '2',
        key: 'last name',
        value: 'fake-last-name',
        pageNumber: 2,
        keyBoundingBox: { Width: 10, Height: 20, Left: 30, Top: 40 },
        valueBoundingBox: { Width: 100, Height: 200, Left: 300, Top: 400 }
    }
];

exports.tables = [
    {
        pageNumber: 1,
        table: {
            BlockType: 'TABLE',
            Confidence: 99.95875549316406,
            Id: 'fake-id1',
            Page: 1,
            Geometry: {
                BoundingBox: { Width: 10, Height: 20, Left: 30, Top: 40 },
                Polygon: [
                    {
                        X: 0.08,
                        Y: 0.72
                    },
                    {
                        X: 0.33,
                        Y: 0.72
                    },
                    {
                        X: 0.33,
                        Y: 0.75
                    },
                    {
                        X: 0.09,
                        Y: 0.75
                    }
                ]
            }
        },
        rows: [
            [
                {
                    ColumnIndex: 1,
                    ColumnSpan: 1,
                    RowIndex: 1,
                    RowSpan: 1,
                    content: 'fake-content 1',
                    Geometry: {
                        BoundingBox: { Width: 10, Height: 20, Left: 30, Top: 40 },
                        Polygon: [
                            {
                                X: 0.08,
                                Y: 0.72
                            },
                            {
                                X: 0.33,
                                Y: 0.72
                            },
                            {
                                X: 0.33,
                                Y: 0.75
                            },
                            {
                                X: 0.09,
                                Y: 0.75
                            }
                        ]
                    }
                }
            ],
            [
                {
                    ColumnIndex: 1,
                    ColumnSpan: 1,
                    RowIndex: 1,
                    RowSpan: 1,
                    content: 'fake-content 1',
                    Geometry: {
                        BoundingBox: { Width: 10, Height: 20, Left: 30, Top: 40 },
                        Polygon: [
                            {
                                X: 0.08,
                                Y: 0.72
                            },
                            {
                                X: 0.33,
                                Y: 0.72
                            },
                            {
                                X: 0.33,
                                Y: 0.75
                            },
                            {
                                X: 0.09,
                                Y: 0.75
                            }
                        ]
                    }
                }
            ]
        ]
    },
    {
        pageNumber: 2,
        table: {
            BlockType: 'TABLE',
            Confidence: 99.95875549316406,
            Id: 'fake-id2',
            Page: 1,
            Geometry: {
                BoundingBox: { Width: 10, Height: 20, Left: 30, Top: 40 },
                Polygon: [
                    {
                        X: 0.08,
                        Y: 0.72
                    },
                    {
                        X: 0.33,
                        Y: 0.72
                    },
                    {
                        X: 0.33,
                        Y: 0.75
                    },
                    {
                        X: 0.09,
                        Y: 0.75
                    }
                ]
            }
        },
        rows: [
            [
                {
                    ColumnIndex: 1,
                    ColumnSpan: 1,
                    RowIndex: 1,
                    RowSpan: 1,
                    content: 'fake-content 2',
                    Geometry: {
                        BoundingBox: { Width: 10, Height: 20, Left: 30, Top: 40 },
                        Polygon: [
                            {
                                X: 0.08,
                                Y: 0.72
                            },
                            {
                                X: 0.33,
                                Y: 0.72
                            },
                            {
                                X: 0.33,
                                Y: 0.75
                            },
                            {
                                X: 0.09,
                                Y: 0.75
                            }
                        ]
                    }
                }
            ]
        ]
    }
];

exports.marks1 = [
    {
        'Width': 0.325,
        'Height': 0.008,
        'Left': 0.029,
        'Top': 0.022,
        'id': 'fake1'
    },
    {
        'Width': 0.10540947318077087,
        'Height': 0.008869326673448086,
        'Left': 0.863825798034668,
        'Top': 0.022963160648941994,
        'id': 'fake2'
    },
    {
        'Width': 0.1868477165699005,
        'Height': 0.015684476122260094,
        'Left': 0.10326790809631348,
        'Top': 0.05648856982588768,
        'id': 'fake3'
    },
    {
        'Width': 0.07980723679065704,
        'Height': 0.015479239635169506,
        'Left': 0.34772762656211853,
        'Top': 0.05710635334253311,
        'id': 'fake4'
    },
    {
        'Width': 0.052197907119989395,
        'Height': 0.012315374799072742,
        'Left': 0.5969378352165222,
        'Top': 0.05689603462815285,
        'id': 'fake5'
    },
    {
        'Width': 0.12195442616939545,
        'Height': 0.01235085166990757,
        'Left': 0.7164916396141052,
        'Top': 0.05643893778324127,
        'id': 'fake6'
    }
];

exports.entities = {
    'DATE': {
        '10/23/20, 3:28 PM': {
            '1': [
                {
                    'Score': 0.8919363021850586,
                    'BoundingBoxes': [
                        {
                            'Width': 0.10552194342017174,
                            'Height': 0.008878546766936779,
                            'Left': 0.86385178565979,
                            'Top': 0.022900670766830444
                        }
                    ]
                }
            ],
            '2': [
                {
                    'Score': 0.9485940337181091,
                    'BoundingBoxes': [
                        {
                            'Width': 0.10547907836735249,
                            'Height': 0.008942456915974617,
                            'Left': 0.8642183542251587,
                            'Top': 0.02289346233010292
                        }
                    ]
                }
            ]
        }
    },
    'OTHER': {
        'type 2': {
            '1': [
                {
                    'Score': 0.8900869488716125,
                    'BoundingBoxes': [
                        {
                            'Width': 0.05389057006686926,
                            'Height': 0.013889942318201065,
                            'Left': 0.3480696678161621,
                            'Top': 0.3248501121997833
                        }
                    ]
                },
                {
                    'Score': 0.9038220047950745,
                    'BoundingBoxes': [
                        {
                            'Width': 0.053887657821178436,
                            'Height': 0.014080277644097805,
                            'Left': 0.4535020887851715,
                            'Top': 0.3502127230167389
                        }
                    ]
                }
            ],
            '2': [
                {
                    'Score': 0.7960730195045471,
                    'BoundingBoxes': [
                        {
                            'Width': 0.05389551538974047,
                            'Height': 0.014393876306712627,
                            'Left': 0.2511792778968811,
                            'Top': 0.10318874567747116
                        }
                    ]
                },
                {
                    'Score': 0.8712689876556396,
                    'BoundingBoxes': [
                        {
                            'Width': 0.05399103555828333,
                            'Height': 0.014388022013008595,
                            'Left': 0.5558194518089294,
                            'Top': 0.12837538123130798
                        }
                    ]
                }
            ]
        },
        'Type 1': {
            '1': [
                {
                    'Score': 0.7336651086807251,
                    'BoundingBoxes': [
                        {
                            'Width': 0.0822468101978302,
                            'Height': 0.020937375724315643,
                            'Left': 0.08632709830999374,
                            'Top': 0.6895765066146851
                        }
                    ]
                }
            ]
        },
        'type': {
            '1': [
                {
                    'Score': 0.5598312616348267,
                    'BoundingBoxes': [
                        {
                            'Width': 0.03872048854827881,
                            'Height': 0.014065195806324482,
                            'Left': 0.1903296411037445,
                            'Top': 0.7322471141815186
                        }
                    ]
                }
            ]
        },
        'https://www.niddk.nih.gov/health-information/diabetes/overview/insulin-medicines-treatments': {
            '1': [
                {
                    'Score': 0.9924692511558533,
                    'BoundingBoxes': [
                        {
                            'Width': 0.5339186787605286,
                            'Height': 0.009421877562999725,
                            'Left': 0.035508979111909866,
                            'Top': 0.9383252263069153
                        }
                    ]
                }
            ],
            '2': [
                {
                    'Score': 0.9908434152603149,
                    'BoundingBoxes': [
                        {
                            'Width': 0.5440027117729187,
                            'Height': 0.009870187379419804,
                            'Left': 0.03043067455291748,
                            'Top': 0.9381237626075745
                        }
                    ]
                }
            ]
        },
        'Type': {
            '2': [
                {
                    'Score': 0.5639591813087463,
                    'BoundingBoxes': [
                        {
                            'Width': 0.06242794170975685,
                            'Height': 0.020820338279008865,
                            'Left': 0.08637390285730362,
                            'Top': 0.06082107126712799
                        }
                    ]
                }
            ]
        }
    },
    'ORGANIZATION': {
        'National Institute of Diabetes and Digestive and Kidney Diseases': {
            '1': [
                {
                    'Score': 0.9994651675224304,
                    'BoundingBoxes': [
                        {
                            'Width': 0.3759935013949871,
                            'Height': 0.010149835608899593,
                            'Left': 0.08180448412895203,
                            'Top': 0.8846619129180908
                        }
                    ]
                }
            ],
            '2': [
                {
                    'Score': 0.9993358850479126,
                    'BoundingBoxes': [
                        {
                            'Width': 0.37597523257136345,
                            'Height': 0.010238399729132652,
                            'Left': 0.08183760941028595,
                            'Top': 0.9604963660240173
                        }
                    ]
                }
            ]
        },
        'NIDDK': {
            '1': [
                {
                    'Score': 0.9910317659378052,
                    'BoundingBoxes': [
                        {
                            'Width': 0.052133601158857346,
                            'Height': 0.009927762672305107,
                            'Left': 0.46177950501441956,
                            'Top': 0.8847051858901978
                        }
                    ]
                },
                {
                    'Score': 0.9037812948226929,
                    'BoundingBoxes': [
                        {
                            'Width': 0.043409429490566254,
                            'Height': 0.008275030180811882,
                            'Left': 0.36147740483283997,
                            'Top': 0.8983390927314758
                        }
                    ]
                }
            ],
            '2': [
                {
                    'Score': 0.9871048927307129,
                    'BoundingBoxes': [
                        {
                            'Width': 0.05230835825204849,
                            'Height': 0.009995872154831886,
                            'Left': 0.46185776591300964,
                            'Top': 0.9606045484542847
                        }
                    ]
                },
                {
                    'Score': 0.8874284029006958,
                    'BoundingBoxes': [
                        {
                            'Width': 0.043524131178855896,
                            'Height': 0.008231394924223423,
                            'Left': 0.3616192042827606,
                            'Top': 0.9741417169570923
                        }
                    ]
                }
            ]
        },
        'U.S. Government': {
            '1': [
                {
                    'Score': 0.9949480891227722,
                    'BoundingBoxes': [
                        {
                            'Width': 0.10356565564870834,
                            'Height': 0.0094399843364954,
                            'Left': 0.1733912229537964,
                            'Top': 0.8980084657669067
                        }
                    ]
                }
            ],
            '2': [
                {
                    'Score': 0.9736790060997009,
                    'BoundingBoxes': [
                        {
                            'Width': 0.10373178869485855,
                            'Height': 0.009321463294327259,
                            'Left': 0.17332343757152557,
                            'Top': 0.9741197228431702
                        }
                    ]
                }
            ]
        },
        'HHS': {
            '1': [
                {
                    'Score': 0.9977951049804688,
                    'BoundingBoxes': [
                        {
                            'Width': 0.030303074046969414,
                            'Height': 0.00947714876383543,
                            'Left': 0.28164926171302795,
                            'Top': 0.8982468843460083
                        }
                    ]
                }
            ],
            '2': [
                {
                    'Score': 0.9805117249488831,
                    'BoundingBoxes': [
                        {
                            'Width': 0.03015240840613842,
                            'Height': 0.009173440746963024,
                            'Left': 0.2816435396671295,
                            'Top': 0.97417151927948
                        }
                    ]
                }
            ]
        },
        'NIH': {
            '1': [
                {
                    'Score': 0.9990106821060181,
                    'BoundingBoxes': [
                        {
                            'Width': 0.025267114862799644,
                            'Height': 0.009578598663210869,
                            'Left': 0.31637564301490784,
                            'Top': 0.8982349634170532
                        }
                    ]
                }
            ],
            '2': [
                {
                    'Score': 0.9952621459960938,
                    'BoundingBoxes': [
                        {
                            'Width': 0.025053730234503746,
                            'Height': 0.009317233227193356,
                            'Left': 0.3164917230606079,
                            'Top': 0.9741648435592651
                        }
                    ]
                }
            ]
        }
    },
    'QUANTITY': {
        '2': {
            '2': [
                {
                    'Score': 0.9887447357177734,
                    'BoundingBoxes': [
                        {
                            'Width': 0.01039495412260294,
                            'Height': 0.009906122460961342,
                            'Left': 0.7171330451965332,
                            'Top': 0.8136228322982788
                        }
                    ]
                },
                {
                    'Score': 0.9595391750335693,
                    'BoundingBoxes': [
                        {
                            'Width': 0.0101395258679986,
                            'Height': 0.009567677974700928,
                            'Left': 0.5977944731712341,
                            'Top': 0.8502328395843506
                        }
                    ]
                },
                {
                    'Score': 0.9844021797180176,
                    'BoundingBoxes': [
                        {
                            'Width': 0.01052072923630476,
                            'Height': 0.009947454556822777,
                            'Left': 0.34798651933670044,
                            'Top': 0.8956213593482971
                        }
                    ]
                }
            ]
        },
        '3': {
            '2': [
                {
                    'Score': 0.941055178642273,
                    'BoundingBoxes': [
                        {
                            'Width': 0.009232582524418831,
                            'Height': 0.012031951919198036,
                            'Left': 0.6359239816665649,
                            'Top': 0.8500364422798157
                        }
                    ]
                },
                {
                    'Score': 0.9909900426864624,
                    'BoundingBoxes': [
                        {
                            'Width': 0.00931690912693739,
                            'Height': 0.012125308625400066,
                            'Left': 0.7171798944473267,
                            'Top': 0.859142541885376
                        }
                    ]
                }
            ]
        },
        '4': {
            '2': [
                {
                    'Score': 0.959689199924469,
                    'BoundingBoxes': [
                        {
                            'Width': 0.011025403626263142,
                            'Height': 0.012411089614033699,
                            'Left': 0.5974767804145813,
                            'Top': 0.8951147794723511
                        }
                    ]
                }
            ]
        },
        '10': {
            '1': [
                {
                    'Score': 0.8660756349563599,
                    'BoundingBoxes': [
                        {
                            'Width': 0.01304927933961153,
                            'Height': 0.007650964427739382,
                            'Left': 0.9567983746528625,
                            'Top': 0.9384483098983765
                        }
                    ]
                }
            ],
            '2': [
                {
                    'Score': 0.6214289665222168,
                    'BoundingBoxes': [
                        {
                            'Width': 0.012656530365347862,
                            'Height': 0.0074538555927574635,
                            'Left': 0.956968367099762,
                            'Top': 0.9384286403656006
                        }
                    ]
                }
            ]
        },
        '12': {
            '2': [
                {
                    'Score': 0.9487652778625488,
                    'BoundingBoxes': [
                        {
                            'Width': 0.01847921870648861,
                            'Height': 0.00958269089460373,
                            'Left': 0.6363021731376648,
                            'Top': 0.8955987095832825
                        }
                    ]
                }
            ]
        },
        'Page 1': {
            '1': [
                {
                    'Score': 0.8226835131645203,
                    'BoundingBoxes': [
                        {
                            'Width': 0.03649726137518883,
                            'Height': 0.009489667601883411,
                            'Left': 0.9008000493049622,
                            'Top': 0.9383533000946045
                        }
                    ]
                }
            ]
        },
        'more than one diabetes medicine': {
            '2': [
                {
                    'Score': 0.9063174724578857,
                    'BoundingBoxes': [
                        {
                            'Width': 0.2983839511871338,
                            'Height': 0.012482712045311928,
                            'Left': 0.5868698954582214,
                            'Top': 0.17744937539100647
                        }
                    ]
                }
            ]
        },
        'first': {
            '2': [
                {
                    'Score': 0.9870350956916809,
                    'BoundingBoxes': [
                        {
                            'Width': 0.038332730531692505,
                            'Height': 0.012655126862227917,
                            'Left': 0.48506584763526917,
                            'Top': 0.30861425399780273
                        }
                    ]
                }
            ]
        },
        'Each type': {
            '2': [
                {
                    'Score': 0.9794559478759766,
                    'BoundingBoxes': [
                        {
                            'Width': 0.08664331212639809,
                            'Height': 0.015551361255347729,
                            'Left': 0.42323219776153564,
                            'Top': 0.6119845509529114
                        }
                    ]
                }
            ]
        },
        'About 15 minutes': {
            '2': [
                {
                    'Score': 0.9184675216674805,
                    'BoundingBoxes': [
                        {
                            'Width': 0.15629703551530838,
                            'Height': 0.014401831664144993,
                            'Left': 0.347101628780365,
                            'Top': 0.8023276925086975
                        }
                    ]
                }
            ]
        },
        '1 hour': {
            '2': [
                {
                    'Score': 0.9978331327438354,
                    'BoundingBoxes': [
                        {
                            'Width': 0.05558495223522186,
                            'Height': 0.012362648732960224,
                            'Left': 0.5974429845809937,
                            'Top': 0.811211109161377
                        }
                    ]
                }
            ]
        },
        '4 hours': {
            '2': [
                {
                    'Score': 0.9918981790542603,
                    'BoundingBoxes': [
                        {
                            'Width': 0.06802167743444443,
                            'Height': 0.014383045956492424,
                            'Left': 0.7551165223121643,
                            'Top': 0.8114259243011475
                        }
                    ]
                },
                {
                    'Score': 0.9674264788627625,
                    'BoundingBoxes': [
                        {
                            'Width': 0.06794086843729019,
                            'Height': 0.014486236497759819,
                            'Left': 0.3862510621547699,
                            'Top': 0.8931238651275635
                        }
                    ]
                }
            ]
        },
        '30 minutes': {
            '2': [
                {
                    'Score': 0.9913085699081421,
                    'BoundingBoxes': [
                        {
                            'Width': 0.10021734982728958,
                            'Height': 0.014619669876992702,
                            'Left': 0.41469624638557434,
                            'Top': 0.8478578925132751
                        }
                    ]
                }
            ]
        },
        '6 hours': {
            '2': [
                {
                    'Score': 0.9830698370933533,
                    'BoundingBoxes': [
                        {
                            'Width': 0.06742136552929878,
                            'Height': 0.012215577065944672,
                            'Left': 0.7551319599151611,
                            'Top': 0.8568243384361267
                        }
                    ]
                }
            ]
        },
        'Page 2': {
            '2': [
                {
                    'Score': 0.9585963487625122,
                    'BoundingBoxes': [
                        {
                            'Width': 0.03859133180230856,
                            'Height': 0.009177501313388348,
                            'Left': 0.8991856575012207,
                            'Top': 0.9385843276977539
                        }
                    ]
                }
            ]
        }
    }
};

exports.allSelectedEntities = {
    'entity-standard': [
        ['DATE'],
        ['DATE', '10/23/20, 3:28 PM'],
        ['DATE', '10/23/20, 3:28 PM', '1'],
        ['DATE', '10/23/20, 3:28 PM', '2'],
        ['OTHER'],
        ['OTHER', 'type 2'],
        ['OTHER', 'type 2', '1'],
        ['OTHER', 'type 2', '2'],
        ['OTHER', 'Type 1'],
        ['OTHER', 'Type 1', '1'],
        ['OTHER', 'type'],
        ['OTHER', 'type', '1'],
        ['OTHER', 'https://www.niddk.nih.gov/health-information/diabetes/overview/insulin-medicines-treatments'],
        ['OTHER', 'https://www.niddk.nih.gov/health-information/diabetes/overview/insulin-medicines-treatments', '1'],
        ['OTHER', 'https://www.niddk.nih.gov/health-information/diabetes/overview/insulin-medicines-treatments', '2'],
        ['OTHER', 'Type'],
        ['OTHER', 'Type', '2'],
        ['ORGANIZATION'],
        ['ORGANIZATION', 'National Institute of Diabetes and Digestive and Kidney Diseases'],
        ['ORGANIZATION', 'National Institute of Diabetes and Digestive and Kidney Diseases', '1'],
        ['ORGANIZATION', 'National Institute of Diabetes and Digestive and Kidney Diseases', '2'],
        ['ORGANIZATION', 'NIDDK'],
        ['ORGANIZATION', 'NIDDK', '1'],
        ['ORGANIZATION', 'NIDDK', '2'],
        ['ORGANIZATION', 'U.S. Government'],
        ['ORGANIZATION', 'U.S. Government', '1'],
        ['ORGANIZATION', 'U.S. Government', '2'],
        ['ORGANIZATION', 'HHS'],
        ['ORGANIZATION', 'HHS', '1'],
        ['ORGANIZATION', 'HHS', '2'],
        ['ORGANIZATION', 'NIH'],
        ['ORGANIZATION', 'NIH', '1'],
        ['ORGANIZATION', 'NIH', '2'],
        ['QUANTITY'],
        ['QUANTITY', '2'],
        ['QUANTITY', '2', '2'],
        ['QUANTITY', '3'],
        ['QUANTITY', '3', '2'],
        ['QUANTITY', '4'],
        ['QUANTITY', '4', '2'],
        ['QUANTITY', '10'],
        ['QUANTITY', '10', '1'],
        ['QUANTITY', '10', '2'],
        ['QUANTITY', '12'],
        ['QUANTITY', '12', '2'],
        ['QUANTITY', 'Page 1'],
        ['QUANTITY', 'Page 1', '1'],
        ['QUANTITY', 'more than one diabetes medicine'],
        ['QUANTITY', 'more than one diabetes medicine', '2'],
        ['QUANTITY', 'first'],
        ['QUANTITY', 'first', '2'],
        ['QUANTITY', 'Each type'],
        ['QUANTITY', 'Each type', '2'],
        ['QUANTITY', 'About 15 minutes'],
        ['QUANTITY', 'About 15 minutes', '2'],
        ['QUANTITY', '1 hour'],
        ['QUANTITY', '1 hour', '2'],
        ['QUANTITY', '4 hours'],
        ['QUANTITY', '4 hours', '2'],
        ['QUANTITY', '30 minutes'],
        ['QUANTITY', '30 minutes', '2'],
        ['QUANTITY', '6 hours'],
        ['QUANTITY', '6 hours', '2'],
        ['QUANTITY', 'Page 2'],
        ['QUANTITY', 'Page 2', '2']
    ]
};

exports.entitiesToRedact = {
    'entities': {
        'entity-standard': {
            'DATE': {
                '10/23/20, 3:28 PM': [1, 2]
            },
            'OTHER': {
                'type 2': [2]
            },
            'ORGANIZATION': {
                'NIDDK': [1, 2]
            }
        }
    }
};

exports.allSelectedEntities2 = {
    'entity-medical': [],
    'entity-pii': [],
    'entity-standard': [
        ['DATE'],
        ['DATE', '10/23/20, 3:28 PM'],
        ['DATE', '10/23/20, 3:28 PM', '1'],
        ['DATE', '10/23/20, 3:28 PM', '2'],
        ['OTHER'],
        ['OTHER', 'type 2'],
        ['OTHER', 'type 2', '1'],
        ['OTHER', 'type 2', '2'],
        ['OTHER', 'Type 1'],
        ['OTHER', 'Type 1', '1'],
        ['OTHER', 'type'],
        ['OTHER', 'type', '1'],
        ['OTHER', 'https://www.niddk.nih.gov/health-information/diabetes/overview/insulin-medicines-treatments'],
        ['OTHER', 'https://www.niddk.nih.gov/health-information/diabetes/overview/insulin-medicines-treatments', '1'],
        ['OTHER', 'https://www.niddk.nih.gov/health-information/diabetes/overview/insulin-medicines-treatments', '2'],
        ['OTHER', 'Type'],
        ['OTHER', 'Type', '2'],
        ['ORGANIZATION'],
        ['ORGANIZATION', 'National Institute of Diabetes and Digestive and Kidney Diseases'],
        ['ORGANIZATION', 'National Institute of Diabetes and Digestive and Kidney Diseases', '1'],
        ['ORGANIZATION', 'National Institute of Diabetes and Digestive and Kidney Diseases', '2'],
        ['ORGANIZATION', 'NIDDK'],
        ['ORGANIZATION', 'NIDDK', '1'],
        ['ORGANIZATION', 'NIDDK', '2'],
        ['ORGANIZATION', 'U.S. Government'],
        ['ORGANIZATION', 'U.S. Government', '1'],
        ['ORGANIZATION', 'U.S. Government', '2'],
        ['ORGANIZATION', 'HHS'],
        ['ORGANIZATION', 'HHS', '1'],
        ['ORGANIZATION', 'HHS', '2'],
        ['ORGANIZATION', 'NIH'],
        ['ORGANIZATION', 'NIH', '1'],
        ['ORGANIZATION', 'NIH', '2'],
        ['QUANTITY'],
        ['QUANTITY', '2'],
        ['QUANTITY', '2', '2'],
        ['QUANTITY', '3'],
        ['QUANTITY', '3', '2'],
        ['QUANTITY', '4'],
        ['QUANTITY', '4', '2'],
        ['QUANTITY', '10'],
        ['QUANTITY', '10', '1'],
        ['QUANTITY', '10', '2'],
        ['QUANTITY', '12'],
        ['QUANTITY', '12', '2'],
        ['QUANTITY', 'Page 1'],
        ['QUANTITY', 'Page 1', '1'],
        ['QUANTITY', 'more than one diabetes medicine'],
        ['QUANTITY', 'more than one diabetes medicine', '2'],
        ['QUANTITY', 'first'],
        ['QUANTITY', 'first', '2'],
        ['QUANTITY', 'Each type'],
        ['QUANTITY', 'Each type', '2'],
        ['QUANTITY', 'About 15 minutes'],
        ['QUANTITY', 'About 15 minutes', '2'],
        ['QUANTITY', '1 hour'],
        ['QUANTITY', '1 hour', '2'],
        ['QUANTITY', '4 hours'],
        ['QUANTITY', '4 hours', '2'],
        ['QUANTITY', '30 minutes'],
        ['QUANTITY', '30 minutes', '2'],
        ['QUANTITY', '6 hours'],
        ['QUANTITY', '6 hours', '2'],
        ['QUANTITY', 'Page 2'],
        ['QUANTITY', 'Page 2', '2']
    ]
};
