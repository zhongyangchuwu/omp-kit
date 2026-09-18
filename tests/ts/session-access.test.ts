import { test } from "bun:test";
import assert from "node:assert/strict";
import type { ReadonlySessionManager, SessionEntry } from "@oh-my-pi/pi-coding-agent";
import type { SessionSummary, SessionTrace } from "@oh-my-pi/omp-stats/shared-types";
import { createInProcessOmpStatsReader, createOmpStatsClient, withLocalOmpStats, type SessionEntryReader, type SessionTraceReader, type StatsFetch } from "../../src/session/omp-stats";
import { EvidenceReadError, requireEvidence } from "../../src/session/read-result";
import { readRuntimeEntries, type RuntimeEntrySource } from "../../src/session/runtime-entries";

const origin = "http://127.0.0.1:3847";
const file = "/sessions/private project/root.jsonl";
const summary: SessionSummary = {
	file, folder: "/work/project", title: null, startedAt: 1, endedAt: 2,
	requests: 0, toolCalls: 1, subagents: 0, totalTokens: 0, costTotal: 0, unpricedRequests: 0, models: [],
};
function trace(): SessionTrace {
	return {
		file, cwd: summary.folder, title: null, startedAt: 1, endedAt: 2, mtimeMs: 3, etag: "test-etag",
		tracks: [{
			id: "main", parentId: null, label: "Main", agent: null, model: null, file, markers: [],
			spans: [
				{ id: "main:a:tool", kind: "tool", start: 1, end: 2, label: "bash", entryId: "result", toolCallId: "tool" },
				{ id: "main:bg:job", kind: "background", start: 2, end: 2, label: "bash job", unterminated: true },
			],
		}],
		summary: { wallMs: 1, modelMs: 0, toolMs: 1, idleMs: 0, turns: 1, requests: 0, toolCalls: 1,
			subagents: 0, totalTokens: 0, costTotal: 0, unpricedRequests: 0, toolStats: [] },
	};
}
const returning = (value: unknown): StatsFetch => async () => Response.json(value);
const client = (value: unknown) => createOmpStatsClient(origin, returning(value), () => 10);

type Entry = { id: string; payload?: { command: string } };
function runtime(): RuntimeEntrySource<Entry> {
	const retained: Entry[] = [{ id: "before" }, { id: "discarded", payload: { command: "git push" } }, { id: "current" }];
	return {
		getSessionId: () => "session-a", getSessionFile: () => file, getLeafId: () => "current",
		getBranch: () => [retained[0], retained[2]], getEntries: () => retained,
	};
}
// Compile against the published SDK, not only permissive structural fakes.
const acceptsPublishedSdk = (source: ReadonlySessionManager) => readRuntimeEntries<SessionEntry>(source);
void acceptsPublishedSdk;

test("construction is inert and sync is explicit", async () => {
	const calls: string[] = [];
	const api = createOmpStatsClient(origin, async url => { calls.push(url); return Response.json({}); });
	assert.deepEqual(calls, []);
	requireEvidence(await api.sync());
	assert.deepEqual(calls, [`${origin}/api/sync`]);
});

test("only credential-free loopback origins are accepted", () => {
	for (const value of ["https://example.com", "http://example.com", "http://user:SECRET@localhost", "http://localhost/path", "http://localhost?token=SECRET", "http://localhost#SECRET", "SECRET invalid URL"]) {
		assert.throws(() => createOmpStatsClient(value), error => error instanceof Error && /loopback HTTP/.test(error.message) && !error.message.includes("SECRET"));
	}
	for (const value of [origin, "http://localhost:3847", "http://[::1]:3847"]) createOmpStatsClient(value);
});

test("narrow trace and entry readers compose without owning a server", async () => {
	const urls: URL[] = [];
	const api = createOmpStatsClient(origin, async url => {
		urls.push(new URL(url));
		return Response.json(urls.at(-1)!.pathname.endsWith("trace") ? trace() : { entry: { id: "result" } });
	});
	const traceReader: SessionTraceReader = api;
	const entryReader: SessionEntryReader = api;
	assert.deepEqual(requireEvidence(await traceReader.getTrace(file)), trace());
	assert.deepEqual(requireEvidence(await entryReader.getEntry(file, "result")), { entry: { id: "result" } });
	assert.equal(urls.some(url => url.pathname.endsWith("sync")), false);
});

