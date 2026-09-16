import { test } from "bun:test";
import assert from "node:assert/strict";
import { classifyPathTarget } from "../../src/assurance/scope/path";

test("relative parent paths are resolved against a known root", () => {
	assert.equal(classifyPathTarget("src/a.ts", "read", "/home/test/project", "/home/test")?.boundary, "workspace");
	assert.equal(classifyPathTarget("../outside.ts", "write", "/home/test/project", "/home/test")?.boundary, "host-user");
});

test("relative parent paths stay unknown when a child workspace root is unavailable", () => {
	assert.equal(classifyPathTarget("src/a.ts", "read", null, "/home/test")?.boundary, "workspace");
	assert.equal(classifyPathTarget("../outside.ts", "read", null, "/home/test")?.boundary, "unknown");
});

test("ambiguous www targets are not promoted to workspace or external scope", () => {
	assert.equal(classifyPathTarget("www.example.com", "read", "/home/test/project", "/home/test"), null);
	assert.equal(classifyPathTarget("https:/example.com", "read", "/home/test/project", "/home/test")?.boundary, "external");
});
