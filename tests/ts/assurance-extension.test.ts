import { test } from "bun:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI, ExtensionCommandContext } from "@oh-my-pi/pi-coding-agent";
import { buildAssuranceReport } from "../../src/assurance/engine";
import {
	AssuranceStageError,
	assuranceOutputPaths,
	parseAssuranceCommandMode,
	persistAssuranceOutput,
	registerAssuranceCommand,
} from "../../extensions/assurance";

test("current-session assurance exposes only scan and full modes", () => {
	assert.equal(parseAssuranceCommandMode(""), "scan");
	assert.equal(parseAssuranceCommandMode("   "), "scan");
	assert.equal(parseAssuranceCommandMode("full"), "full");
	assert.equal(parseAssuranceCommandMode(" full "), "full");
	assert.equal(parseAssuranceCommandMode("scan"), null);
	assert.equal(parseAssuranceCommandMode("explain abc"), null);
});

test("derived outputs stay under the selected agent root and mode overwrites a stable name", () => {
	const scan = assuranceOutputPaths("/agent", "session-1", "scan");
	const full = assuranceOutputPaths("/agent", "session-1", "full");
	assert.equal(scan.directory, join("/agent", "omp-kit", "assurance", "session-1"));
	assert.equal(scan.text, join(scan.directory, "scan.txt"));
	assert.equal(scan.json, join(scan.directory, "scan.json"));
	assert.equal(full.text, join(full.directory, "full.txt"));
	assert.equal(full.json, join(full.directory, "full.json"));
});

test("persisted assurance output writes human and machine views without another raw store", async () => {
	const root = await mkdtemp(join(tmpdir(), "omp-kit-assurance-output-"));
	const paths = assuranceOutputPaths(root, "session-1", "full");
	const report = buildAssuranceReport({ actions: [], coverage: [] }, []);
	try {
		await persistAssuranceOutput(paths, report, "Session review");
		assert.equal(await readFile(paths.text, "utf8"), "Session review\n");
		assert.deepEqual(JSON.parse(await readFile(paths.json, "utf8")), report);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test("slash command maps no argument to scan, full to full, and rejects extra modes locally", async () => {
	let registered: { handler(args: string, ctx: ExtensionCommandContext): Promise<void> } | undefined;
	const warnings: unknown[][] = [];
	const pi = {
		registerCommand(name: string, options: unknown) {
			assert.equal(name, "assurance");
			registered = options as typeof registered;
		},
		logger: { warn: (...args: unknown[]) => warnings.push(args) },
	} as unknown as ExtensionAPI;
	const calls: string[] = [];
	registerAssuranceCommand(pi, async mode => { calls.push(mode); });
	assert.ok(registered);
	const notices: string[] = [];
	const ctx = {
		ui: { notify: (message: string) => notices.push(message) },
	} as unknown as ExtensionCommandContext;
	await registered.handler("", ctx);
	await registered.handler("full", ctx);
	await registered.handler("explain nope", ctx);
	assert.deepEqual(calls, ["scan", "full"]);
	assert.ok(notices.some(message => message.includes("Usage: /assurance [full]")));
	assert.equal(warnings.length, 0);
});


test("slash command reports only a bounded failure stage", async () => {
	let registered: { handler(args: string, ctx: ExtensionCommandContext): Promise<void> } | undefined;
	const pi = {
		registerCommand(_name: string, options: unknown) { registered = options as typeof registered; },
		logger: { warn: () => undefined },
	} as unknown as ExtensionAPI;
	registerAssuranceCommand(pi, async () => { throw new AssuranceStageError("stats-report"); });
	assert.ok(registered);
	const notices: string[] = [];
	const ctx = { ui: { notify: (message: string) => notices.push(message) } } as unknown as ExtensionCommandContext;
	await registered.handler("", ctx);
	assert.deepEqual(notices, ["Could not produce the assurance report (stage: stats-report)."]);
});
