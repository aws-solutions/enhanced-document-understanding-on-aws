/**********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the License). You may not use this file except in compliance      *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

import { Button, ButtonProps, SpaceBetween, Spinner } from '@cloudscape-design/components';
import { PropsWithChildren, useState } from 'react';
import { useStartJobMutation } from '../../store/reducers/caseApiSlice';

export interface StartJobButtonProps extends PropsWithChildren {
    caseId: string;
    variant?: ButtonProps.Variant;
    disabled: boolean;
}
export default function StartJobButton(props: StartJobButtonProps) {
    const [statusEnabled, setStatusEnabled] = useState(false);
    const [startJob] = useStartJobMutation();

    const handleClick = async () => {
        setStatusEnabled(true);
        await startJob({
            caseId: props.caseId
        }).unwrap();
        setStatusEnabled(false);
    };
    return (
        <>
            <SpaceBetween size="xs" direction="horizontal">
                {statusEnabled && <Spinner size="big" />}
                <Button disabled={props.disabled} variant={props.variant ?? 'primary'} onClick={handleClick}>
                    Start Job
                </Button>
            </SpaceBetween>
        </>
    );
}
