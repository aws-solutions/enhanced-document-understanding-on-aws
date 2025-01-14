#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { addCfnSuppressRules } from '../utils/cfn-nag-suppressions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';

/**
 * This nexted stack creates the vpc where OpenSearch serverless collections and workflow orchestrator runs in.
 * It will create a vpc with 2 private and 2 public subnets associated a security group and an interface
 * endpoints that allows KMS.
 */
export class VpcStack extends cdk.NestedStack {
    /**
     * Security group that workflow orchestrator runs in, in order to access the OpenSearch serverless collections.
     */
    public readonly securityGroup: ec2.SecurityGroup;

    /**
     * Vpc that workflow orchestrator runs in.
     */
    public readonly vpc: ec2.Vpc;

    /**
     * Private subnets that workflow orchestrator runs in.
     */
    public privateSubnetIds: string[];

    constructor(scope: Construct, id: string, props?: cdk.NestedStackProps) {
        super(scope, id);

        const vpcFlowLogLogGroup = new logs.LogGroup(this, 'VPCFlowLogs', {
            retention: logs.RetentionDays.TEN_YEARS
        });

        const vpc = new ec2.Vpc(this, 'Vpc', {
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: 'private-subnet',
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
                },
                {
                    cidrMask: 24,
                    name: 'public-subnet',
                    subnetType: ec2.SubnetType.PUBLIC,
                    mapPublicIpOnLaunch: false
                }
            ],
            gatewayEndpoints: {
                S3: {
                    service: ec2.GatewayVpcEndpointAwsService.S3
                }
            },
            flowLogs: {
                flowLogs: {
                    destination: ec2.FlowLogDestination.toCloudWatchLogs(vpcFlowLogLogGroup),
                    trafficType: ec2.FlowLogTrafficType.REJECT
                }
            }
        });
        this.vpc = vpc;

        const securityGroup = new ec2.SecurityGroup(this, 'IngressSG', {
            vpc,
            description: 'Used for accessing the OpenSearch serverless collections',
            allowAllOutbound: true
        });
        this.securityGroup = securityGroup;

        this.securityGroup.node.addDependency(this.vpc);

        securityGroup.addIngressRule(
            ec2.Peer.ipv4(vpc.vpcCidrBlock),
            ec2.Port.allTraffic(),
            'Allow lambda ingress',
            false
        );

        // eslint-disable-next-line prettier/prettier
        new ec2.InterfaceVpcEndpoint(this, 'KmsVpcEndpoint', {
            vpc: vpc,
            service: ec2.InterfaceVpcEndpointAwsService.KMS
        });

        addCfnSuppressRules(vpcFlowLogLogGroup, [
            { id: 'W84', reason: 'LogGroups are by default encrypted server side by CloudWatch Logs Service' }
        ]);

        addCfnSuppressRules(securityGroup, [
            {
                id: 'W5',
                reason: 'Egress security groups with cidr open to world are generally considered OK'
            },
            {
                id: 'W40',
                reason: 'Egress security groups with IpProtocol of -1 are generally considered OK'
            }
        ]);

        this.privateSubnetIds = vpc.privateSubnets.map((subnet) => subnet.subnetId);
    }
}
