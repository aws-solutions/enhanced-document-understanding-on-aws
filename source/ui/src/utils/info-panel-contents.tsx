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

import { HelpPanel, Icon } from '@cloudscape-design/components';

export const CaseTableInfoPanelContent = () => (
    <HelpPanel header={<h2>Info</h2>} data-testid="case-table-info-panel">
        <h4>Cases</h4>
        <p>
            View your current cases and related information such as the case ID, creation data, number of documents in
            the case and case processing status.
        </p>

        <p>Select an individual case to view the list of documents uploaded to the case.</p>

        <h4>Documents</h4>
        <p>
            View all of the documents associated to a case, including details such as document ID, creation date and
            file type. When documents are successfully processed the case processing status will change to{' '}
            <strong>Complete</strong>.
        </p>

        <p>
            Note, the case processing will start{' '}
            <strong>after all the required documents have been uploaded to a case.</strong>.
        </p>

        <p>To view the document analysis results, after processing is complete, simply click on the document name.</p>
    </HelpPanel>
);

export const BackendUploadInfoPanelContent = () => (
    <HelpPanel data-testid="document-results-info-panel" header={<h2>Backend Upload Info</h2>}>
        <div>
            <p>
                Enabling this feature will allow you to upload multiple documents through the aws console via the S3
                service.
            </p>
            <br />
        </div>
    </HelpPanel>
);

export const DocumentResultsInfoPanelContent = () => (
    <HelpPanel
        data-testid="document-results-info-panel"
        header={<h2>Document Analysis Info</h2>}
        footer={
            <div>
                <h3>
                    Learn more <Icon name="external" />
                </h3>
                <ul>
                    <li>
                        <a href="https://aws.amazon.com/textract/">Learn more about Amazon Textract</a>
                    </li>
                    <li>
                        <a href="https://aws.amazon.com/comprehend/">Learn More about Amazon Comprehend</a>
                    </li>
                </ul>
            </div>
        }
    >
        <div>
            <p>
                Each document has been analyzed to provide information on one or more of the following types of
                analysis. Every entity detected can be clicked to navigate to the exact location in the document.
            </p>

            <h4>Entity Detection</h4>
            <p>
                Amazon Comprehend is used to detect entities in a document. This tab shows any standard entities that
                are detected in a document, such as date, organization, quantity, and so on.
            </p>

            <h4>Medical Entity Detection</h4>
            <p>
                Amazon Comprehend Medical is used to detect medical entities in a document. This tab shows any medical
                entities that are detected in a document, such as medication, diagnosis, and so on.
            </p>

            <h4>Personal Identifiable Information (PII) Detection</h4>
            <p>
                Amazon Comprehend is used to detect personal information in a document. This tab shows any PII entities
                that are detected in a document, such as name, address, and so on.
            </p>

            <h4>Raw Text</h4>
            <p>
                Amazon Textract is used to extract text from a document. This tab shows the raw text extracted from a
                document. It supports various types and forms of documents, such as handwritten text, PDF, and image.
            </p>

            <h4>Key-Value Pairs</h4>
            <p>
                Amazon Textract is used to extract key-value pairs from a document. This tab shows the key-value pairs
                extracted from a document.
            </p>

            <h4>Tables</h4>
            <p>
                Amazon Textract is used to extract tables from a document. This tab shows all the tables extracted from
                a document.
            </p>

            <h4>Redaction</h4>
            <p>
                This application also provides the functionality to redact any entity detected in a document. To redact,
                simply check the checkboxes beside a detected entity and click the{' '}
                <strong>Download Redacted Document</strong> button. To preview the redaction, toggle the{' '}
                <strong>Preview Redacted Document</strong> slider.
            </p>
            <br />
        </div>
    </HelpPanel>
);
