// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import KendraHighlightedText from '../components/SearchView/Kendra/KendraHighlightedText';

describe('KendraHighlightedText', () => {
    it('renders text without highlights', () => {
        render(<KendraHighlightedText textWithHighlights={{ Text: 'Hello world' }} />);
        expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    it('renders highlighted text', () => {
        const highlights = [
            { BeginOffset: 0, EndOffset: 5 },
            { BeginOffset: 6, EndOffset: 11 }
        ];
        render(<KendraHighlightedText textWithHighlights={{ Text: 'Hello world', Highlights: highlights }} />);
        expect(screen.getByText('Hello')).toHaveStyle('background-color: yellow');
        expect(screen.getByText('world')).toHaveStyle('background-color: yellow');
    });

    it('merges overlapping highlights', () => {
        const highlights = [
            { BeginOffset: 0, EndOffset: 5 },
            { BeginOffset: 4, EndOffset: 11 }
        ];
        render(<KendraHighlightedText textWithHighlights={{ Text: 'Hello world', Highlights: highlights }} />);
        expect(screen.getByText('Hello world')).toHaveStyle('background-color: yellow');
    });

    it('handles empty highlights array', () => {
        render(<KendraHighlightedText textWithHighlights={{ Text: 'Hello world', Highlights: [] }} />);
        expect(screen.getByText('Hello world')).toBeInTheDocument();
    });
});
