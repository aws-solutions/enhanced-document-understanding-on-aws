#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as appreg from '@aws-cdk/aws-servicecatalogappregistry-alpha';
import * as cdk from 'aws-cdk-lib';

import { Construct, IConstruct } from 'constructs';

export interface AppRegistryProps {
    /**
     * Name of the solution as set through from cdk.json
     */
    solutionName: string;

    /**
     * Name of the application used to create an entry in AppRegistry as set through cdk.json
     */
    applicationName: string;

    /**
     * Solution ID associated with the application
     */
    solutionID: string;
    /**
     * Solution version of the application
     */
    solutionVersion: string;
    /**
     * An application type attribute initialized in the constructor of this class
     */
    applicationType: string;
}

/**
 * A CDK Aspect to add App Registry constructs
 */
export class AppRegistry extends Construct implements cdk.IAspect {
    /**
     * Name of the solution as set through from cdk.json
     */
    private solutionName: string;

    /**
     * Name of the application used to create an entry in AppRegistry as set through cdk.json
     */
    private applicationName: string;

    /**
     * Solution ID as set through cdk.json
     */
    private solutionID: string;

    /**
     * Solution version as set through cdk.json
     */
    private solutionVersion: string;

    /**
     * An application type attribute initialized in the constructor of this class
     */
    private applicationType: string;

    /**
     * The instance of application that the solution stacks should be associated with
     */
    private application: appreg.Application;

    constructor(scope: Construct, id: string, props: AppRegistryProps) {
        super(scope, id);
        this.solutionName = props.solutionName;
        this.applicationName = `App-${props.applicationName}`;
        this.solutionID = props.solutionID;
        this.solutionVersion = props.solutionVersion;
        this.applicationType = props.applicationType;
    }

    /**
     * Method invoked as a `Visitor` pattern to inject aspects during cdk synthesis
     *
     * @param node
     */
    public visit(node: IConstruct): void {
        if (node instanceof cdk.Stack) {
            if (!node.nested) {
                // parent stack
                const stack = node;
                this.createAppForAppRegistry();
                this.application.associateApplicationWithStack(stack);
                this.createAttributeGroup();
                this.addTagsforApplication();
            } else {
                if (!this.application) {
                    this.createAppForAppRegistry();
                }

                const nestedStack = node;
                this.application.associateApplicationWithStack(nestedStack);
                (nestedStack.node.defaultChild as cdk.CfnResource).addDependency(
                    this.application.node.defaultChild as cdk.CfnResource
                );
            }
        }
    }

    /**
     * Method to initialize an Application in AppRegistry service
     *
     * @returns - Instance of AppRegistry's Application class
     */
    private createAppForAppRegistry(): void {
        this.application = new appreg.Application(this, 'RegistrySetup', {
            applicationName: this.applicationName,
            description: `Service Catalog application to track and manage all your resources for the solution ${this.solutionName}`
        });
    }

    /**
     * Method to add tags to the AppRegistry's Application instance
     *
     */
    private addTagsforApplication(): void {
        if (!this.application) {
            this.createAppForAppRegistry();
        }

        cdk.Tags.of(this.application).add('Solutions:SolutionID', this.solutionID);
        cdk.Tags.of(this.application).add('Solutions:SolutionName', this.solutionName);
        cdk.Tags.of(this.application).add('Solutions:SolutionVersion', this.solutionVersion);
        cdk.Tags.of(this.application).add('Solutions:ApplicationType', this.applicationType);
    }

    /**
     * Method to create AttributeGroup to be associated with the Application's instance in AppRegistry
     *
     */
    private createAttributeGroup(): void {
        if (!this.application) {
            this.createAppForAppRegistry();
        }
        const attrGroup = new appreg.AttributeGroup(this, 'AppAttributes', {
            attributeGroupName: `AttrGrp-${cdk.Aws.STACK_NAME}`,
            description: 'Attributes for Solutions Metadata',
            attributes: {
                applicationType: this.applicationType,
                version: this.solutionVersion,
                solutionID: this.solutionID,
                solutionName: this.solutionName
            }
        });
        attrGroup.associateWith(this.application);
    }
}
