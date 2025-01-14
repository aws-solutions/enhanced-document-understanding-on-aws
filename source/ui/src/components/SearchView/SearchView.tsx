// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
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
import Tabs from '@cloudscape-design/components/tabs';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FacetDocumentAttributeKey, MIN_SEARCH_QUERY_LENGTH } from '../../utils/constants';
import { FacetResult } from '../../utils/interfaces';
import KendraResults from './Kendra/KendraResults';
import OpenSearchResults from './OpenSearch/OpenSearchResults';
import { useLazyQueryKendraQuery, useLazyQueryOpenSearchQuery } from '../../store/reducers/searchApiSlice';
import querystring from 'querystring';

type SearchViewProps = {
    searchValue: string;
    setSearchValue: Function;
    submittedSearchValue: string;
    setSubmittedSearchValue: Function;
    casesList: any[];
    caseName: string;
    setSelectedCaseId: Function;
    setSelectedDocumentId: Function;
    setSelectedDocumentFileType: Function;
    enableKendra: boolean;
    enableOpenSearch: boolean;
};

const QUERY_LONG_ENOUGH_ERROR = `Enter a search query longer than ${MIN_SEARCH_QUERY_LENGTH - 1} characters to
initiate a search.`;

export default function SearchView(props: SearchViewProps) {
    const [searchOpensearch] = useLazyQueryOpenSearchQuery();
    const [searchKendra] = useLazyQueryKendraQuery();
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
    const [selectedFilters, setSelectedFilters] = React.useState<{ [key: string]: string[] }>({});

    const [kendraResults, setKendraResults] = React.useState<any[]>([]);
    const [openSearchResults, setOpenSearchResults] = React.useState<any[]>([]);
    const [kendraFacetResults, setKendraFacetResults] = React.useState<any[]>([]);
    const [openSearchFilters, setOpenSearchFilters] = React.useState<any[]>([]);
    const [searchValueError, setSearchValueError] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const queryKendra = async (facetsToFilterBy = selectedFacets, maintainFacetSelection = false) => {
        if (props.submittedSearchValue) {
            try {
                setLoading(true);
                let queryParams: any = {};
                if (selectedCaseOptions.length > 0) {
                    queryParams = {
                        'case_id': selectedCaseOptions.map((caseOptions) => caseOptions.value)
                    };
                }
                if (Object.keys(facetsToFilterBy).length > 0 && maintainFacetSelection) {
                    queryParams = {
                        ...queryParams,
                        ...facetsToFilterBy
                    };
                }
                queryParams = querystring.stringify(queryParams)
                const response = await searchKendra({
                    searchValue: encodeURIComponent(props.submittedSearchValue),
                    params: queryParams
                }).unwrap();
                setKendraResults(response?.ResultItems);
                setKendraFacetResults(response?.FacetResults);

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

    const queryOpenSearch = async (filtersToFilterBy = selectedFilters, maintainFilterSelection = false) => {
        if (props.submittedSearchValue) {
            try {
                setLoading(true);
                let queryParams: any = {};
                if (selectedCaseOptions.length > 0) {
                    queryParams = {
                        'case_id': selectedCaseOptions.map((caseOptions) => caseOptions.value)
                    };
                }

                if (Object.keys(filtersToFilterBy).length > 0 && maintainFilterSelection) {
                    queryParams = {
                        ...queryParams,
                        ...filtersToFilterBy
                    };
                }
                queryParams = querystring.stringify(queryParams)
                const response = await searchOpensearch({
                    searchValue: props.submittedSearchValue,
                    params: queryParams
                }).unwrap();

                setOpenSearchResults(response.results);
                setOpenSearchFilters(response.analytics);

                const uniqueFilters: Set<string> = new Set();
                response.analytics.forEach((filter: any) => {
                    uniqueFilters.add(filter.type);
                });
                const emptySelectedFilters: Record<string, string[]> = {};
                uniqueFilters.forEach((key: string) => {
                    emptySelectedFilters[key] = [];
                });
                if (maintainFilterSelection) {
                    for (const key of Object.keys(emptySelectedFilters)) {
                        emptySelectedFilters[key] = filtersToFilterBy[key];
                    }
                }
                setSelectedFilters(emptySelectedFilters);
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
        if (props.enableKendra) {
            queryKendra();
        }
        if (props.enableOpenSearch) {
            queryOpenSearch();
        }
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
        if (!checkForSearchValueErrors() && props.submittedSearchValue !== props.searchValue) {
            setLoading(true);
            setSearchValueError('');
            props.setSubmittedSearchValue(props.searchValue);
        }
    };

    const handleKendraCheckboxClick = async (facetType: string, facetValue: string) => {
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

    const handleOpenSearchCheckboxClick = async (filterType: string, filterValue: string) => {
        setLoading(true);
        if (isFilterSelected(filterType, filterValue)) {
            setSelectedFilters({
                ...selectedFilters,
                [filterType]: selectedFilters[filterType]?.filter((value: string) => value !== filterValue) ?? []
            });
            queryOpenSearch(
                {
                    ...selectedFilters,
                    [filterType]: selectedFilters[filterType]?.filter((value: string) => value !== filterValue) ?? []
                },
                true
            );
        } else {
            setSelectedFilters({
                ...selectedFilters,
                [filterType]: [...selectedFilters[filterType], filterValue]
            });
            queryOpenSearch(
                {
                    ...selectedFilters,
                    [filterType]: [...selectedFilters[filterType], filterValue]
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

    const isFilterSelected = (filterType: string, filterValue: string) => {
        if (Object.keys(selectedFilters).includes(filterType)) {
            return selectedFilters[filterType].includes(filterValue);
        }
        return false;
    };

    const renderKendraResults = () => {
        return (
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
                        {kendraFacetResults.length > 0 && (
                            <div
                                style={{
                                    width: '25%',
                                    float: 'left'
                                }}
                            >
                                <h2>Filters</h2>
                                {kendraFacetResults.map((facetResult: any) => (
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
                                                                handleKendraCheckboxClick(
                                                                    facetResult.DocumentAttributeKey,
                                                                    valueCountPair.DocumentAttributeValue.StringValue
                                                                )
                                                            }
                                                            checked={isFacetSelected(
                                                                facetResult.DocumentAttributeKey,
                                                                valueCountPair.DocumentAttributeValue.StringValue
                                                            )}
                                                            key={JSON.stringify(valueCountPair)}
                                                        >
                                                            <p>
                                                                {(facetResult.DocumentAttributeKey === 'file_type'
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
                                float: 'left'
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
        );
    };

    const renderOpenSearchResults = () => {
        return (
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
                        {openSearchFilters.length > 0 && (
                            <div
                                style={{
                                    width: '25%',
                                    float: 'left'
                                }}
                            >
                                <h2>Filters</h2>
                                {openSearchFilters.map((openSearchFilter: any) => (
                                    <div key={JSON.stringify(openSearchFilter)}>
                                        {Object.keys(FacetDocumentAttributeKey).includes(openSearchFilter.type) && (
                                            <div>
                                                <h4>
                                                    {
                                                        FacetDocumentAttributeKey[
                                                            openSearchFilter.type as keyof typeof FacetDocumentAttributeKey
                                                        ]
                                                    }
                                                </h4>
                                                {openSearchFilter.filter.map((valueCountPair: any) => (
                                                    <Checkbox
                                                        onChange={({ detail }) =>
                                                            handleOpenSearchCheckboxClick(
                                                                openSearchFilter.type,
                                                                valueCountPair.type
                                                            )
                                                        }
                                                        checked={isFilterSelected(
                                                            openSearchFilter.type,
                                                            valueCountPair.type
                                                        )}
                                                        key={JSON.stringify(valueCountPair.type + valueCountPair.count)}
                                                    >
                                                        <p>{valueCountPair.type + ' (' + valueCountPair.count + ')'}</p>
                                                    </Checkbox>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        <div
                            style={{
                                float: 'left'
                            }}
                        >
                            <OpenSearchResults
                                results={openSearchResults}
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
        );
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
                            <Header variant="h1">Search</Header>
                        </SpaceBetween>
                    }
                    data-testid="search-contentlayout"
                >
                    <form onSubmit={(event) => event.preventDefault()}>
                        <Form
                            actions={
                                <SpaceBetween direction="horizontal" size="xs">
                                    <Button
                                        data-testid="search-button"
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
                    <Tabs
                        tabs={[
                            {
                                label: 'KendraResults',
                                id: 'first',
                                content: renderKendraResults(),
                                disabled: !props.enableKendra
                            },
                            {
                                label: 'OpenSearch Results',
                                id: 'second',
                                content: renderOpenSearchResults(),
                                disabled: !props.enableOpenSearch
                            }
                        ]}
                    />
                </ContentLayout>
            }
            headerSelector="#header"
            navigationHide
            toolsHide
            date-testid="search-view-applayout"
        />
    );
}
