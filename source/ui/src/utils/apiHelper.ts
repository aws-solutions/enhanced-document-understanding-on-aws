// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Auth } from "aws-amplify";

let runtimeConfig: any | undefined;

/**
 *
 */
export async function generateToken() {
    try {
        const user = await Auth.currentAuthenticatedUser();
        const token = user.getSignInUserSession().getIdToken().getJwtToken();
        return token;
    } catch (error) {
        console.error('error REST API:', error);
    }
}

/**
 * Gets token from cognito
 */

export const getRuntimeConfig = async () => {
    if(runtimeConfig === undefined) {
        runtimeConfig = (await fetch("/runtimeConfig.json")).json();
    }
    return await runtimeConfig;
};

export async function signOut() {
    await Auth.signOut();
}
