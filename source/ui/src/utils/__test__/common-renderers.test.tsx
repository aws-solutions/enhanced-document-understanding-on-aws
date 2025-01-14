// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { StatusIndicator } from '@cloudscape-design/components';
import { isStatusSuccess, renderStatus } from '../common-renderers';

describe('Rendering StatusIndicators', () => {
    test('Returns error StatusIndicator when error state is passed', async () => {
        const res = renderStatus('error', 'mock-label', 'success', 'mock-error-message', 'mock-success-message');
        expect(res).toEqual(<StatusIndicator type="error">mock-error-message</StatusIndicator>);
    });

    test('Returns error StatusIndicator when error state is passed with default error message', async () => {
        const res = renderStatus('error', 'mock-label', 'success', null, null);
        expect(res).toEqual(<StatusIndicator type="error">An error occurred.</StatusIndicator>);
    });

    test('Returns loading StatusIndicator when loading state is passed', async () => {
        const res = renderStatus('loading', 'mock-label', 'success', 'mock-error-message', 'mock-success-message');
        expect(res).toEqual(<StatusIndicator type="loading">Loading</StatusIndicator>);
    });

    test('Returns success StatusIndicator when success state is passed', async () => {
        const res = renderStatus('success', 'mock-label', 'success', 'mock-error-message', 'mock-success-message');
        expect(res).toEqual(<StatusIndicator type="success">mock-success-message</StatusIndicator>);
    });

    test('Returns success StatusIndicator when success state is passed with default success message', async () => {
        const res = renderStatus('success', 'mock-label', 'success', null, null);
        expect(res).toEqual(<StatusIndicator type="success">Success</StatusIndicator>);
    });
});

describe('Check isStatusSuccess', () => {
    beforeEach(() => {});

    test('Returns false when error state is passed', async () => {
        expect(isStatusSuccess('error')).toEqual(false);
    });

    test('Returns false when error state is passed', async () => {
        expect(isStatusSuccess('loading')).toEqual(false);
    });

    test('Returns false when undefined is passed', async () => {
        expect(isStatusSuccess(undefined)).toEqual(false);
    });

    test('Returns true when success state is passed', async () => {
        expect(isStatusSuccess('success')).toEqual(true);
    });
});
