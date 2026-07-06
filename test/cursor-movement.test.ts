import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { moveUp, moveDown } from "../src/utils.ts";

describe("moveUp", () => {
	it("stays at same offset on first line", () => {
		assert.equal(moveUp("hello\nworld", 3), 3);
	});

	it("moves to same column on previous line", () => {
		// "hello\nworld" - from offset 8 (w-o-r = col 2 on line 2)
		assert.equal(moveUp("hello\nworld", 8), 2);
	});

	it("clamps to last char of shorter previous line", () => {
		// "hi\nhello" - from offset 6 (col 3 on line 2), line 1 has len 2, lineLast = 1
		assert.equal(moveUp("hi\nhello", 6), 1);
	});

	it("moves correctly with multi-line text", () => {
		const text = "abc\ndefgh\nij";
		// from offset 11 (col 1 on line 3: 'j'), prev line starts at 4, col=1 -> 5
		assert.equal(moveUp(text, 11), 5);
	});
});

describe("moveDown", () => {
	it("stays at same offset on last line", () => {
		assert.equal(moveDown("hello\nworld", 8), 8);
	});

	it("moves to same column on next line", () => {
		// "hello\nworld" - from offset 2 (col 2 on line 1), next line starts at 6, col 2 -> 8
		assert.equal(moveDown("hello\nworld", 2), 8);
	});

	it("clamps to last char of shorter next line", () => {
		// "hello\nhi" - from offset 4 (col 4 on line 1), next line "hi" has lineLast=7
		assert.equal(moveDown("hello\nhi", 4), 7);
	});

	it("handles empty next line", () => {
		// "hello\n\nworld" - from offset 3 (col 3), next line is empty at offset 6
		// lineLast of empty line returns start (6)
		assert.equal(moveDown("hello\n\nworld", 3), 6);
	});
});
