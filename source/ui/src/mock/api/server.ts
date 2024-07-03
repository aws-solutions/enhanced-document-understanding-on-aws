// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { handlers } from "./handler";
import { setupServer } from "msw/node";
export const server = setupServer(...handlers);