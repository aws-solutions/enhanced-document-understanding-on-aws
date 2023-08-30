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
    AppLayout,
    Button,
    Checkbox,
    Container,
    ContentLayout,
    Form,
    FormField,
    Header,
    Input,
    Multiselect,
    MultiselectProps,
    SpaceBetween,
    Spinner
} from '@cloudscape-design/components';
import { OptionDefinition } from '@cloudscape-design/components/internal/components/option/interfaces';
import { API } from 'aws-amplify';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { API_NAME, FacetDocumentAttributeKey, MIN_SEARCH_QUERY_LENGTH } from '../../utils/constants';
import { FacetResult } from '../../utils/interfaces';
import { generateToken } from '../DocumentTable/DocumentTable';
import { mapResultsToCases } from '../makeData';
import KendraResults from './KendraResults';

type SearchViewProps = {
    searchValue: string;
    setSearchValue: Function;
    submittedSearchValue: string;
    setSubmittedSearchValue: Function;
    casesList: any[];
    setCasesList: Function;
    caseName: string;
    setSelectedCaseId: Function;
    setSelectedDocumentId: Function;
    setSelectedDocumentFileType: Function;
};
let token: string;
let results: any;

const QUERY_LONG_ENOUGH_ERROR = `Enter a search query longer than ${MIN_SEARCH_QUERY_LENGTH - 1} characters to
initiate a search.`;

