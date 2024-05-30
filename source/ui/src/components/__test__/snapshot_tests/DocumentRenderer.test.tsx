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

import '@testing-library/jest-dom';
import { marks1, tables } from '../../../__test__/test_data';
import DocumentRenderer from '../../DocumentRenderer/DocumentRenderer';
import renderer from 'react-test-renderer';

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

describe('DocumentRenderer component', () => {
    it('DocumentRenderer snapshot test', async () => {
        const selectedDocumentFileType = 'pdf';
        const selectedDocumentUrl = 'fake-url';
        const currentPageNumber = 1;
        const switchPage = jest.fn();
        const tree = renderer
            .create(
                <DocumentRenderer
                    selectedDocumentFileType={selectedDocumentFileType}
                    selectedDocumentUrl={selectedDocumentUrl}
                    currentPageNumber={currentPageNumber}
                    switchPage={switchPage}
                    marks={marks1}
                    tables={tables}
                    retrieveSignedUrl={jest.fn()}
                />
            )
            .toJSON();
        expect(tree).toMatchSnapshot();
    });
});
