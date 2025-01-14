// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React, { ReactNode } from 'react';

import { ChangeDetail, DismissDetail, FileMetadata, FileSize, FireEvent } from './interfaces';

export const convertBytesTo = (bytes: number, unit: FileSize): number => {
    switch (unit) {
        // Decimal
        case FileSize.KB: {
            return bytes / 1000;
        }
        case FileSize.MB: {
            return bytes / 1000 ** 2;
        }
        case FileSize.GB: {
            return bytes / 1000 ** 3;
        }
        // Binary
        case FileSize.KIB: {
            return bytes / 1024;
        }
        case FileSize.MIB: {
            return bytes / 1024 ** 2;
        }
        case FileSize.GIB: {
            return bytes / 1024 ** 3;
        }
        // Default
        case FileSize.BYTES:
        default: {
            return bytes;
        }
    }
};

export const defaultFileMetadata: FileMetadata = {
    name: true,
    type: false,
    size: FileSize.BYTES,
    lastModified: false,
    thumbnail: false
};

export function getBaseMetadata(metadata?: FileMetadata): FileMetadata {
    const baseMetadata: FileMetadata = Object.create(defaultFileMetadata);
    if (metadata) {
        Object.assign(baseMetadata, metadata);
    }
    return baseMetadata;
}

export function getBaseButtonText(multiple: boolean, buttonText?: ReactNode): ReactNode {
    return buttonText || `Choose file${multiple ? 's' : ''}`;
}

export function isImageFile(file: File): boolean {
    return !!file.type && file.type.split('/')[0] === 'image';
}

export function formatFileSize(size: number, metadata: FileMetadata): React.ReactNode {
    if (!metadata.size || !size) {
        return null;
    }
    const convertedSize = convertBytesTo(size, metadata.size).toFixed(2);
    return `${convertedSize} ${metadata.size}`;
}

function getBrowserLocale() {
    return new Intl.DateTimeFormat().resolvedOptions().locale;
}

function checkLocale(locale: string | null | undefined): string {
    if (!locale || locale === '') {
        return '';
    }
    locale = locale && locale.replace(/^([a-z]{2})_/, '$1-');
    if (locale && !/^[a-z]{2}(-[A-Z]{2})?$/.exec(locale)) {
        locale = '';
    }
    return locale;
}

export function mergeLocales(locale: string, fullLocale: string): string {
    const isShort = locale.length === 2;
    if (isShort && fullLocale.indexOf(locale) === 0) {
        return fullLocale;
    }
    return locale;
}

export function normalizeLocale(locale: string | undefined): string {
    locale = checkLocale(locale);
    const browserLocale = getBrowserLocale();
    if (locale) {
        return mergeLocales(locale, browserLocale);
    }
    let htmlLocale;
    const html = document ? document.querySelector('html') : null;
    if (html) {
        htmlLocale = checkLocale(html.getAttribute('lang'));
    }
    if (htmlLocale) {
        return mergeLocales(htmlLocale, browserLocale);
    }
    return browserLocale;
}

export function formatFileLastModified(rawDate: number, metadata: FileMetadata): React.ReactNode {
    if (!metadata.lastModified || !rawDate) {
        return null;
    }
    const date = new Date(rawDate);
    const locale = normalizeLocale(metadata.lastModifiedLocale);
    const dateStr = date.toLocaleDateString(locale, {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
    });
    const timeStr = date.toLocaleTimeString(locale, {
        hour: 'numeric',
        minute: 'numeric',
        timeZoneName: 'short',
        hour12: false
    });
    return `${dateStr} ${timeStr}`;
}

export class CustomEvent<T> {
    detail: T;
    cancelable = false;
    defaultPrevented = false;
    cancelBubble = false;
    constructor(detail: T) {
        this.detail = detail;
    }
    preventDefault(): void {
        this.defaultPrevented = true;
    }
    stopPropagation(): void {
        this.cancelBubble = true;
    }
}

export const fireChangeEvent: FireEvent<ChangeDetail> = (handler: CallableFunction, detail: ChangeDetail): void =>
    handler(new CustomEvent<ChangeDetail>(detail));

export const fireDismissEvent: FireEvent<DismissDetail> = (handler: CallableFunction, detail: DismissDetail): void =>
    handler(new CustomEvent<DismissDetail>(detail));
