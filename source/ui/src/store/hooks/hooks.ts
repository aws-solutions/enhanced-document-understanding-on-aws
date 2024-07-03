// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { RootState } from "../reducers/rootReducer";
import { AppDispatch } from "../store";

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
