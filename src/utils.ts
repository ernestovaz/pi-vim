/**
 * Re-exports pure utility functions from index.ts for unit testing.
 *
 * These functions will eventually be extracted into their own modules
 * during refactoring. For now, we duplicate the pure logic here so
 * we can lock in behavior with tests before restructuring.
 */

// --- Utility ---

export function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

// --- Character classification ---

export function isWord(char: string | undefined): boolean {
	return !!char && /[A-Za-z0-9_]/.test(char);
}

export function isBigWord(char: string | undefined): boolean {
	return !!char && !/\s/.test(char);
}

// --- Line geometry ---

export function lineStart(text: string, offset: number): number {
	if (offset <= 0) return 0;
	const bounded = Math.min(offset, text.length);
	const index = text.lastIndexOf("\n", bounded - 1);
	return index === -1 ? 0 : index + 1;
}

export function lineEnd(text: string, offset: number): number {
	const bounded = Math.min(Math.max(offset, 0), text.length);
	const index = text.indexOf("\n", bounded);
	return index === -1 ? text.length : index;
}

export function lineLast(text: string, offset: number): number {
	const start = lineStart(text, offset);
	const end = lineEnd(text, offset);
	return end > start ? end - 1 : start;
}

export function prevLineStart(text: string, offset: number): number | undefined {
	const start = lineStart(text, offset);
	if (start === 0) return undefined;
	return lineStart(text, start - 1);
}

export function nextLineStart(text: string, offset: number): number | undefined {
	const end = lineEnd(text, offset);
	if (end >= text.length) return undefined;
	return end + 1;
}

export function firstNonWhitespace(text: string, offset: number): number {
	const start = lineStart(text, offset);
	const end = lineEnd(text, offset);
	let pos = start;
	while (pos < end && /\s/.test(text[pos] ?? "")) pos++;
	return pos;
}

export function isBlankLine(text: string, offset: number): boolean {
	const start = lineStart(text, offset);
	const end = lineEnd(text, offset);
	return /^\s*$/.test(text.slice(start, end));
}

// --- Cursor movement ---

export function moveUp(text: string, offset: number): number {
	const currentStart = lineStart(text, offset);
	const targetStart = prevLineStart(text, offset);
	if (targetStart === undefined) return offset;
	const targetLast = lineLast(text, targetStart);
	const col = offset - currentStart;
	return Math.min(targetStart + col, targetLast);
}

export function moveDown(text: string, offset: number): number {
	const currentStart = lineStart(text, offset);
	const targetStart = nextLineStart(text, offset);
	if (targetStart === undefined) return offset;
	const targetLast = lineLast(text, targetStart);
	const col = offset - currentStart;
	return Math.min(targetStart + col, targetLast);
}

// --- Word motions ---

export function nextWordStart(text: string, offset: number, big: boolean): number {
	const match = big ? isBigWord : isWord;
	let pos = offset;

	if (pos < text.length && match(text[pos])) {
		while (pos < text.length && match(text[pos])) pos++;
	}
	while (pos < text.length && !match(text[pos])) pos++;
	return pos;
}

export function prevWordStart(text: string, offset: number, big: boolean): number {
	const match = big ? isBigWord : isWord;
	let pos = offset;

	while (pos > 0 && !match(text[pos - 1])) pos--;
	while (pos > 0 && match(text[pos - 1])) pos--;
	return pos;
}

export function wordEnd(text: string, offset: number, big: boolean): number {
	if (text.length === 0) return 0;

	const match = big ? isBigWord : isWord;
	let pos = offset;
	if (pos >= text.length) pos = text.length - 1;

	if (match(text[pos]) && (pos + 1 >= text.length || !match(text[pos + 1]))) {
		pos++;
	}

	while (pos < text.length && !match(text[pos])) pos++;
	if (pos >= text.length) return text.length - 1;

	while (pos + 1 < text.length && match(text[pos + 1])) pos++;
	return pos;
}

// --- Paragraph motions ---

export function paragraphForward(text: string, offset: number): number {
	let pos = lineEnd(text, offset);
	while (pos < text.length) {
		pos += 1;
		if (pos >= text.length) return lineStart(text, text.length);
		if (!isBlankLine(text, pos) && (pos === 0 || isBlankLine(text, pos - 1))) return pos;
		pos = lineEnd(text, pos);
	}
	return offset;
}

export function paragraphBackward(text: string, offset: number): number {
	let pos = lineStart(text, offset);
	while (pos > 0) {
		pos = lineStart(text, pos - 1);
		if (!isBlankLine(text, pos) && (pos === 0 || isBlankLine(text, pos - 1))) return pos;
	}
	return 0;
}

// --- Cursor / offset conversion ---

export function totalLength(lines: string[]): number {
	if (lines.length === 0) return 0;
	return lines.reduce((sum, line) => sum + line.length, 0) + lines.length - 1;
}

export type Cursor = { line: number; col: number };

export function cursorToOffset(lines: string[], cursor: Cursor): number {
	let offset = 0;
	for (let i = 0; i < cursor.line; i++) {
		offset += (lines[i] ?? "").length + 1;
	}
	return offset + cursor.col;
}

export function offsetToCursor(lines: string[], offset: number): Cursor {
	const boundedOffset = clamp(offset, 0, totalLength(lines));
	let remaining = boundedOffset;

	for (let line = 0; line < lines.length; line++) {
		const current = lines[line] ?? "";
		if (remaining <= current.length) {
			return { line, col: remaining };
		}
		remaining -= current.length;
		if (line < lines.length - 1) remaining -= 1;
	}

	const lastLine = Math.max(0, lines.length - 1);
	return { line: lastLine, col: (lines[lastLine] ?? "").length };
}

// --- Text manipulation ---

export function replaceRange(text: string, start: number, end: number, replacement = ""): string {
	return text.slice(0, start) + replacement + text.slice(end);
}

// --- Grapheme utilities ---

const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

export function nextGraphemeOffset(text: string, offset: number): number {
	if (offset >= text.length) return offset;
	for (const segment of graphemeSegmenter.segment(text.slice(offset))) {
		return offset + segment.segment.length;
	}
	return Math.min(offset + 1, text.length);
}

export function prevGraphemeOffset(text: string, offset: number): number {
	if (offset <= 0) return 0;
	let previous = 0;
	for (const segment of graphemeSegmenter.segment(text.slice(0, offset))) {
		previous = segment.index;
	}
	return previous;
}

export function printableSingleGrapheme(data: string): string | undefined {
	if (!data) return undefined;
	let result: string | undefined;
	let count = 0;
	for (const segment of graphemeSegmenter.segment(data)) {
		result = segment.segment;
		count++;
		if (count > 1) return undefined;
	}
	if (!result || /[\p{Cc}\p{Cs}]/u.test(result)) return undefined;
	return result;
}

// --- Formatting ---

export function formatTokens(count: number): string {
	if (count < 1000) return count.toString();
	if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
	if (count < 1000000) return `${Math.round(count / 1000)}k`;
	if (count < 10000000) return `${(count / 1000000).toFixed(1)}M`;
	return `${Math.round(count / 1000000)}M`;
}

export function sanitizeStatusText(text: string): string {
	return text
		.replace(/[\r\n\t]/g, " ")
		.replace(/ +/g, " ")
		.trim();
}