test("in-process trace reader uses the published trace module without starting transport", async () => {
	let loads = 0;
	let traces = 0;
	let entries = 0;
	const api = createInProcessOmpStatsReader({
		now: () => 10,
		load: async () => {
			loads++;
			return {
				async buildSessionTrace(requested) {
					traces++;
					assert.equal(requested, file);
					return trace();
				},
				async getTraceEntry(requested, id) {
					entries++;
					assert.equal(requested, file);
					return { id };
				},
			};
		},
	});
	assert.equal(loads, 0);
	assert.deepEqual(requireEvidence(await api.getTrace(file)), trace());
	assert.deepEqual(requireEvidence(await api.getEntry(file, "result")), { entry: { id: "result" } });
	assert.equal(loads, 1);
	assert.equal(traces, 1);
	assert.equal(entries, 1);
});

test("in-process trace reader sanitizes module/runtime failures and honors cancellation", async () => {
	const controller = new AbortController();
	const api = createInProcessOmpStatsReader({
		load: async () => ({
			async buildSessionTrace() { throw new Error("SECRET private trace failure"); },
			async getTraceEntry() { throw new Error("SECRET private entry failure"); },
		}),
	});
	const failed = await api.getTrace(file);
	assert.equal(failed.status, "unavailable");
	if (failed.status === "unavailable") assert.equal(failed.reason, "runtime-read-failed");
	assert.doesNotMatch(JSON.stringify(failed), /SECRET|private trace/);
	controller.abort();
	const aborted = await api.getEntry(file, "result", controller.signal);
	assert.equal(aborted.status, "unavailable");
	if (aborted.status === "unavailable") assert.equal(aborted.reason, "aborted");
});

test("entry identifiers are encoded; signals and redirect rejection are forwarded", async () => {
	const id = "entry & /?";
	const signal = new AbortController().signal;
	const api = createOmpStatsClient(origin, async (url, init) => {
		const parsed = new URL(url);
		assert.equal(parsed.searchParams.get("file"), file);
		assert.equal(parsed.searchParams.get("id"), id);
		assert.equal(init?.signal, signal);
		assert.equal(init?.redirect, "error");
		return Response.json({ entry: { id } });
	});
	assert.deepEqual(requireEvidence(await api.getEntry(file, id, signal)), { entry: { id } });
});

test("empty catalog is available while preserving its bounded scope", async () => {
	const read = await client([]).listSessions(20);
	assert.equal(read.status, "available");
	assert.equal(read.consistency, "not-checked");
	assert.deepEqual(read.limitations, ["bounded-session-list"]);
	assert.deepEqual(requireEvidence(read), []);
	assert.equal(read.startedAt, 10);
	assert.equal(read.finishedAt, 10);
});

test("reached list limit does not turn a successful bounded request into a read failure", async () => {
	const read = await client([summary]).listSessions(1);
	assert.equal(read.status, "available");
	assert.ok(read.limitations.includes("list-limit-reached"));
	assert.deepEqual(requireEvidence(read), [summary]);
	await assert.rejects(() => client([]).listSessions(0), /positive session limit/);
});

test("read windows use the injected clock", async () => {
	let now = 10;
	const api = createOmpStatsClient(origin, returning([]), () => now++);
	const read = await api.listSessions(1);
	assert.equal(read.startedAt, 10);
	assert.equal(read.finishedAt, 11);
});

test("failed HTTP reads have no data and do not echo private diagnostics", async () => {
	const read = await createOmpStatsClient(origin, async () => new Response("SECRET private path", { status: 403 })).getTrace(file);
	assert.equal(read.status, "unavailable");
	assert.equal("data" in read, false);
	if (read.status !== "unavailable") throw new Error("Expected unavailable");
	assert.equal(read.httpStatus, 403);
	assert.equal(read.reason, "http");
	assert.doesNotMatch(JSON.stringify(read), /SECRET|private project/);
	assert.throws(() => requireEvidence(read), error => error instanceof EvidenceReadError && !String(error).includes("SECRET"));
});

