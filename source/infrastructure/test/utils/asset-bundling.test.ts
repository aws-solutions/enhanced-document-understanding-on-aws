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

import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3_asset from 'aws-cdk-lib/aws-s3-assets';
import * as path from 'path';
import * as commonutil from '../../lib/utils/common-utils';

import {
    AppAssetBundler,
    getCommandsForJavaDockerBundling,
    getCommandsForNodejsDockerBuild,
    getCommandsForPythonDockerBuild,
    getCommandsForReactjsDockerBuild
} from '../../lib/utils/asset-bundling';

import { Template } from 'aws-cdk-lib/assertions';
import {
    COMMERCIAL_REGION_LAMBDA_JAVA_RUNTIME,
    COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME,
    COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME
} from '../../lib/utils/constants';

describe('when bundling lambda assets', () => {
    it('should perform a successful python local build', () => {
        const assetOptions = AppAssetBundler.assetOptionsFactory.assetOptions(COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME);
        expect(
            assetOptions
                .options('../infrastructure/test/mock-lambda-func/python-lambda')
                .bundling!.local!.tryBundle('../infrastructure/test/mock-lambda-func/python-lambda', {
                    image: COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME.bundlingImage
                })
        ).toBeTruthy();
    });

    it('should perform a successful nodejs local build', () => {
        const assetOptions = AppAssetBundler.assetOptionsFactory.assetOptions(COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME);
        expect(
            assetOptions
                .options('../infrastructure/test/mock-lambda-func/node-lambda')
                .bundling!.local!.tryBundle('../infrastructure/test/mock-lambda-func/node-lambda', {
                    image: COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME.bundlingImage
                })
        ).toBeTruthy();
    });

    it('should perform a successful java local build', () => {
        const assetOptions = AppAssetBundler.assetOptionsFactory.assetOptions(COMMERCIAL_REGION_LAMBDA_JAVA_RUNTIME);
        expect(
            assetOptions
                .options('../infrastructure/test/mock-lambda-func/java-lambda')
                .bundling!.local!.tryBundle('../infrastructure/test/mock-lambda-func/java-lambda', {
                    image: COMMERCIAL_REGION_LAMBDA_JAVA_RUNTIME.bundlingImage
                })
        ).toBeTruthy();
    });

    it('should throw an error if the runtime is not configured', () => {
        const runtime = lambda.Runtime.DOTNET_6;
        const output = () => {
            AppAssetBundler.assetOptionsFactory.assetOptions(runtime);
        };
        expect(output).toThrow(Error);
        expect(output).toThrow(`Provided runtime ${runtime} is not configured with this factory`);
    });
});

