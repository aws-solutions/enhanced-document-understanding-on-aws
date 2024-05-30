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
import renderer from 'react-test-renderer';
import { cleanup } from '@testing-library/react';
import { documentLines, kvPairs, tables } from '../../../__test__/test_data';
import { TEXTRACT_RAW_TEXT } from '../../../utils/constants';
import TextractTab from '../../TextractTab';

afterEach(cleanup);

const props = {
    selectedDocumentFileType: 'pdf',
    selectedDocumentUrl: 'fake-url',
    documentLines,
    kvPairs,
    tables,
    documentPageCount: 2,
    currentPageNumber: 1,
    switchPage: jest.fn(),
    textractOutputType: TEXTRACT_RAW_TEXT,
    currentStatus: 'success' as StatusIndicatorProps.Type,
    retrieveSignedUrl: jest.fn()
};

jest.mock('@cloudscape-design/components', () => {
    const Components = jest.genMockFromModule('@cloudscape-design/components') as any;
    for (const componentName of Object.keys(Components)) {
        Components[componentName] = componentName;
    }
    return Components;
});

jest.mock('react-pdf', () => ({
    pdfjs: { GlobalWorkerOptions: { workerSrc: 'abc' } },
    Document: ({ onLoadSuccess = (pdf = { numPages: 4 }) => pdf.numPages }) => {
        return <div>{onLoadSuccess({ numPages: 4 })}</div>;
    },
    Outline: null,
    Page: () => <div>def</div>
}));

test('Textract tab snapshot test', async () => {
    const tree = renderer.create(<TextractTab {...props} />).toJSON();
    expect(tree).toMatchSnapshot();
});
