/**********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the License). You may not use this file except in compliance      *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/
import {
    Button,
    Container,
    Form,
    FormField,
    Header,
    Input,
    SpaceBetween,
    StatusIndicator,
    Checkbox
} from '@cloudscape-design/components';
import React from 'react';
import { useNavigate } from 'react-router-dom';

export function FormHeader() {
    return <Header variant="h1">Create case</Header>;
}

function BaseFormContent({ content, onCancelClick, errorText = null, onCreateClick, currentStatus }: any) {
    let statusLabel = '';
    if (currentStatus === 'success') {
        statusLabel = 'Case created';
    } else if (currentStatus === 'error') {
        statusLabel = 'Case creation failed';
    } else if (currentStatus === 'loading') {
        statusLabel = 'Creating case';
    }
    return (
        <form onSubmit={(event) => event.preventDefault()}>
            <Form
                actions={
                    <SpaceBetween direction="horizontal" size="xs">
                        <StatusIndicator type={currentStatus}> {statusLabel} </StatusIndicator>
                        <span>&nbsp;&nbsp;</span>
                        <Button data-testid="create-case-button" variant="primary" onClick={onCreateClick}>
                            Create case
                        </Button>
                        <Button variant="link" onClick={onCancelClick}>
                            Cancel
                        </Button>
                    </SpaceBetween>
                }
                errorText={errorText}
                errorIconAriaLabel="Error"
            >
                {content}
            </Form>
        </form>
    );
}

export function FormContent({ handleButtonClick, caseNameError, currentStatus }: any) {
    const [caseName, setCaseName] = React.useState('');
    const [enableBackendUpload, setEnableBackendUpload] = React.useState(false);
    const navigate = useNavigate();
    return (
        <BaseFormContent
            content={
                <Container>
                    <SpaceBetween size="xs">
                        <FormField
                            label="Case name"
                            errorText={caseNameError}
                            i18nStrings={{ errorIconAriaLabel: 'Error' }}
                            data-testid="case-name-field"
                        >
                            <Input
                                ariaRequired={true}
                                value={caseName}
                                onChange={(event) => setCaseName(event.detail.value)}
                                data-testid="case-name-input"
                            />
                        </FormField>
                        <FormField
                            label="Backend Upload"
                            description="allows the user to upload directly through the s3 console"
                            data-testid="case-bulk-upload"
                        >
                            <Checkbox
                                onChange={({ detail }) => setEnableBackendUpload(detail.checked)}
                                checked={enableBackendUpload}
                            >
                                Enable
                            </Checkbox>
                        </FormField>
                    </SpaceBetween>
                </Container>
            }
            onCancelClick={() => navigate(`/`)}
            onCreateClick={() => handleButtonClick(caseName, enableBackendUpload)}
            currentStatus={currentStatus}
        />
    );
}