describe('when local bundling is successful lambda assets', () => {
    let localBundlingSpy: jest.SpyInstance;

    beforeEach(() => {
        localBundlingSpy = jest.spyOn(commonutil, 'localBundling');
    });

    it('should perform a succesful python local build', () => {
        const stack = new cdk.Stack();
        const runtime = COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME;
        new lambda.Function(stack, 'TestFunction', {
            code: lambda.Code.fromAsset(
                '../infrastructure/test/mock-lambda-func/python-lambda',
                AppAssetBundler.assetOptionsFactory
                    .assetOptions(runtime)
                    .options('../infrastructure/test/mock-lambda-func/python-lambda')
            ),
            runtime: runtime,
            handler: 'function.handler'
        });

        try {
            Template.fromStack(stack);
        } catch (error) {
            fail(`An error occurred, error is: ${error}`);
        }
        expect(localBundlingSpy).toHaveBeenCalledTimes(1);
        expect(localBundlingSpy).toHaveBeenCalledWith(
            expect.stringContaining(
                [
                    `cd ${path.resolve('../infrastructure/test/mock-lambda-func/python-lambda')}`,
                    'rm -fr .venv*',
                    'python3 -m venv .venv',
                    '. .venv/bin/activate',
                    'pip3 install -r requirements.txt -t '
                ].join(' && ')
            ),
            path.resolve('../infrastructure/test/mock-lambda-func/python-lambda'),
            expect.any(String)
        );
    });

    it('should perform a succesful nodejs local build', () => {
        const runtime = COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME;
        const stack = new cdk.Stack();
        new lambda.Function(stack, 'TestFunction', {
            code: lambda.Code.fromAsset(
                '../infrastructure/test/mock-lambda-func/node-lambda',
                AppAssetBundler.assetOptionsFactory
                    .assetOptions(runtime)
                    .options('../infrastructure/test/mock-lambda-func/node-lambda')
            ),
            runtime: runtime,
            handler: 'function.handler'
        });

        try {
            Template.fromStack(stack);
        } catch (error) {
            fail(`An error occurred, error is: ${error}`);
        }
        expect(localBundlingSpy).toHaveBeenCalledTimes(1);
        expect(localBundlingSpy).toHaveBeenLastCalledWith(
            expect.stringContaining(
                [
                    'cd ../infrastructure/test/mock-lambda-func/node-lambda',
                    'rm -fr node_modules',
                    'npm ci --omit=dev',
                    `rm -fr `
                ].join(' && ')
            ),
            '../infrastructure/test/mock-lambda-func/node-lambda',
            expect.any(String)
        );
    });

    it('should perform a successful reactjs local build', () => {
        const stack = new cdk.Stack();
        new s3_asset.Asset(stack, 'UIAsset', {
            path: path.join(__dirname, '../../../ui'),
            ...AppAssetBundler.assetOptionsFactory.assetOptions('Reactjs').options(path.join(__dirname, '../../../ui'))
        });

        try {
            Template.fromStack(stack);
        } catch (error) {
            fail(`An error occurred, error is: ${error}`);
        }
        expect(localBundlingSpy).toHaveBeenCalledTimes(1);
    });

    it('should perform a successful java local build', () => {
        const runtime = COMMERCIAL_REGION_LAMBDA_JAVA_RUNTIME;
        const stack = new cdk.Stack();
        new lambda.Function(stack, 'TestFunction', {
            code: lambda.Code.fromAsset(
                '../infrastructure/test/mock-lambda-func/java-lambda',
                AppAssetBundler.assetOptionsFactory
                    .assetOptions(runtime)
                    .options('../infrastructure/test/mock-lambda-func/java-lambda')
            ),
            runtime: runtime,
            handler: 'example.Handler'
        });

        try {
            Template.fromStack(stack);
        } catch (error) {
            fail(`An error occurred, error is: ${error}`);
        }
        expect(localBundlingSpy).toHaveBeenCalledTimes(1);
        expect(localBundlingSpy).toHaveBeenLastCalledWith(
            expect.stringContaining(
                [
                    'cd ../infrastructure/test/mock-lambda-func/java-lambda',
                    'rm -fr target',
                    'echo "Trying local bundling of assets"',
                    'mvn clean package --quiet --no-transfer-progress'
                ].join(' && ')
            ),
            '../infrastructure/test/mock-lambda-func/java-lambda/dist/',
            expect.any(String)
        );
    });

    afterEach(() => {
        jest.resetAllMocks();
    });
});

