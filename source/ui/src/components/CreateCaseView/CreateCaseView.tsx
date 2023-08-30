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
import { AppLayout, ContentLayout, SpaceBetween } from '@cloudscape-design/components';
import { API } from 'aws-amplify';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { API_NAME, MAX_CASE_NAME_LENGTH, MIN_CASE_NAME_LENGTH } from '../../utils/constants';
import { generateToken } from '../DocumentTable/DocumentTable';
import { FormContent, FormHeader } from './form-content';

type CreateCaseViewProps = {};
let token: string;

export default function CreateCaseView(props: CreateCaseViewProps) {
    const [caseNameError, setCaseNameError] = React.useState('');
    const [currentStatus, setCurrentStatus] = React.useState('');
    const navigate = useNavigate();

    const postResource = async (endpoint: string, params = {}) => {
        try {
            setCurrentStatus('loading');
            token = await generateToken();
            const response = await API.post(API_NAME, endpoint, {
                headers: {
                    Authorization: token
                },
                body: params
            });
            setCurrentStatus('success');
            setTimeout(function () {
                navigate('/');
            }, 1000);
            return response;
        } catch (err) {
            setCurrentStatus('error');
            console.error(err);
        }
    };

    const handleButtonClick = async (caseName: string) => {
        if (!caseName.match(`^[a-zA-Z0-9_ -]{${MIN_CASE_NAME_LENGTH},${MAX_CASE_NAME_LENGTH}}$`)) {
            setCaseNameError(
                'Case name can only include alphanumeric characters, -, _, and spaces and must be between ' +
                    MIN_CASE_NAME_LENGTH +
                    ' and ' +
                    MAX_CASE_NAME_LENGTH +
                    ' characters.'
            );
        } else {
            setCurrentStatus('loading');
            setCaseNameError('');
            await postResource(`case`, { caseName: caseName });
        }
    };

    return (
        <div>
            <AppLayout
                contentType="form"
                content={
                    <ContentLayout
                        header={
                            <SpaceBetween size="m">
                                <FormHeader />
                            </SpaceBetween>
                        }
                        data-testid="create-case-view-contentlayout"
                    >
                        <FormContent
                            handleButtonClick={handleButtonClick}
                            caseNameError={caseNameError}
                            currentStatus={currentStatus}
                        />
                    </ContentLayout>
                }
                headerSelector="#header"
                navigationHide
                toolsHide
                date-testid="create-case-view-applayout"
            />
        </div>
    );
}
