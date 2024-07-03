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
import { FileSize } from '../components/FileUpload/interfaces';
import { formatFileSize } from '../components/FileUpload/internal';

describe('internal', () => {
    it('should convert bytes to file size', () => {
        expect(formatFileSize(5, { size: FileSize.BYTES })).toEqual('5.00 bytes');
        // Decimal
        expect(formatFileSize(5000, { size: FileSize.KB })).toEqual('5.00 KB');
        expect(formatFileSize(5000000, { size: FileSize.MB })).toEqual('5.00 MB');
        expect(formatFileSize(5000000000, { size: FileSize.GB })).toEqual('5.00 GB');
        // Binary
        expect(formatFileSize(5120, { size: FileSize.KIB })).toEqual('5.00 KiB');
        expect(formatFileSize(5243000, { size: FileSize.MIB })).toEqual('5.00 MiB');
        expect(formatFileSize(5369000000, { size: FileSize.GIB })).toEqual('5.00 GiB');
    });
});
