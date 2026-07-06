import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
	clamp,
	isWord,
	isBigWord,
	lineStart,
	lineEnd,
	lineLast,
	prevLineStart,
	nextLineStart,
	firstNonWhitespace,
	isBlankLine,
} from "../src/utils.ts";

describe("clamp", () => {
	it("returns value when within range", () => {
		assert.equal(clamp(5, 0, 10), 5);
	});

	it("clamps to min", () => {
		assert.equal(clamp(-3, 0, 10), 0);
	});

	it("clamps to max", () => {
		assert.equal(clamp(15, 0, 10), 10);
	});

	it("handles equal min and max", () => {
		assert.equal(clamp(5, 3, 3), 3);
	});
});

describe("isWord", () => {
	it("returns true for letters", () => {
		assert.equal(isWord("a"), true);
		assert.equal(isWord("Z"), true);
	});

	it("returns true for digits", () => {
		assert.equal(isWord("0"), true);
		assert.equal(isWord("9"), true);
	});

	it("returns true for underscore", () => {
		assert.equal(isWord("_"), true);
	});

	it("returns false for punctuation", () => {
		assert.equal(isWord("."), false);
		assert.equal(isWord("-"), false);
		assert.equal(isWord(" "), false);
	});

	it("returns false for undefined", () => {
		assert.equal(isWord(undefined), false);
	});

	it("returns false for empty string", () => {
		assert.equal(isWord(""), false);
	});
});

describe("isBigWord", () => {
	it("returns true for any non-whitespace", () => {
		assert.equal(isBigWord("a"), true);
		assert.equal(isBigWord("."), true);
		assert.equal(isBigWord("-"), true);
		assert.equal(isBigWord("("), true);
	});

	it("returns false for whitespace", () => {
		assert.equal(isBigWord(" "), false);
		assert.equal(isBigWord("\t"), false);
		assert.equal(isBigWord("\n"), false);
	});

	it("returns false for undefined/empty", () => {
		assert.equal(isBigWord(undefined), false);
		assert.equal(isBigWord(""), false);
	});
});

describe("lineStart", () => {
	it("returns 0 for single line text", () => {
		assert.equal(lineStart("hello", 3), 0);
	});

	it("returns 0 for offset 0", () => {
		assert.equal(lineStart("hello\nworld", 0), 0);
	});

	it("returns start of second line", () => {
		assert.equal(lineStart("hello\nworld", 8), 6);
	});

	it("returns start of third line", () => {
		assert.equal(lineStart("a\nbb\nccc", 6), 5);
	});

	it("handles offset at newline", () => {
		assert.equal(lineStart("hello\nworld", 5), 0);
	});

	it("handles offset beyond text length", () => {
		assert.equal(lineStart("hello\nworld", 100), 6);
	});

	it("returns 0 for negative offset", () => {
		assert.equal(lineStart("hello", -5), 0);
	});
});

describe("lineEnd", () => {
	it("returns text length for single line", () => {
		assert.equal(lineEnd("hello", 2), 5);
	});

	it("returns position of first newline", () => {
		assert.equal(lineEnd("hello\nworld", 2), 5);
	});

	it("returns end of second line", () => {
		assert.equal(lineEnd("hello\nworld", 8), 11);
	});

	it("returns newline position for offset at start of line", () => {
		assert.equal(lineEnd("hello\nworld\nfoo", 6), 11);
	});

	it("handles negative offset", () => {
		assert.equal(lineEnd("hello\nworld", -5), 5);
	});

	it("handles offset beyond text length", () => {
		assert.equal(lineEnd("hello", 100), 5);
	});
});

describe("lineLast", () => {
	it("returns last char position on non-empty line", () => {
		assert.equal(lineLast("hello", 2), 4);
	});

	it("returns last char before newline", () => {
		assert.equal(lineLast("hello\nworld", 2), 4);
	});

	it("returns start for empty line", () => {
		// "a\n\nb" - empty line at offset 2
		assert.equal(lineLast("a\n\nb", 2), 2);
	});

	it("returns last char on last line", () => {
		assert.equal(lineLast("hello\nworld", 8), 10);
	});
});

describe("prevLineStart", () => {
	it("returns undefined when on first line", () => {
		assert.equal(prevLineStart("hello\nworld", 3), undefined);
	});

	it("returns 0 when on second line", () => {
		assert.equal(prevLineStart("hello\nworld", 8), 0);
	});

	it("returns start of previous line", () => {
		assert.equal(prevLineStart("aa\nbb\ncc", 6), 3);
	});
});

describe("nextLineStart", () => {
	it("returns undefined when on last line", () => {
		assert.equal(nextLineStart("hello\nworld", 8), undefined);
	});

	it("returns start of next line", () => {
		assert.equal(nextLineStart("hello\nworld", 3), 6);
	});

	it("returns start of third line", () => {
		assert.equal(nextLineStart("aa\nbb\ncc", 4), 6);
	});
});

describe("firstNonWhitespace", () => {
	it("returns offset of first non-space char", () => {
		assert.equal(firstNonWhitespace("  hello", 0), 2);
	});

	it("returns 0 when no leading whitespace", () => {
		assert.equal(firstNonWhitespace("hello", 0), 0);
	});

	it("handles tabs", () => {
		assert.equal(firstNonWhitespace("\t\thello", 0), 2);
	});

	it("works on second line", () => {
		assert.equal(firstNonWhitespace("first\n  second", 8), 8);
	});

	it("returns line end for all-whitespace line", () => {
		assert.equal(firstNonWhitespace("   \nhello", 0), 3);
	});
});

describe("isBlankLine", () => {
	it("returns true for empty line", () => {
		assert.equal(isBlankLine("a\n\nb", 2), true);
	});

	it("returns true for whitespace-only line", () => {
		assert.equal(isBlankLine("a\n   \nb", 3), true);
	});

	it("returns false for line with content", () => {
		assert.equal(isBlankLine("hello\nworld", 0), false);
	});

	it("returns false for line with content (second line)", () => {
		assert.equal(isBlankLine("hello\nworld", 7), false);
	});
});
