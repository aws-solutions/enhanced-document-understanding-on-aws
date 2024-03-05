# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.5] - 2024-03-05

### Updated

- Library upgrades to address security vulnerability related to `node-ip` [CVE-2023-42282](https://github.com/advisories/GHSA-78xj-cgh5-2h22)
- Add dependency between Amazon S3 bucket creation and S3 bucket policy to reduce failures with `Fn::GetAtt` when retrieving bucket arn to create bucket policy

## [1.0.4] - 2024-01-11

### Updated

- AWS CDK and SDK upgrades
- Fix an intermittent issue in AWS CloudFormation by setting explicit dependencies between resources

## [1.0.3] - 2023-12-07

### Updated

- Library upgrades to address security vulnerabilities.
- Fix an issue with sample workflow configurations where `textract` workflow was missing before any `entity` based detection workflow.
- Upgrade AWS Lambda runtimes to Python 3.12, Nodejs 20, and Java 21.
- Update AWS SDK and AWS CDK versions.

## [1.0.2] - 2023-11-09

### Updated

- AWS CDK and SDK version updates
- Library upgrades to address security vulnerabilities.

## [1.0.1] - 2023-10-18

### Updated

- Library upgrades to address security vulnerabilities

## [1.0.0] - 2023-08-30

### Added

- Initial Release
