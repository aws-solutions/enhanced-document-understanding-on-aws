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
