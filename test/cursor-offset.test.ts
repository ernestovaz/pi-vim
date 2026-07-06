import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
	totalLength,
	cursorToOffset,
	offsetToCursor,
	replaceRange,
} from "../src/utils.ts";

describe("totalLength", () => {
	it("returns 0 for empty array", () => {
		assert.equal(totalLength([]), 0);
	});

	it("returns length for single line", () => {
		assert.equal(totalLength(["hello"]), 5);
	});

	it("accounts for newline separators", () => {
		// "hello\nworld" = 5 + 1 + 5 = 11
		assert.equal(totalLength(["hello", "world"]), 11);
	});

	it("handles empty lines", () => {
		// "a\n\nb" = 1 + 1 + 0 + 1 + 1 = 4
		assert.equal(totalLength(["a", "", "b"]), 4);
	});

	it("handles multiple lines", () => {
		// "ab\ncde\nf" = 2 + 1 + 3 + 1 + 1 = 8
		assert.equal(totalLength(["ab", "cde", "f"]), 8);
	});
});

describe("cursorToOffset", () => {
	it("converts (0, 0) to 0", () => {
		assert.equal(cursorToOffset(["hello", "world"], { line: 0, col: 0 }), 0);
	});

	it("converts col on first line", () => {
		assert.equal(cursorToOffset(["hello", "world"], { line: 0, col: 3 }), 3);
	});

	it("converts to second line", () => {
		// "hello\n" is 6 chars, so (1, 2) -> 6 + 2 = 8
		assert.equal(cursorToOffset(["hello", "world"], { line: 1, col: 2 }), 8);
	});

	it("handles empty lines", () => {
		// "a\n\nb" -> line 0 "a" len=1 +1=2, line 1 "" len=0 +1=3, (2, 0) -> 3
		assert.equal(cursorToOffset(["a", "", "b"], { line: 2, col: 0 }), 3);
	});
});

describe("offsetToCursor", () => {
	it("converts 0 to (0, 0)", () => {
		assert.deepEqual(offsetToCursor(["hello", "world"], 0), { line: 0, col: 0 });
	});

	it("converts mid-first-line offset", () => {
		assert.deepEqual(offsetToCursor(["hello", "world"], 3), { line: 0, col: 3 });
	});

	it("converts to second line", () => {
		// offset 8 = "hello\nwo" -> (1, 2)
		assert.deepEqual(offsetToCursor(["hello", "world"], 8), { line: 1, col: 2 });
	});

	it("clamps offset beyond total length", () => {
		assert.deepEqual(offsetToCursor(["hello", "world"], 100), { line: 1, col: 5 });
	});

	it("clamps negative offset to (0, 0)", () => {
		assert.deepEqual(offsetToCursor(["hello", "world"], -5), { line: 0, col: 0 });
	});

	it("handles offset at newline boundary", () => {
		// offset 5 in "hello\nworld" = end of first line
		assert.deepEqual(offsetToCursor(["hello", "world"], 5), { line: 0, col: 5 });
	});

	it("handles offset just past newline", () => {
		// offset 6 in "hello\nworld" = start of second line
		assert.deepEqual(offsetToCursor(["hello", "world"], 6), { line: 1, col: 0 });
	});
});

describe("replaceRange", () => {
	it("deletes range with no replacement", () => {
		assert.equal(replaceRange("hello world", 5, 11), "hello");
	});

	it("replaces range with text", () => {
		assert.equal(replaceRange("hello world", 6, 11, "vim"), "hello vim");
	});

	it("inserts at position (empty range)", () => {
		assert.equal(replaceRange("hello", 5, 5, " world"), "hello world");
	});

	it("handles start of string", () => {
		assert.equal(replaceRange("hello", 0, 3, "j"), "jlo");
	});

	it("handles empty replacement (deletion)", () => {
		assert.equal(replaceRange("abcde", 1, 4), "ae");
	});
});
