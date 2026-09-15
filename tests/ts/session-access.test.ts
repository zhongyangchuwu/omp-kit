import { describe, expect, test } from "bun:test";
import type { SessionSummary, SessionTrace } from "@oh-my-pi/omp-stats/shared-types";
import { buildSessionEvidence } from "../../src/evidence/session-evidence";
import { createOmpStatsClient, withLocalOmpStats, type SessionEntryReader, type SessionTraceReader } from "../../src/session/omp-stats";
import { EvidenceReadError, requireEvidence } from "../../src/session/read-result";
import { readRuntimeEntries, type RuntimeEntrySource } from "../../src/session/runtime-entries";

const origin = "http://127.0.0.1:3847";
const json = (value: unknown) => new Response(JSON.stringify(value));

describe("composable OMP stats reads", () => {
	test("construction is inert and an empty catalog is an available observation", async () => {
		let calls = 0;
		const client = createOmpStatsClient(origin, async () => { calls++; return json([]); });
		expect(calls).toBe(0);
		const result = await client.listSessions(10);
		expect(result).toEqual({ scope: { source: "omp-stats", view: "session-list" }, status: "available", data: [] });
		expect(calls).toBe(1);
	});

	test("trace and entry consumers can use the same client without owning its lifecycle", async () => {
		const file = "/sessions/a & b/root.jsonl";
		const trace = { file, tracks: [], summary: {} };
		const urls: URL[] = [];
		const client = createOmpStatsClient(origin, async url => {
			const parsed = new URL(url);
			urls.push(parsed);
			return json(parsed.pathname.endsWith("trace") ? trace : { entry: { id: "entry&1" } });
		});
		const traceReader: SessionTraceReader = client;
		const entryReader: SessionEntryReader = client;
		const observation = await traceReader.getTrace(file);
		expect(observation.scope.view).toBe("active-branch-trace");
		expect(requireEvidence(observation)).toEqual(trace);
		expect(requireEvidence(await entryReader.getEntry(file, "entry&1"))).toEqual({ entry: { id: "entry&1" } });
		expect(urls.map(url => url.searchParams.get("file"))).toEqual([file, file]);
		expect(urls[1].searchParams.get("id")).toBe("entry&1");
		expect(urls.some(url => url.pathname.endsWith("sync"))).toBe(false);
	});

	test("composition preserves a failed child read rather than replacing it with no events", async () => {
		const client = createOmpStatsClient(origin, async url =>
			new URL(url).searchParams.get("file") === "child"
				? new Response("PRIVATE_FAILURE_BODY", { status: 403 })
				: json({ file: "root", tracks: [], summary: {} }),
		);
		const reads = await Promise.all([client.getTrace("root"), client.getTrace("child")]);
		expect(reads.map(read => read.status)).toEqual(["available", "unavailable"]);
		expect(reads[1]).toMatchObject({ reason: "http", httpStatus: 403 });
		expect("data" in reads[1]).toBe(false);
		expect(() => requireEvidence(reads[1])).toThrow(EvidenceReadError);
		expect(JSON.stringify(reads)).not.toContain("PRIVATE_FAILURE_BODY");
	});

	test("transport failures do not expose private exception messages", async () => {
		const client = createOmpStatsClient(origin, async () => { throw new Error("PRIVATE_SOURCE_PATH"); });
		const read = await client.getEntry("private/file", "private/id");
		expect(read).toMatchObject({ status: "unavailable", reason: "transport" });
		try { requireEvidence(read); } catch (error) {
			expect(String(error)).not.toContain("PRIVATE_SOURCE_PATH");
			expect(JSON.stringify(error)).not.toContain("private/file");
		}
	});

	test("invalid JSON and missing envelopes are not successful empty reads", async () => {
		const invalid = createOmpStatsClient(origin, async () => new Response("not json"));
		expect(await invalid.getTrace("root")).toMatchObject({ status: "unavailable", reason: "invalid-json" });
		const absent = createOmpStatsClient(origin, async () => json(null));
		expect(await absent.getTrace("root")).toMatchObject({ status: "unavailable", reason: "invalid-envelope" });
		expect(await absent.listSessions(10)).toMatchObject({ status: "unavailable", reason: "invalid-envelope" });
		const missingEntry = createOmpStatsClient(origin, async () => json({ entry: null }));
		expect(await missingEntry.getEntry("root", "missing")).toMatchObject({ status: "unavailable", reason: "invalid-envelope" });
	});

	test("cancellation is explicit and does not initiate a pre-aborted read", async () => {
		const controller = new AbortController();
		controller.abort();
		let calls = 0;
		const client = createOmpStatsClient(origin, async () => { calls++; return json([]); });
		expect(await client.listSessions(10, controller.signal)).toMatchObject({ status: "unavailable", reason: "aborted" });
		expect(calls).toBe(0);
	});

	test("forwards the caller's signal and distinguishes cancellation during fetch", async () => {
		const controller = new AbortController();
		const client = createOmpStatsClient(origin, async (_url, init) => {
			expect(init?.signal).toBe(controller.signal);
			controller.abort();
			throw new Error("private abort details");
		});
		expect(await client.sync(controller.signal)).toMatchObject({ status: "unavailable", reason: "aborted" });
	});

	test("owned servers close once after success, read failure and consumer failure", async () => {
		for (const mode of ["ok", "read-error", "consumer-error"]) {
			let starts = 0;
			let stops = 0;
			const run = withLocalOmpStats(async client => {
				if (mode === "consumer-error") throw new Error("consumer failed");
				return requireEvidence(await client.listSessions(10));
			}, {
				start: async () => { starts++; return { hostname: "127.0.0.1", port: 3847, stop: () => { stops++; } }; },
				fetch: async () => mode === "read-error" ? new Response("private", { status: 500 }) : json([]),
			});
			if (mode === "ok") expect(await run).toEqual([]);
			else await expect(run).rejects.toThrow();
			expect(starts).toBe(1);
			expect(stops).toBe(1);
		}
	});
});

