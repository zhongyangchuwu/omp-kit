import { test } from "bun:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseAssuranceArgs } from "../../scripts/session_assurance";

const file = "/private/root.jsonl";

test("one leading package-script separator is accepted without relaxing other options", () => {
	assert.deepEqual(parseAssuranceArgs(["--", "--session", file, "--json"]), { sessionFile: file, json: true });
	assert.equal(parseAssuranceArgs(["--", "--help"]), null);
	assert.throws(() => parseAssuranceArgs(["--", "--", "--session", file]));
});
test("documented Bun package command reaches no-IO help", () => {
	const result = spawnSync(process.execPath, ["run", "assurance:report", "--", "--help"], {
		cwd: fileURLToPath(new URL("../../", import.meta.url)), encoding: "utf8", timeout: 10000,
	});
	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /Usage: omp-kit-assurance/);
});