test("transport errors are sanitized and preserve coverage limits", async () => {
	const read = await createOmpStatsClient(origin, async () => { throw new Error("SECRET request URL"); }).getTrace(file);
	assert.equal(read.status, "unavailable");
	assert.ok(read.limitations.includes("active-branches-only"));
	assert.equal("data" in read, false);
	assert.doesNotMatch(JSON.stringify(read), /SECRET/);
});

test("invalid JSON is unavailable, not an empty result", async () => {
	const read = await createOmpStatsClient(origin, async () => new Response("not JSON")).getEntry(file, "a");
	assert.equal(read.status, "unavailable");
	if (read.status === "unavailable") assert.equal(read.reason, "invalid-json");
});

test("malformed catalog fields fail at the contract boundary", async () => {
	for (const value of [{}, [null], [{ ...summary, toolCalls: "many" }], [{ ...summary, models: [4] }]]) {
		assert.equal((await client(value).listSessions(10)).status, "unavailable");
	}
});

test("malformed trace fields are not trusted through a type assertion", async () => {
	for (const mutate of [
		(value: SessionTrace) => { (value as unknown as Record<string, unknown>).tracks = null; },
		(value: SessionTrace) => { delete (value as unknown as Record<string, unknown>).etag; },
		(value: SessionTrace) => { (value.tracks[0].spans[0] as unknown as Record<string, unknown>).unterminated = "false"; },
		(value: SessionTrace) => { value.tracks[0].spans[0].end = 0; },
		(value: SessionTrace) => { (value.summary as unknown as Record<string, unknown>).toolStats = null; },
	]) {
		const value = trace();
		mutate(value);
		assert.equal((await client(value).getTrace(file)).status, "unavailable");
	}
});

test("additive upstream fields are retained without weakening known fields", async () => {
	const value = { ...trace(), futureMetadata: { version: 2 } };
	assert.deepEqual(requireEvidence(await client(value).getTrace(file)), value);
});

test("missing and mismatched entry or trace identities are rejected", async () => {
	for (const value of [{}, { entry: null }, { entry: {} }, { entry: { id: "other" } }]) {
		assert.equal((await client(value).getEntry(file, "a")).status, "unavailable");
	}
	assert.equal((await client({ ...trace(), file: "/other" }).getTrace(file)).status, "unavailable");
});

test("pre-aborted reads initiate no transport", async () => {
	const controller = new AbortController();
	controller.abort();
	let calls = 0;
	const api = createOmpStatsClient(origin, async () => { calls++; return Response.json([]); });
	const read = await api.listSessions(1, controller.signal);
	assert.equal(calls, 0);
	assert.equal(read.status, "unavailable");
	if (read.status === "unavailable") assert.equal(read.reason, "aborted");
});

test("abort during fetch is distinct from ordinary transport failure", async () => {
	const controller = new AbortController();
	const api = createOmpStatsClient(origin, async () => { controller.abort(); throw new Error("SECRET"); });
	const read = await api.sync(controller.signal);
	assert.equal(read.status, "unavailable");
	if (read.status === "unavailable") assert.equal(read.reason, "aborted");
});

test("late cancellation cannot become a successful parsed response", async () => {
	const controller = new AbortController();
	const api = createOmpStatsClient(origin, async () => { controller.abort(); return Response.json([]); });
	const read = await api.listSessions(1, controller.signal);
	assert.equal(read.status, "unavailable");
	if (read.status === "unavailable") assert.equal(read.reason, "aborted");
});

test("successful active-branch trace keeps explicit limits without claiming atomicity", async () => {
	const read = await client(trace()).getTrace(file);
	assert.equal(read.status, "available");
	assert.equal(read.scope.view, "active-branch-trace");
	assert.equal(read.consistency, "not-checked");
	assert.deepEqual(read.limitations, ["active-branches-only", "child-completeness-unknown", "details-are-previews", "not-an-atomic-snapshot"]);
	assert.deepEqual(requireEvidence(read), trace());
});

