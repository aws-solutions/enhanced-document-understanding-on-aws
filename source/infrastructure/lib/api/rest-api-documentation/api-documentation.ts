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

import { CfnDocumentationPart, CfnDocumentationPartProps, CfnDocumentationVersion } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { caseResource, createCaseBody, createCaseMethod } from './case';
import { casesResource } from './cases';
import { downloadDocQueryParam, getDocQueryParam } from './document';
import { redactMethod, redactSuccessResponse } from './redact';
import { getInferenceByTypeMethod, listInferencesMethod } from './inferences';
import { apiRootDocumentationPart, authTokenHeader, caseIdPathParam, docIdPathParam } from './root';
import { kendraSearchMethod, kendraSearchQueryPathParam, openSearchMethod, openSearchQueryPathParam } from './search';

export interface ApiDocumentationProps {
    /**
     * The ID of the API Gateway Rest API.
     */
    readonly restApiId: string;
}

export class ApiDocumentation extends Construct {
    /**
     * The ID of the API Gateway Rest API.
     */
    public readonly restApiId: string;

    constructor(scope: Construct, id: string, props: ApiDocumentationProps) {
        super(scope, id);
        this.restApiId = props.restApiId;

        // specify the documentation version as same as solution version
        const documentationVersion = new CfnDocumentationVersion(this, 'Version', {
            documentationVersion: scope.node.tryGetContext('solution_version') || '',
            restApiId: this.restApiId
        });

        // root resource
        documentationVersion.addDependency(
            new CfnDocumentationPart(this, 'RequestAuthHeader', this.createDocumentationPart(authTokenHeader))
        );
        documentationVersion.addDependency(
            new CfnDocumentationPart(this, 'CaseIdPathParam', this.createDocumentationPart(caseIdPathParam))
        );
        documentationVersion.addDependency(
            new CfnDocumentationPart(this, 'DocumentIdPathParam', this.createDocumentationPart(docIdPathParam))
        );
        documentationVersion.addDependency(
            new CfnDocumentationPart(this, 'ApiRoot', this.createDocumentationPart(apiRootDocumentationPart))
        );

        // case resource and endpoints
        documentationVersion.addDependency(
            new CfnDocumentationPart(this, 'CaseResource', this.createDocumentationPart(caseResource))
        );
        documentationVersion.addDependency(
            new CfnDocumentationPart(this, 'CreateCaseMethod', this.createDocumentationPart(createCaseMethod))
        );
        documentationVersion.addDependency(
            new CfnDocumentationPart(this, 'CreateCaseBody', this.createDocumentationPart(createCaseBody))
        );

        // cases endpoint
        documentationVersion.addDependency(
            new CfnDocumentationPart(this, 'ListCasesResource', this.createDocumentationPart(casesResource))
        );
        // document endpoints
        documentationVersion.addDependency(
            new CfnDocumentationPart(this, 'GetDocQueryParam', this.createDocumentationPart(getDocQueryParam))
        );
        documentationVersion.addDependency(
            new CfnDocumentationPart(this, 'DownloadDocQueryParam', this.createDocumentationPart(downloadDocQueryParam))
        );

        // redact endpoint
        documentationVersion.addDependency(
            new CfnDocumentationPart(this, 'RedactMethod', this.createDocumentationPart(redactMethod))
        );
        documentationVersion.addDependency(
            new CfnDocumentationPart(this, 'RedactSuccessResponse', this.createDocumentationPart(redactSuccessResponse))
        );

        // search endpoint
        documentationVersion.addDependency(
            new CfnDocumentationPart(this, 'KendraSearchMethod', this.createDocumentationPart(kendraSearchMethod))
        );
        documentationVersion.addDependency(
            new CfnDocumentationPart(this, 'KendraSearchPathParam', this.createDocumentationPart(kendraSearchQueryPathParam))
        );
        documentationVersion.addDependency(
            new CfnDocumentationPart(this, 'OpenSearchMethod', this.createDocumentationPart(openSearchMethod))
        );
        documentationVersion.addDependency(
            new CfnDocumentationPart(this, 'OpenSearchPathParam', this.createDocumentationPart(openSearchQueryPathParam))
        );

        // inference edpoints
        documentationVersion.addDependency(
            new CfnDocumentationPart(
                this,
                'GetInferenceByTypeMethod',
                this.createDocumentationPart(getInferenceByTypeMethod)
            )
        );
        documentationVersion.addDependency(
            new CfnDocumentationPart(this, 'ListInferencesMethod', this.createDocumentationPart(listInferencesMethod))
        );
    }

    /**
     * Takes in the api documentation part for any api resource, endpoint, header, etc and injects
     * the rest api id to return a complete CfnDocumentationPartProps object
     * @param partialDocumentationPart Partial documentation part of API components as defined
     * @returns
     */
    private createDocumentationPart(
        partialDocumentationPartProps: Partial<CfnDocumentationPartProps>
    ): CfnDocumentationPartProps {
        return {
            ...partialDocumentationPartProps,
            restApiId: this.restApiId
        } as CfnDocumentationPartProps;
    }
}
