// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { UseCollectionOptions, UseCollectionResult } from './interfaces';
export declare function useCollection<T>(
    allItems: ReadonlyArray<T>,
    options: UseCollectionOptions<T>
): UseCollectionResult<T>;
