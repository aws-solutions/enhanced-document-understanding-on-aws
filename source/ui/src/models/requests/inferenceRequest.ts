
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {InferenceName} from '../../utils/constants';
import { BaseRequest } from './baseRequest';

export interface InferenceRequest extends BaseRequest{
 
    inferenceType?: InferenceName
}