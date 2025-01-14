// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from 'react';

export const EMPTY_PANEL_CONTENT = {
    header: 'No case selected',
    body: 'Select a case to see its documents.'
};

export const useSplitPanel = (selectedItems: any) => {
    const [splitPanelSize, setSplitPanelSize] = useState(500);
    const [splitPanelOpen, setSplitPanelOpen] = useState(false);
    const [hasManuallyClosedOnce, setHasManuallyClosedOnce] = useState(false);

    const onSplitPanelResize = ({ detail: { size } }: any) => {
        setSplitPanelSize(size);
    };

    const onSplitPanelToggle = ({ detail: { open } }: any) => {
        setSplitPanelOpen(open);

        if (!open) {
            setHasManuallyClosedOnce(true);
        }
    };

    useEffect(() => {
        if (selectedItems.length && !hasManuallyClosedOnce) {
            setSplitPanelOpen(true);
        }
    }, [selectedItems.length, hasManuallyClosedOnce]);

    return {
        splitPanelOpen,
        onSplitPanelToggle,
        splitPanelSize,
        onSplitPanelResize
    };
};
