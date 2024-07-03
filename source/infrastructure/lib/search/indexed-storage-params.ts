import * as cdk from 'aws-cdk-lib';
import { Construct, IConstruct } from 'constructs';

/**
 * The parameters to select Indexed Storage options
 */
export class IndexedStorageParams extends Construct {
    /**
     * Parameter to deploy Kendra
     */
    public readonly deployKendraIndex: cdk.CfnParameter;

    /**
     * Parameter to deploy OpenSearch
     */
    public readonly deployOpenSearch: cdk.CfnParameter;

    /**
     * Condition that indicates if OpenSearch serverless should be created
     */
    public readonly deployOpenSearchIndexCondition: cdk.CfnCondition;

    /**
     * Condition that indicates if Kendra index should be created
     */
    public readonly deployKendraIndexCondition: cdk.CfnCondition;

    /**
     * The value that indicates if Kendra index should be created
     */
    public readonly isKendraDeployed: string;

    /**
     * The value that indicates if Kendra index should be created
     */
    public readonly isOpenSearchDeployed: string;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.deployKendraIndex = new cdk.CfnParameter(this, 'DeployKendraIndex', {
            type: 'String',
            allowedValues: ['Yes', 'No'],
            allowedPattern: '^(Yes|No)$',
            description:
                'Please select if you would like to deploy Amazon Kendra Index. For more details, refer to the implementation guide for this solution',
            constraintDescription: 'Please select either Yes or No',
            default: 'No'
        });

        this.deployOpenSearch = new cdk.CfnParameter(this, 'DeployOpenSearch', {
            type: 'String',
            allowedValues: ['Yes', 'No'],
            allowedPattern: '^(Yes|No)$',
            description:
                'Please select if you would like to deploy Amazon OpenSearch service. For more details, refer to the implementation guide for this solution',
            constraintDescription: 'Please select either Yes or No',
            default: 'No'
        });

        this.deployOpenSearchIndexCondition = new cdk.CfnCondition(this, 'DeployOpenSearchCondition', {
            expression: cdk.Fn.conditionEquals(this.deployOpenSearch, 'Yes')
        });
        this.deployKendraIndexCondition = new cdk.CfnCondition(this, 'DeployKendraIndexCondition', {
            expression: cdk.Fn.conditionEquals(this.deployKendraIndex, 'Yes')
        });

        this.isKendraDeployed = this.deployKendraIndex.valueAsString;

        this.isOpenSearchDeployed = this.deployOpenSearch.valueAsString;
    }
}
