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
import React from 'react';
import { BreadcrumbGroup, Button, Header, HeaderProps, SpaceBetween } from '@cloudscape-design/components';
import { useNavigate } from 'react-router-dom';
import { InfoLink } from './info-link';

interface CasePageHeaderProps extends HeaderProps {
    title?: string;
    createButtonText?: string;
    extraActions?: React.ReactNode;
    selectedItemsCount: number;
    refreshFunction: () => void;
    onInfoLinkClick?: () => void;
}

interface DocResultsPageHeaderProps extends HeaderProps {
    title?: string;
    breadCrumbItems: {
        selectedCaseName: string;
        selectedDocumentName: string;
    };
    extraActions?: React.ReactNode;
    onInfoLinkClick?: () => void;
}

export function CasePageHeader({
    title = 'Cases',
    createButtonText = 'Create case',
    extraActions = null,
    selectedItemsCount,
    refreshFunction,
    onInfoLinkClick,
    ...props
}: CasePageHeaderProps) {
    const navigate = useNavigate();

    return (
        <Header
            variant="awsui-h1-sticky"
            info={onInfoLinkClick && <InfoLink onFollow={onInfoLinkClick} ariaLabel={`Information about ${title}`} />}
            actions={
                <SpaceBetween size="xs" direction="horizontal">
                    {extraActions}
                    <Button
                        data-testid="refresh-cases-button"
                        iconName="refresh"
                        variant="icon"
                        ariaLabel="Refresh"
                        onClick={() => refreshFunction()}
                    >
                        Refresh
                    </Button>
                    <Button data-testid="create-case-button" variant="primary" onClick={() => navigate(`/createCase`)}>
                        {createButtonText}
                    </Button>
                </SpaceBetween>
            }
            {...props}
        >
            {title}
        </Header>
    );
}

export function DocResultsPageHeader({
    title = 'Document Analysis Results',
    extraActions = null,
    onInfoLinkClick,
    breadCrumbItems,
    ...props
}: DocResultsPageHeaderProps) {
    return (
        <SpaceBetween size="m">
            <BreadcrumbGroup
                items={[
                    { text: breadCrumbItems.selectedCaseName, href: '/' },
                    { text: breadCrumbItems.selectedDocumentName, href: '#' }
                ]}
                ariaLabel="Breadcrumbs"
            />
            <Header
                variant="awsui-h1-sticky"
                info={
                    onInfoLinkClick && <InfoLink onFollow={onInfoLinkClick} ariaLabel={`Information about ${title}`} />
                }
                actions={
                    <SpaceBetween size="xs" direction="horizontal">
                        {extraActions}
                    </SpaceBetween>
                }
                {...props}
            >
                {title}
            </Header>
        </SpaceBetween>
    );
}