describe('when local bundling of assets is not successful', () => {
    it('should create a string array of commands for a successful docker python build', () => {
        expect(
            getCommandsForPythonDockerBuild('../infrastructure/test/mock-lambda-func/python-lambda', 'mock-lambda')
        ).toEqual([
            'bash',
            '-c',
            [
                'echo "local bundling failed for mock-lambda and hence building with Docker image"',
                'mkdir -p ../infrastructure/test/mock-lambda-func/python-lambda/',
                'rm -fr .venv*',
                'cp -au /asset-input/* ../infrastructure/test/mock-lambda-func/python-lambda/',
                'pip3 install -qr requirements.txt -t ../infrastructure/test/mock-lambda-func/python-lambda/',
                'rm -fr ../infrastructure/test/mock-lambda-func/python-lambda/.coverage'
            ].join(' && ')
        ]);
    });

    it('should create a string array of commands for a successful docker nodejs build', () => {
        expect(
            getCommandsForNodejsDockerBuild('../infrastructure/test/mock-lambda-func/node-lambda', 'mock-lambda')
        ).toEqual([
            'bash',
            '-c',
            [
                'echo "local bundling failed for mock-lambda and hence building with Docker image"',
                'rm -fr /asset-input/node_modules',
                'npm ci --omit=dev',
                'mkdir -p ../infrastructure/test/mock-lambda-func/node-lambda/',
                'cp -au /asset-input/* ../infrastructure/test/mock-lambda-func/node-lambda/',
                'rm -fr ../infrastructure/test/mock-lambda-func/node-lambda/.coverage'
            ].join(' && ')
        ]);
    });

    it('should create a string array of commands for a successful docker reactjs build', () => {
        expect(getCommandsForReactjsDockerBuild('../infrastructure/test/mock-ui', 'ui')).toEqual([
            'bash',
            '-c',
            [
                'echo "local bundling failed for ui and hence building with Docker image"',
                'npm install',
                'npm run build',
                'rm -fr /asset-input/node_modules',
                'npm ci --omit=dev',
                'mkdir -p ../infrastructure/test/mock-ui/',
                'cp -au /asset-input/* ../infrastructure/test/mock-ui/',
                'rm -fr ../infrastructure/test/mock-ui/.coverage'
            ].join(' && ')
        ]);
    });

    it('should create a string array of commands for a succesful docker lambda java build', () => {
        expect(
            getCommandsForJavaDockerBundling('../infrastructure/test/mock-lambda-func/java-lambda', 'mock-lambda')
        ).toEqual([
            '/bin/sh',
            '-c',
            [
                `echo "local bundling failed for mock-lambda and hence building with Docker image"`,
                `mkdir -p ../infrastructure/test/mock-lambda-func/java-lambda/`,
                'mvn clean package --quiet --no-transfer-progress -DskipTests',
                `cp -au /asset-input/dist/*.jar ../infrastructure/test/mock-lambda-func/java-lambda/`
            ].join(' && ')
        ]);
    });
});

describe('when local bundling fails', () => {
    let localBundlingMock: jest.SpyInstance;

    beforeEach(() => {
        localBundlingMock = jest.spyOn(commonutil, 'localBundling').mockReturnValue(false);
    });

    it('should perform docker python bundling for python runtime', () => {
        const stack = new cdk.Stack();
        const runtime = COMMERCIAL_REGION_LAMBDA_PYTHON_RUNTIME;
        new lambda.Function(stack, 'TestFunction', {
            code: lambda.Code.fromAsset(
                '../infrastructure/test/mock-lambda-func/python-lambda',
                AppAssetBundler.assetOptionsFactory
                    .assetOptions(runtime)
                    .options('../infrastructure/test/mock-lambda-func/python-lambda')
            ),
            runtime: runtime,
            handler: 'function.handler'
        });

        try {
            Template.fromStack(stack);
        } catch (error) {
            fail(`An error occurred, error is: ${error}`);
        }
        expect(localBundlingMock).toHaveBeenCalledTimes(1);
    });

    it('should perform docker nodejs bundling for node runtime', () => {
        const stack = new cdk.Stack();
        const runtime = COMMERCIAL_REGION_LAMBDA_NODE_RUNTIME;
        new lambda.Function(stack, 'TestFunction', {
            code: lambda.Code.fromAsset(
                '../infrastructure/test/mock-lambda-func/node-lambda',
                AppAssetBundler.assetOptionsFactory
                    .assetOptions(runtime)
                    .options('../infrastructure/test/mock-lambda-func/node-lambda')
            ),
            runtime: runtime,
            handler: 'function.handler'
        });

        Template.fromStack(stack);
        expect(localBundlingMock).toHaveBeenCalledTimes(1);
    });

    it('should perform docker java bundling for java runtime', () => {
        const stack = new cdk.Stack();
        const runtime = COMMERCIAL_REGION_LAMBDA_JAVA_RUNTIME;
        new lambda.Function(stack, 'TestFunction', {
            code: lambda.Code.fromAsset(
                '../infrastructure/test/mock-lambda-func/java-lambda',
                AppAssetBundler.assetOptionsFactory
                    .assetOptions(runtime)
                    .options('../infrastructure/test/mock-lambda-func/java-lambda')
            ),
            runtime: runtime,
            handler: 'example.Handler'
        });

        Template.fromStack(stack);
        expect(localBundlingMock).toHaveBeenCalledTimes(1);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });
});
