# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

=======

## [1.1.1] - 2024-07-18

### Security

- Updated python packages to patch vulnerabilities

## [1.1.0] - 2024-07-03

### Updated

- Added OpenSearch support
- Backend bulk documents upload
- Pagination on loading cases page

### Security

- Updated node modules to patch vulnerabilities

## [1.0.12] - 2024-06-25

### Security

- Updated node modules to patch vulnerabilities

## [1.0.11] - 2024-06-17

### Security

- Updated node modules to patch vulnerabilities

## [1.0.10] - 2024-05-30

### Security

- Updated node modules to patch vulnerabilities

## [1.0.9] - 2024-05-16

### Update

- Updated java runtime libraries to patch vulnerabilities

## [1.0.8] - 2024-05-14

### Fixed

- CSP response header name length longer than supported, causing stack failure in ap-southeast-1 and ap-south-east-2

## [1.0.7] - 2024-05-13

### Security

- Updated node modules to patch vulnerabilities

## [1.0.6] - 2024-03-27

### Security

- Updated node modules to patch vulnerabilities

### Fixed

- Fixed a bug in the entity detection code which caused failures on an edge case with repeating words ([issue 34](https://github.com/aws-solutions/enhanced-document-understanding-on-aws/issues/34))

### Updated

- Failure on a single entity now does not cause the whole workflow to fail, instead logging an error message and continuing

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