test("raw async-running payloads and background spans are not converted into success", async () => {
	const payload = { entry: { id: "result", message: { details: { async: { state: "running", jobId: "job" } } } } };
	assert.deepEqual(requireEvidence(await client(payload).getEntry(file, "result")), payload);
	const data = requireEvidence(await client(trace()).getTrace(file));
	assert.equal(data.tracks[0].spans[1].unterminated, true);
	assert.equal(data.tracks[0].spans[0].isError, undefined);
	assert.equal("succeeded" in data.tracks[0].spans[0], false);
});

test("preview text remains private data rather than a parsed command or sanitized finding", async () => {
	const value = trace();
	value.tracks[0].spans[0].detail = "PRIVATE preview...";
	const read = await client(value).getTrace(file);
	assert.ok(read.limitations.includes("details-are-previews"));
	assert.equal(requireEvidence(read).tracks[0].spans[0].detail, "PRIVATE preview...");
	assert.equal("findings" in requireEvidence(read), false);
});

test("composition retains one failed child instead of substituting empty events", async () => {
	const api = createOmpStatsClient(origin, async url => new URL(url).searchParams.get("file") === file
		? Response.json(trace()) : new Response("SECRET missing child", { status: 404 }));
	const reads = await Promise.all([api.getTrace(file), api.getTrace("/child")]);
	assert.deepEqual(reads.map(read => read.status), ["available", "unavailable"]);
	assert.equal("data" in reads[1], false);
});

test("same entry identifier in different tracks retains caller-selected file scope", async () => {
	const files: Array<string | null> = [];
	const api = createOmpStatsClient(origin, async url => { files.push(new URL(url).searchParams.get("file")); return Response.json({ entry: { id: "same" } }); });
	await api.getEntry(file, "same");
	await api.getEntry("/child", "same");
	assert.deepEqual(files, [file, "/child"]);
});

test("owned server stops once on success, read failure and consumer failure", async () => {
	for (const mode of ["ok", "read-error", "consumer-error"]) {
		let starts = 0;
		let stops = 0;
		const operation = withLocalOmpStats(async api => {
			if (mode === "consumer-error") throw new Error("Consumer failed");
			return requireEvidence(await api.listSessions(1));
		}, {
			start: async () => { starts++; return { hostname: "127.0.0.1", port: 3847, stop: () => { stops++; } }; },
			fetch: async () => mode === "read-error" ? new Response("PRIVATE", { status: 500 }) : Response.json([]),
		});
		if (mode === "ok") assert.deepEqual(await operation, []);
		else await assert.rejects(operation);
		assert.equal(starts, 1);
		assert.equal(stops, 1);
	}
});

test("owned server can route startup logs away from stdout", async () => {
	const stdout: unknown[][] = [];
	const stderr: unknown[][] = [];
	const originalLog = console.log;
	const originalError = console.error;
	console.log = (...args: unknown[]) => { stdout.push(args); };
	console.error = (...args: unknown[]) => { stderr.push(args); };
	try {
		await withLocalOmpStats(async api => requireEvidence(await api.listSessions(1)), {
			start: async () => {
				console.log("Building stats client...");
				return { hostname: "127.0.0.1", port: 3847, stop: () => undefined };
			},
			fetch: async () => Response.json([]),
			startLogsToStderr: true,
		});
		console.log("after-start");
	} finally {
		console.log = originalLog;
		console.error = originalError;
	}
	assert.deepEqual(stdout, [["after-start"]]);
	assert.deepEqual(stderr, [["Building stats client..."]]);
});

test("sync failures propagate and release the owned server", async () => {
	let stops = 0;
	await assert.rejects(withLocalOmpStats(async api => requireEvidence(await api.sync()), {
		start: async () => ({ hostname: "127.0.0.1", port: 3847, stop: () => { stops++; } }),
		fetch: async () => new Response("PRIVATE", { status: 500 }),
	}), EvidenceReadError);
	assert.equal(stops, 1);
});

