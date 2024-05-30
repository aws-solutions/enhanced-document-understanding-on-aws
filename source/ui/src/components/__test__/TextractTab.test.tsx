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
 *********************************************************************************************************************/

import { StatusIndicatorProps } from '@cloudscape-design/components';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { API, Auth } from 'aws-amplify';
import { TEXTRACT_KEY_VALUE_PAIRS, TEXTRACT_RAW_TEXT, TEXTRACT_TABLES } from '../../utils/constants';
import TextractTab from '../TextractTab';

type TextractTabProps = {};

const mockSetSelectedEntities = jest.fn();
const mockSwitchPage = jest.fn();
const textractPropsLoading = {
    selectedDocumentFileType: 'pdf',
    selectedDocumentUrl: 'fake-url',
    documentLines: [],
    kvPairs: [],
    tables: [],
    documentPageCount: 1,
    currentPageNumber: 2,
    switchPage: mockSwitchPage,
    textractOutputType: TEXTRACT_RAW_TEXT,
    currentStatus: 'loading' as StatusIndicatorProps.Type,
    retrieveSignedUrl: jest.fn()
};

const textractPropsError = {
    selectedDocumentFileType: 'pdf',
    selectedDocumentUrl: 'fake-url',
    documentLines: [],
    kvPairs: [],
    tables: [],
    documentPageCount: 0,
    currentPageNumber: 0,
    switchPage: mockSwitchPage,
    textractOutputType: TEXTRACT_RAW_TEXT,
    currentStatus: 'error' as StatusIndicatorProps.Type,
    retrieveSignedUrl: jest.fn()
};

jest.mock('react-pdf', () => ({
    pdfjs: { GlobalWorkerOptions: { workerSrc: 'abc' } },
    Document: ({ onLoadSuccess = (pdf = { numPages: 4 }) => pdf.numPages }) => {
        return <div>{onLoadSuccess({ numPages: 4 })}</div>;
    },
    Outline: null,
    Page: () => <div>def</div>
}));

describe('Rendering statuses in the TextractTab', () => {
    beforeEach(() => {
        const mockAPI = {
            get: jest.fn(),
            post: jest.fn()
        };
        jest.mock('@aws-amplify/api');
        API.get = mockAPI.get;
        API.post = mockAPI.post;

        mockAPI.get.mockReset();
        mockAPI.post.mockReset();
        Auth.currentAuthenticatedUser = jest.fn().mockImplementation(() => {
            return {
                getSignInUserSession: jest.fn().mockImplementation(() => {
                    return {
                        getIdToken: jest.fn().mockImplementation(() => {
                            return {
                                getJwtToken: jest.fn().mockImplementation(() => {
                                    return 'fake-jwt-token';
                                })
                            };
                        })
                    };
                })
            };
        });
    });

    test('Renders loading message when status is loading: RAW_TEXT', async () => {
        render(<TextractTab {...textractPropsLoading} />);
        expect(await screen.findByTestId('textract-raw-text')).toHaveTextContent('Loading');
    });

    test('Renders error message when status is error: RAW_TEXT', async () => {
        render(<TextractTab {...textractPropsError} />);
        expect(await screen.findByTestId('textract-raw-text')).toHaveTextContent(
            'An error occurred loading the Textract output.'
        );
    });

    test('Renders loading message when status is loading: TEXTRACT_KEY_VALUE_PAIRS', async () => {
        textractPropsLoading.textractOutputType = TEXTRACT_KEY_VALUE_PAIRS;
        render(<TextractTab {...textractPropsLoading} />);
        expect(await screen.findByTestId('textract-raw-text')).toHaveTextContent('Loading');
    });

    test('Renders error message when status is error: TEXTRACT_KEY_VALUE_PAIRS', async () => {
        textractPropsError.textractOutputType = TEXTRACT_KEY_VALUE_PAIRS;
        render(<TextractTab {...textractPropsError} />);
        expect(await screen.findByTestId('textract-raw-text')).toHaveTextContent(
            'An error occurred loading the Textract output.'
        );
    });

    test('Renders loading message when status is loading: TEXTRACT_TABLES', async () => {
        textractPropsLoading.textractOutputType = TEXTRACT_TABLES;
        render(<TextractTab {...textractPropsLoading} />);
        expect(await screen.findByTestId('textract-raw-text')).toHaveTextContent('Loading');
    });

    test('Renders error message when status is error: TEXTRACT_TABLES', async () => {
        textractPropsError.textractOutputType = TEXTRACT_TABLES;
        render(<TextractTab {...textractPropsError} />);
        expect(await screen.findByTestId('textract-raw-text')).toHaveTextContent(
            'An error occurred loading the Textract output.'
        );
    });
});
