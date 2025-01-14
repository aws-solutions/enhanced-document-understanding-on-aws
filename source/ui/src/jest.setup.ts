// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import '@testing-library/jest-dom';
import '@testing-library/react';
import '@testing-library/user-event';

import { server } from './mock/api/server';

const { TextDecoder, TextEncoder, ReadableStream } = require('node:util');
Object.defineProperties(globalThis, {
    TextDecoder: { value: TextDecoder },
    TextEncoder: { value: TextEncoder },
    ReadableStream: { value: ReadableStream }
});

import { fetch, Headers, Request, Response } from 'cross-fetch';

Object.defineProperties(globalThis, {
    fetch: { value: fetch, writable: true },
    Headers: { value: Headers },
    Request: { value: Request },
    Response: { value: Response }
});

if (typeof window.URL.createObjectURL === 'undefined') {
    window.URL.createObjectURL = jest.fn();
}

beforeAll(() => {
    server.listen();
});

afterAll(() => {
    server.restoreHandlers();
});

afterEach(() => server.resetHandlers());

afterAll(() => server.close());
