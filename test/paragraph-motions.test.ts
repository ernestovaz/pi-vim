import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { paragraphForward, paragraphBackward } from "../src/utils.ts";

describe("paragraphForward", () => {
	it("moves to start of next paragraph", () => {
		const text = "hello\nworld\n\nfoo\nbar";
		// From offset 0 ("hello"), should jump to "foo" at offset 13
		assert.equal(paragraphForward(text, 0), 13);
	});

	it("returns original offset when no next paragraph", () => {
		const text = "hello\nworld";
		assert.equal(paragraphForward(text, 0), 0);
	});

	it("handles multiple blank lines between paragraphs", () => {
		const text = "abc\n\n\nxyz";
		assert.equal(paragraphForward(text, 0), 6);
	});

	it("moves from middle of paragraph", () => {
		const text = "line1\nline2\n\npara2";
		// From middle of first paragraph
		assert.equal(paragraphForward(text, 3), 13);
	});
});

describe("paragraphBackward", () => {
	it("moves to start of previous paragraph", () => {
		const text = "hello\nworld\n\nfoo\nbar";
		// From end of "bar" (offset 17), should find "foo" paragraph start at 13
		assert.equal(paragraphBackward(text, 17), 13);
	});

	it("returns 0 when no previous paragraph", () => {
		assert.equal(paragraphBackward("hello\nworld", 5), 0);
	});

	it("handles text starting at offset 0", () => {
		const text = "hello\n\nworld";
		// From "world" (offset 7), "hello" starts at 0 and is preceded by nothing (BOF)
		assert.equal(paragraphBackward(text, 7), 0);
	});
});
