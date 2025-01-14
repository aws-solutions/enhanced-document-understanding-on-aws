// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
