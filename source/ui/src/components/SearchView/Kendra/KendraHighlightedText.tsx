// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Fragment } from 'react';

function unionSortedHighlights(highlights: any) {
    if (!highlights) {
        return highlights;
    }

    let prev = highlights[0];
    const unioned = [prev];
    for (let i = 1; i < highlights.length; i++) {
        const h = highlights[i];
        if (prev.EndOffset >= h.BeginOffset) {
            // union
            prev.EndOffset = Math.max(h.EndOffset, prev.EndOffset);
            prev.TopAnswer = prev.TopAnswer || h.TopAnswer;
        } else {
            // disjoint, add to results
            unioned.push(h);
            prev = h;
        }
    }

    return unioned;
}

export default function KendraHighlightedText({ textWithHighlights }: any) {
    if (!textWithHighlights) return null;

    const { Text: text, Highlights: highlights } = textWithHighlights;

    try {
        if (!highlights || !highlights.length) {
            return <span>{text}</span>;
        }

        const sortedHighlights = unionSortedHighlights(
            [...highlights].sort((a: any, b: any) => a.BeginOffset - b.BeginOffset)
        );

        const lastHighlight = sortedHighlights[sortedHighlights.length - 1];

        return (
            <span>
                {sortedHighlights.map((highlight: any, idx: any) => (
                    <Fragment key={JSON.stringify(highlight)}>
                        {text.substring(idx === 0 ? 0 : sortedHighlights[idx - 1].EndOffset, highlight.BeginOffset)}
                        <mark>{text.substring(highlight.BeginOffset, highlight.EndOffset)}</mark>
                    </Fragment>
                ))}
                {text.substring(lastHighlight ? lastHighlight.EndOffset : 0)}
            </span>
        );
    } catch (error) {
        console.error('Error occurred while highlighting:', error);
        return <span>{text}</span>;
    }
}
