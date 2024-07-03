/**********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the 'License'). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

import StatusIndicator from '@cloudscape-design/components/status-indicator';

/**
* Enables conditional rendering of StatusIndicator whenever there are error/loading statuses.
* Returns null for 'success' to enable rendering content fetched from the API.
*
* @param status - the status that is to be rendered as a part of StatusIndicator
* @param showStatusLabel - boolean flag to enable message rendering along with the status
* @param showSuccessMessage - boolean flag to show if the success state has to be rendered.
    This can be set to false for rendering user content.
* @param errorMessage - error message that should be displayed when the currentStatus is in error state
*/
export const renderStatus = function (
    status: any,
    showStatusLabel: any,
    showSuccessMessage: any,
    errorMessage: any,
    successMessage: any
) {
    let statusLabel = '';
    let statusIndicatorComponent = null;
    errorMessage = errorMessage ? errorMessage : 'An error occurred.';

    if (status === 'error') {
        statusLabel = showStatusLabel ? errorMessage : '';
        statusIndicatorComponent = <StatusIndicator type={status}>{statusLabel}</StatusIndicator>;
    } else if (status === 'loading') {
        statusLabel = showStatusLabel ? 'Loading' : '';
        statusIndicatorComponent = <StatusIndicator type={status}>{statusLabel}</StatusIndicator>;
    } else if (status === 'success' && showSuccessMessage) {
        successMessage = successMessage ? successMessage : 'Success';
        statusLabel = showStatusLabel ? successMessage : '';
        statusIndicatorComponent = <StatusIndicator type={status}>{statusLabel}</StatusIndicator>;
    }
    return statusIndicatorComponent;
};

/**
 * Enables testing for successful status when rendering html for conditional rendering
 *
 * @param status - the status that is to be rendered as a part of StatusIndicator
 */
export const isStatusSuccess = function (status: any) {
    let isSuccess = status === 'success' ? true : false;
    return isSuccess;
};
