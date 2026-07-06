import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { nextWordStart, prevWordStart, wordEnd } from "../src/utils.ts";

describe("nextWordStart (small word)", () => {
	it("moves from start of word to next word", () => {
		assert.equal(nextWordStart("hello world", 0, false), 6);
	});

	it("moves from middle of word to next word", () => {
		assert.equal(nextWordStart("hello world", 2, false), 6);
	});

	it("skips punctuation between words", () => {
		assert.equal(nextWordStart("foo.bar", 0, false), 4);
	});

	it("returns text length when no next word", () => {
		assert.equal(nextWordStart("hello", 0, false), 5);
	});

	it("handles multiple spaces", () => {
		assert.equal(nextWordStart("hello   world", 0, false), 8);
	});

	it("handles offset at space", () => {
		assert.equal(nextWordStart("hello world", 5, false), 6);
	});
});

describe("nextWordStart (big word)", () => {
	it("treats punctuation as part of word", () => {
		assert.equal(nextWordStart("foo.bar baz", 0, true), 8);
	});

	it("moves over non-whitespace run", () => {
		assert.equal(nextWordStart("hello-world foo", 0, true), 12);
	});
});

describe("prevWordStart (small word)", () => {
	it("moves from start of second word to first", () => {
		assert.equal(prevWordStart("hello world", 6, false), 0);
	});

	it("moves from middle of second word to start of second", () => {
		assert.equal(prevWordStart("hello world", 8, false), 6);
	});

	it("returns 0 when already at start", () => {
		assert.equal(prevWordStart("hello", 0, false), 0);
	});

	it("skips punctuation backward", () => {
		assert.equal(prevWordStart("foo.bar", 4, false), 0);
	});

	it("handles multiple words", () => {
		assert.equal(prevWordStart("one two three", 10, false), 8);
	});
});

describe("prevWordStart (big word)", () => {
	it("treats punctuation as part of word", () => {
		assert.equal(prevWordStart("foo.bar baz", 8, true), 0);
	});
});

describe("wordEnd (small word)", () => {
	it("moves to end of current word", () => {
		assert.equal(wordEnd("hello world", 0, false), 4);
	});

	it("moves to end of next word when already at end", () => {
		assert.equal(wordEnd("hello world", 4, false), 10);
	});

	it("handles single character word", () => {
		// "a b c" from offset 0: 'a' is at end of its word already, so wordEnd
		// skips forward past non-word to next word 'b' at index 2
		assert.equal(wordEnd("a b c", 0, false), 2);
	});

	it("skips non-word chars to find end of next word", () => {
		assert.equal(wordEnd("foo...bar", 3, false), 8);
	});

	it("returns last index for empty text", () => {
		assert.equal(wordEnd("", 0, false), 0);
	});

	it("handles offset beyond text", () => {
		assert.equal(wordEnd("hello", 100, false), 4);
	});
});

describe("wordEnd (big word)", () => {
	it("treats punctuation as part of WORD", () => {
		assert.equal(wordEnd("foo.bar baz", 0, true), 6);
	});

	it("moves to end of next WORD from space", () => {
		assert.equal(wordEnd("hello world", 5, true), 10);
	});
});
