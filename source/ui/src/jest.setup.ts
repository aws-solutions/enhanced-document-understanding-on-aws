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