test("client construction failure still releases its owned server", async () => {
	let stops = 0;
	await assert.rejects(withLocalOmpStats(async () => assert.fail("Must not run"), {
		start: async () => ({ hostname: "remote.example", port: 3847, stop: () => { stops++; } }),
	}), /loopback HTTP/);
	assert.equal(stops, 1);
});

test("retained-entry selection includes off-branch evidence without implying undone effects", () => {
	const source = runtime();
	const active = readRuntimeEntries(source);
	const retained = readRuntimeEntries(source, "all-retained-entries");
	assert.deepEqual(requireEvidence(active).entries.map(entry => entry.id), ["before", "current"]);
	assert.deepEqual(requireEvidence(retained).entries.map(entry => entry.id), ["before", "discarded", "current"]);
	assert.ok(active.limitations.includes("active-branches-only"));
	assert.equal(retained.limitations.includes("active-branches-only"), false);
	assert.ok(retained.limitations.includes("single-session-only"));
	assert.equal(retained.consistency, "no-change-detected");
});

test("empty current branch never passes null to SDK getBranch", () => {
	const source = { ...runtime(), getLeafId: () => null, getSessionFile: () => undefined,
		getBranch: (_leaf?: string): Entry[] => assert.fail("No leaf must not call getBranch") };
	const read = readRuntimeEntries(source);
	assert.equal(read.status, "available");
	assert.deepEqual(requireEvidence(read).entries, []);
	assert.equal(requireEvidence(read).sessionFile, null);
	assert.equal(requireEvidence(readRuntimeEntries(source, "all-retained-entries")).entries.length, 3);
});

test("retained snapshots are deeply detached from runtime objects", () => {
	const source = runtime();
	const data = requireEvidence(readRuntimeEntries(source, "all-retained-entries"));
	data.entries[1].payload!.command = "caller mutation";
	assert.equal(source.getEntries()[1].payload!.command, "git push");
});

test("unchanged reads retain identities without inserting events", () => {
	const source = runtime();
	assert.deepEqual(readRuntimeEntries(source, "all-retained-entries", () => 10), readRuntimeEntries(source, "all-retained-entries", () => 10));
});

test("missing runtime and exceptions are unavailable, not empty sessions", () => {
	assert.equal(readRuntimeEntries(null).status, "unavailable");
	const source = { ...runtime(), getEntries: (): Entry[] => { throw new Error("SECRET"); } };
	const read = readRuntimeEntries(source, "all-retained-entries");
	assert.equal(read.status, "unavailable");
	assert.equal("data" in read, false);
	assert.doesNotMatch(JSON.stringify(read), /SECRET/);
});

test("moving leaf is a consistency failure, not a coverage or transport failure", () => {
	let calls = 0;
	const read = readRuntimeEntries({ ...runtime(), getLeafId: () => calls++ ? "new" : "old" });
	assert.equal(read.status, "available");
	assert.equal(read.consistency, "source-changed");
	assert.throws(() => requireEvidence(read), EvidenceReadError);
});

test("changed session identity discards possibly mixed payload", () => {
	for (const field of ["getSessionId", "getSessionFile"] as const) {
		let calls = 0;
		const source = runtime();
		source[field] = () => calls++ ? "new" : "old";
		const read = readRuntimeEntries(source);
		assert.equal(read.status, "unavailable");
		assert.equal(read.consistency, "source-changed");
		assert.equal("data" in read, false);
	}
});

test("shared reads compose with quantitative derivation without importing the CLI", async () => {
	const { buildSessionEvidence } = await import("../../src/evidence/session-evidence");
	const direct = await buildSessionEvidence(summary, trace(), []);
	const composed = await buildSessionEvidence(summary, requireEvidence(await client(trace()).getTrace(file)), []);
	assert.deepEqual({ ...composed, collectedAt: direct.collectedAt }, direct);
	assert.equal(composed.schemaVersion, "omp-kit.session-evidence/v1");
	assert.equal("limitations" in composed, false);
});
