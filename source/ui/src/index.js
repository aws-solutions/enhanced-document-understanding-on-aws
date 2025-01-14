// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import '@cloudscape-design/global-styles/index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

import { Mode, applyMode } from '@cloudscape-design/global-styles';

import { Amplify } from 'aws-amplify';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { API_NAME } from './utils/constants';
import { setupStore } from './store/store';
import { Provider } from 'react-redux';

// apply a color mode
applyMode(Mode.Light);

export async function getRuntimeConfig() {
    const runtimeConfig = await fetch('/runtimeConfig.json');
    return runtimeConfig.json();
}

export function constructAmplifyConfig(json) {
    const amplifyConfig = {
        Auth: {
            region: json.AwsRegion,
            userPoolId: json.UserPoolId,
            userPoolWebClientId: json.UserPoolClientId
        },
        Storage: {
            AWSS3: {
                region: json.AwsRegion
            }
        },
        API: {
            endpoints: [
                {
                    name: API_NAME,
                    endpoint: json.ApiEndpoint,
                    region: json.AwsRegion
                }
            ]
        }
    };
    return amplifyConfig;
}

getRuntimeConfig().then(function (json) {
    const amplifyConfig = constructAmplifyConfig(json);

    let totalNumRequiredDocs = 0;
    const uniqueDocumentTypes = [];
    const requiredDocTypeCounts = {};
    json.RequiredDocs.forEach((doc) => {
        const numDocuments = parseInt(doc.NumDocuments);
        totalNumRequiredDocs += numDocuments;
        if (!uniqueDocumentTypes.includes(doc.DocumentType)) {
            uniqueDocumentTypes.push(doc.DocumentType);
        }
        if (requiredDocTypeCounts[doc.DocumentType]) {
            requiredDocTypeCounts[doc.DocumentType] += numDocuments;
        } else {
            requiredDocTypeCounts[doc.DocumentType] = numDocuments;
        }
    });

    const workflowConfig = {
        NumRequiredDocuments: totalNumRequiredDocs,
        UniqueDocumentTypes: uniqueDocumentTypes,
        WorkflowConfigName: json.WorkflowConfigName
    };
    Amplify.configure(amplifyConfig);
    const store = setupStore();
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
        <React.StrictMode>
            <BrowserRouter>
                <Provider store={store}>
                    <App
                        enableKendra={json.KendraStackDeployed === 'Yes'}
                        enableOpenSearch={json.OpenSearchStackDeployed === 'Yes'}
                        workflowConfig={workflowConfig}
                        requiredDocs={requiredDocTypeCounts}
                    />
                </Provider>
            </BrowserRouter>
        </React.StrictMode>
    );
});