type Entry = { id: string; command?: string };
function runtime(): RuntimeEntrySource<Entry> {
	const retained: Entry[] = [{ id: "before" }, { id: "discarded", command: "git push" }, { id: "current" }];
	return {
		getSessionId: () => "session-a",
		getSessionFile: () => "/private/session-a.jsonl",
		getLeafId: () => "current",
		getBranch: () => [retained[0], retained[2]],
		getEntries: () => retained,
	};
}

describe("public runtime entry snapshots", () => {
	test("all-retained selection preserves off-branch evidence without claiming to undo it", () => {
		const source = runtime();
		const active = readRuntimeEntries(source);
		const retained = readRuntimeEntries(source, "all-retained-entries");
		expect(active.scope.view).toBe("active-branch-entries");
		expect(retained.scope.view).toBe("all-retained-entries");
		expect(requireEvidence(active).entries.map(entry => entry.id)).toEqual(["before", "current"]);
		expect(requireEvidence(retained).entries.map(entry => entry.id)).toEqual(["before", "discarded", "current"]);
	});

	test("snapshots are detached and repeatable rather than mutable aliases into the runtime", () => {
		const source = runtime();
		const first = readRuntimeEntries(source, "all-retained-entries");
		expect(readRuntimeEntries(source, "all-retained-entries")).toEqual(first);
		requireEvidence(first).entries[1].command = "changed by consumer";
		expect(source.getEntries()[1].command).toBe("git push");
	});

	test("missing runtime and runtime errors are not empty sessions", () => {
		expect(readRuntimeEntries(null)).toMatchObject({ status: "unavailable", reason: "runtime-unavailable" });
		const source = runtime();
		source.getEntries = () => { throw new Error("private payload"); };
		const read = readRuntimeEntries(source, "all-retained-entries");
		expect(read).toMatchObject({ status: "unavailable", reason: "runtime-read-failed" });
		expect(JSON.stringify(read)).not.toContain("private payload");
	});

	test("a changed source marks the snapshot partial and strict consumers reject it", () => {
		const source = runtime();
		let reads = 0;
		source.getLeafId = () => reads++ === 0 ? "old-leaf" : "new-leaf";
		const read = readRuntimeEntries(source);
		expect(read).toMatchObject({ status: "partial", reason: "source-changed" });
		expect(() => requireEvidence(read)).toThrow(EvidenceReadError);
	});
});


test("shared trace reads compose with the existing derivation without a CLI", async () => {
	const summary: SessionSummary = {
		file: "/sessions/root.jsonl", folder: "/work/project", title: null,
		startedAt: 0, endedAt: 0, requests: 0, toolCalls: 0, subagents: 0,
		totalTokens: 0, costTotal: 0, unpricedRequests: 0, models: [],
	};
	const trace: SessionTrace = {
		file: summary.file, title: null, cwd: summary.folder, startedAt: 0, endedAt: 0,
		mtimeMs: 1, tracks: [],
		summary: {
			wallMs: 0, modelMs: 0, toolMs: 0, idleMs: 0, turns: 0,
			requests: 0, toolCalls: 0, subagents: 0, totalTokens: 0,
			costTotal: 0, unpricedRequests: 0, toolStats: [],
		},
	};
	const client = createOmpStatsClient(origin, async () => json(trace));
	const direct = await buildSessionEvidence(summary, trace, []);
	const composed = await buildSessionEvidence(summary, requireEvidence(await client.getTrace(summary.file)), []);
	expect({ ...composed, collectedAt: null }).toEqual({ ...direct, collectedAt: null });
});
