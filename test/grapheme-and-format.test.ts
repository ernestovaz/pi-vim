import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
	nextGraphemeOffset,
	prevGraphemeOffset,
	printableSingleGrapheme,
	formatTokens,
	sanitizeStatusText,
} from "../src/utils.ts";

describe("nextGraphemeOffset", () => {
	it("advances by one ASCII character", () => {
		assert.equal(nextGraphemeOffset("hello", 0), 1);
		assert.equal(nextGraphemeOffset("hello", 2), 3);
	});

	it("handles multi-byte UTF-8 characters", () => {
		// "café" - 'é' is 2 bytes in UTF-16
		assert.equal(nextGraphemeOffset("café", 3), 4);
	});

	it("handles emoji (surrogate pairs)", () => {
		// "a😀b" - emoji at index 1, length 2
		const text = "a😀b";
		assert.equal(nextGraphemeOffset(text, 1), 3);
	});

	it("returns same offset when at end", () => {
		assert.equal(nextGraphemeOffset("hi", 2), 2);
	});

	it("returns same offset when beyond end", () => {
		assert.equal(nextGraphemeOffset("hi", 5), 5);
	});
});

describe("prevGraphemeOffset", () => {
	it("moves back by one ASCII character", () => {
		assert.equal(prevGraphemeOffset("hello", 3), 2);
	});

	it("returns 0 when at start", () => {
		assert.equal(prevGraphemeOffset("hello", 0), 0);
	});

	it("handles emoji (surrogate pairs)", () => {
		const text = "a😀b";
		// from 'b' at index 3, prev grapheme starts at 1
		assert.equal(prevGraphemeOffset(text, 3), 1);
	});

	it("handles offset 1", () => {
		assert.equal(prevGraphemeOffset("hello", 1), 0);
	});
});

describe("printableSingleGrapheme", () => {
	it("returns single printable character", () => {
		assert.equal(printableSingleGrapheme("a"), "a");
		assert.equal(printableSingleGrapheme("Z"), "Z");
		assert.equal(printableSingleGrapheme("5"), "5");
	});

	it("returns emoji as single grapheme", () => {
		assert.equal(printableSingleGrapheme("😀"), "😀");
	});

	it("returns undefined for empty string", () => {
		assert.equal(printableSingleGrapheme(""), undefined);
	});

	it("returns undefined for multiple graphemes", () => {
		assert.equal(printableSingleGrapheme("ab"), undefined);
		assert.equal(printableSingleGrapheme("hi"), undefined);
	});

	it("returns undefined for control characters", () => {
		assert.equal(printableSingleGrapheme("\x00"), undefined);
		assert.equal(printableSingleGrapheme("\x1b"), undefined);
		assert.equal(printableSingleGrapheme("\n"), undefined);
	});
});

describe("formatTokens", () => {
	it("shows raw number under 1000", () => {
		assert.equal(formatTokens(0), "0");
		assert.equal(formatTokens(500), "500");
		assert.equal(formatTokens(999), "999");
	});

	it("shows one decimal k for 1000-9999", () => {
		assert.equal(formatTokens(1000), "1.0k");
		assert.equal(formatTokens(1500), "1.5k");
		assert.equal(formatTokens(9999), "10.0k");
	});

	it("shows rounded k for 10000-999999", () => {
		assert.equal(formatTokens(10000), "10k");
		assert.equal(formatTokens(50000), "50k");
		assert.equal(formatTokens(999999), "1000k");
	});

	it("shows M for millions", () => {
		assert.equal(formatTokens(1000000), "1.0M");
		assert.equal(formatTokens(5500000), "5.5M");
		assert.equal(formatTokens(10000000), "10M");
		assert.equal(formatTokens(25000000), "25M");
	});
});

describe("sanitizeStatusText", () => {
	it("trims whitespace", () => {
		assert.equal(sanitizeStatusText("  hello  "), "hello");
	});

	it("replaces newlines and tabs with spaces", () => {
		assert.equal(sanitizeStatusText("hello\nworld\tfoo"), "hello world foo");
	});

	it("collapses multiple spaces", () => {
		assert.equal(sanitizeStatusText("hello    world"), "hello world");
	});

	it("handles combined cases", () => {
		assert.equal(sanitizeStatusText("  a\n\n  b\t\tc  "), "a b c");
	});
});
