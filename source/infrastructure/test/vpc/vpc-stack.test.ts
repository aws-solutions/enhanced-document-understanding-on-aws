import * as cdk from 'aws-cdk-lib';
import { Capture, Template } from 'aws-cdk-lib/assertions';
import { DusStack } from '../../lib/dus-stack';
import * as rawCdkJson from '../../cdk.json';
import { VpcStack } from '../../lib/vpc/vpc-stack';

describe('When VPC stack is enabled and deployed', () => {
    let template: Template;
    let app: cdk.App;
    let stack: DusStack;
    let vpcStack: VpcStack;

    beforeAll(() => {
        app = new cdk.App({
            context: rawCdkJson.context
        });

        stack = new DusStack(app, 'TestStack', {
            solutionID: rawCdkJson.context.solution_id,
            solutionName: rawCdkJson.context.solution_name,
            solutionVersion: rawCdkJson.context.solution_version,
            appNamespace: rawCdkJson.context.app_namespace,
            applicationTrademarkName: rawCdkJson.context.application_trademark_name
        });

        vpcStack = new VpcStack(stack, 'TestVpcStack');
        template = Template.fromStack(vpcStack);
    });

    it('should create VPC when deployed', () => {
        template.resourceCountIs('AWS::EC2::VPC', 1);
    });
});
