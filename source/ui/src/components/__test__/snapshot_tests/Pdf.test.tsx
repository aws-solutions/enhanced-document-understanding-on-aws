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

import renderer from 'react-test-renderer';
import '@testing-library/jest-dom';
import PDF from '../../Pdf/Pdf';
import { marks1 } from '../../../__test__/test_data';

const pdfPropsPage1 = {
    pdfUrl: 'fake-url',
    currentPageNumber: 1,
    switchPage: jest.fn(),
    marks: marks1,
    retrieveSignedUrl: jest.fn()
};

pdfPropsPage1.switchPage = jest.fn().mockImplementation((newPage) => {
    pdfPropsPage1.currentPageNumber = newPage;
});

jest.mock('react-pdf', () => ({
    pdfjs: { GlobalWorkerOptions: { workerSrc: 'abc' } },
    Document: ({ onLoadSuccess = (pdf = { numPages: 4 }) => pdf.numPages }) => {
        return <div>{onLoadSuccess({ numPages: 4 })}</div>;
    },
    Outline: null,
    Page: () => <div>def</div>
}));

jest.mock('@cloudscape-design/components', () => {
    const Components = jest.genMockFromModule('@cloudscape-design/components') as any;
    for (const componentName of Object.keys(Components)) {
        Components[componentName] = componentName;
    }
    return Components;
});

test('PDF component renders document with navigation buttons', async () => {
    const tree = renderer.create(<PDF {...pdfPropsPage1} />).toJSON();
    expect(tree).toMatchSnapshot();
});