export default function SearchView(props: SearchViewProps) {
    let cases: any[];
    if (props.casesList) {
        cases = [
            ...new Set(
                props.casesList.map((item) => {
                    return { 'name': item.name, 'id': item.caseId };
                })
            )
        ];
    } else {
        cases = [];
    }
    const casesOptions = cases.map((item) => {
        return {
            label: item.name,
            value: item.id
        };
    });

    const [selectedCaseOptions, setSelectedCaseOptions] = React.useState<MultiselectProps.Option[]>([]);
    const [selectedFacets, setSelectedFacets] = React.useState<{ [key: string]: string[] }>({});

    const [kendraResults, setKendraResults] = React.useState<any[]>([]);
    const [facetResults, setFacetResults] = React.useState<any[]>([]);
    const [searchValueError, setSearchValueError] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        const fetchData = async () => {
            token = await generateToken();
            results = await API.get(API_NAME, 'cases', {
                headers: {
                    Authorization: token
                }
            });
            const newData = mapResultsToCases(results.Items);
            props.setCasesList(newData);
        };
        if (!props.casesList) {
            fetchData();
        }
    }, []);

    const queryKendra = async (facetsToFilterBy = selectedFacets, maintainFacetSelection = false) => {
        if (props.submittedSearchValue) {
            try {
                setLoading(true);
                token = await generateToken();
                const queryParams: any = {
                    headers: {
                        Authorization: token
                    }
                };
                if (selectedCaseOptions.length > 0) {
                    queryParams.queryStringParameters = {
                        'case_id': selectedCaseOptions.map((caseOptions) => caseOptions.value)
                    };
                }
                if (Object.keys(facetsToFilterBy).length > 0 && maintainFacetSelection) {
                    queryParams.queryStringParameters = {
                        ...queryParams.queryStringParameters,
                        ...facetsToFilterBy
                    };
                }
                const response = await API.get(
                    API_NAME,
                    `search/kendra/${encodeURIComponent(props.submittedSearchValue)}`,
                    queryParams
                );
                setKendraResults(response?.ResultItems);
                setFacetResults(response?.FacetResults);

                const uniqueFacets: Set<string> = new Set();
                response?.FacetResults.forEach((result: FacetResult) => {
                    uniqueFacets.add(result.DocumentAttributeKey);
                });
                const emptySelectedFacets: Record<string, string[]> = {};
                uniqueFacets.forEach((key: string) => {
                    emptySelectedFacets[key] = [];
                });
                if (maintainFacetSelection) {
                    for (const key of Object.keys(emptySelectedFacets)) {
                        emptySelectedFacets[key] = facetsToFilterBy[key];
                    }
                }
                setSelectedFacets(emptySelectedFacets);
                setLoading(false);
                return response;
            } catch (err) {
                console.error(err);
            }
        } else {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        queryKendra();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.submittedSearchValue, selectedCaseOptions]);

    let documentsTotal;

    if (props.casesList) {
        documentsTotal = props.casesList.reduce((total, caseObject) => {
            return total + caseObject.caseDocuments.length;
        }, 0);
    } else {
        documentsTotal = 0;
    }

    const navigate = useNavigate();

    const checkForSearchValueErrors = () => {
        if (!isQueryLongEnough) {
            setSearchValueError(QUERY_LONG_ENOUGH_ERROR);
            return true;
        }
        return false;
    };

    const handleKeyDown = async (key: string) => {
        if (key === 'Enter' && !checkForSearchValueErrors() && props.submittedSearchValue !== props.searchValue) {
            setLoading(true);
            setSearchValueError('');
            props.setSubmittedSearchValue(props.searchValue);
        }
    };

    const handleSearchClick = async () => {
        console.count('search click');
        if (!checkForSearchValueErrors() && props.submittedSearchValue !== props.searchValue) {
            setLoading(true);
            setSearchValueError('');
            props.setSubmittedSearchValue(props.searchValue);
        }
    };

    const handleCheckboxClick = async (facetType: string, facetValue: string) => {
        setLoading(true);
        if (isFacetSelected(facetType, facetValue)) {
            setSelectedFacets({
                ...selectedFacets,
                [facetType]: selectedFacets[facetType]?.filter((value: string) => value !== facetValue) ?? []
            });
            queryKendra(
                {
                    ...selectedFacets,
                    [facetType]: selectedFacets[facetType]?.filter((value: string) => value !== facetValue) ?? []
                },
                true
            );
        } else {
            setSelectedFacets({
                ...selectedFacets,
                [facetType]: [...selectedFacets[facetType], facetValue]
            });
            queryKendra(
                {
                    ...selectedFacets,
                    [facetType]: [...selectedFacets[facetType], facetValue]
                },
                true
            );
        }
    };

    const isFacetSelected = (facetType: string, facetValue: string) => {
        if (Object.keys(selectedFacets).includes(facetType)) {
            return selectedFacets[facetType].includes(facetValue);
        }
        return false;
    };

    if (documentsTotal === 0) {
        return (
            <div
                style={{
                    position: 'relative',
                    minHeight: '320rem',
                    paddingBottom: '32rem'
                }}
            >
                <p
                    style={{
                        margin: '2em 0',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: 'gray'
                    }}
                >
                    No documents found. <br />
                    <Button variant="normal" onClick={() => navigate('/uploadDocument')}>
                        Add a new Document
                    </Button>
                </p>
            </div>
        );
    }

    const isQueryLongEnough = props.searchValue && props.searchValue.length >= MIN_SEARCH_QUERY_LENGTH;

    return (
        <AppLayout
            contentType="form"
            content={
                <ContentLayout
                    header={
                        <SpaceBetween size="m">
                            <Header variant="h1">Kendra search</Header>
                        </SpaceBetween>
                    }
                    data-testid="kendra-search-contentlayout"
                >
                    <form onSubmit={(event) => event.preventDefault()}>
                        <Form
                            actions={
                                <SpaceBetween direction="horizontal" size="xs">
                                    <Button
                                        data-testid="kendra-search-button"
                                        variant="primary"
                                        onClick={() => handleSearchClick()}
                                    >
                                        Search
                                    </Button>
                                </SpaceBetween>
                            }
                            errorIconAriaLabel="Error"
                            data-testid="search-view-form"
                        >
                            <Container>
                                <SpaceBetween direction="vertical" size="l">
                                    <FormField
                                        label="Search query"
                                        i18nStrings={{ errorIconAriaLabel: 'Error' }}
                                        data-testid="search-field"
                                        errorText={searchValueError}
                                    >
                                        <Input
                                            placeholder="Search"
                                            type="search"
                                            data-testid="search-view-search"
                                            value={props.searchValue}
                                            onChange={({ detail }) => props.setSearchValue(detail.value)}
                                            onKeyDown={({ detail }) => handleKeyDown(detail.key)}
                                        />
                                    </FormField>
                                    <FormField
                                        label="Case selection"
                                        i18nStrings={{ errorIconAriaLabel: 'Error' }}
                                        data-testid="case-selection-field"
                                    >
                                        <Multiselect
                                            selectedOptions={selectedCaseOptions}
                                            onChange={({ detail }) => {
                                                setSelectedCaseOptions(detail.selectedOptions as OptionDefinition[]);
                                            }}
                                            options={casesOptions}
                                            filteringType="auto"
                                            selectedAriaLabel="Selected"
                                            data-testid="search-case-multiselect"
                                            placeholder="Choose to specify cases"
                                        />
                                    </FormField>
                                </SpaceBetween>
                            </Container>
                        </Form>
                    </form>
                    <div
                        style={{
                            position: 'relative',
                            minHeight: '320rem',
                            paddingBottom: '32rem'
                        }}
                    >
                        {loading && <Spinner size="large" />}
                        {props.submittedSearchValue && (
                            <div style={{ display: 'flex', height: '100%' }}>
                                {facetResults.length > 0 && (
                                    <div
                                        style={{
                                            width: '25%',
                                            float: 'left'
                                        }}
                                    >
                                        <h2>Filters</h2>
                                        {facetResults.map((facetResult: any) => (
                                            <div key={JSON.stringify(facetResult)}>
                                                {Object.keys(FacetDocumentAttributeKey).includes(
                                                    facetResult.DocumentAttributeKey
                                                ) && (
                                                    <div>
                                                        <h4>
                                                            {
                                                                FacetDocumentAttributeKey[
                                                                    facetResult.DocumentAttributeKey as keyof typeof FacetDocumentAttributeKey
                                                                ]
                                                            }
                                                        </h4>
                                                        {facetResult.DocumentAttributeValueCountPairs.map(
                                                            (valueCountPair: any) => (
                                                                <Checkbox
                                                                    onChange={({ detail }) =>
                                                                        handleCheckboxClick(
                                                                            facetResult.DocumentAttributeKey,
                                                                            valueCountPair.DocumentAttributeValue
                                                                                .StringValue
                                                                        )
                                                                    }
                                                                    checked={isFacetSelected(
                                                                        facetResult.DocumentAttributeKey,
                                                                        valueCountPair.DocumentAttributeValue
                                                                            .StringValue
                                                                    )}
                                                                    key={JSON.stringify(valueCountPair)}
                                                                >
                                                                    <p>
                                                                        {(facetResult.DocumentAttributeKey ===
                                                                        'file_type'
                                                                            ? valueCountPair.DocumentAttributeValue.StringValue.slice(
                                                                                  1
                                                                              )
                                                                            : valueCountPair.DocumentAttributeValue
                                                                                  .StringValue) +
                                                                            ' (' +
                                                                            valueCountPair.Count.toString() +
                                                                            ')'}
                                                                    </p>
                                                                </Checkbox>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div
                                    style={{
                                    float: 'right'
                                    }}
                                >
                                    <KendraResults
                                        results={kendraResults}
                                        searchQuery={props.submittedSearchValue}
                                        casesList={props.casesList}
                                        setSelectedCaseId={props.setSelectedCaseId}
                                        setSelectedDocumentId={props.setSelectedDocumentId}
                                        setSelectedDocumentFileType={props.setSelectedDocumentFileType}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </ContentLayout>
            }
            headerSelector="#header"
            navigationHide
            toolsHide
            date-testid="search-view-applayout"
        />
    );
}
