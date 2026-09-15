import { test } from "bun:test";
import assert from "node:assert/strict";
import type { SessionEntry } from "@oh-my-pi/pi-coding-agent";
import {
	createOmpStatsClient,
	OmpReadError,
	readCurrentSession,
	requireRead,
	withOmpStats,
	type CurrentSessionSource,
	type StatsFetch,
} from "../../src/session/omp-access";

const origin = "http://127.0.0.1:3847";
const file = "/sessions/private project/root.jsonl";
const summary = {
	file, folder: "/work/project", title: null, startedAt: 1, endedAt: 2,
	requests: 0, toolCalls: 0, subagents: 0, totalTokens: 0, costTotal: 0, unpricedRequests: 0, models: [],
};
const trace = {
	file, cwd: "/work/project", title: null, startedAt: 1, endedAt: 2, mtimeMs: 3,
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
const returning = (value: unknown): StatsFetch => async () => Response.json(value);
const client = (value: unknown) => createOmpStatsClient(origin, { fetch: returning(value), now: () => 10 });

function entry(id: string, parentId: string | null, data: Record<string, unknown> = {}): SessionEntry {
	return { type: "custom", id, parentId, timestamp: "2026-09-15T00:00:00Z", customType: "fixture", data };
}
const before = entry("before", null);
const discarded = entry("discarded-action", "before", { action: "push-attempt" });
const after = entry("after", "before");
function source(): CurrentSessionSource {
	return {
		getSessionId: () => "session-1",
		getSessionFile: () => file,
		getLeafId: () => "after",
		getBranch: () => [before, after],
		getEntries: () => [before, discarded, after],
	};
}

test("client construction is inert; sync is explicit", async () => {
	const calls: string[] = [];
	const api = createOmpStatsClient(origin, { fetch: async url => { calls.push(url); return Response.json({}); } });
	assert.deepEqual(calls, []);
	await api.sync();
	assert.deepEqual(calls, [`${origin}/api/sync`]);
});

test("non-local origins, credentials and path suffixes are rejected", () => {
	for (const value of ["https://example.com", "http://example.com", "http://user:secret@localhost", "http://localhost/private", "http://localhost?token=secret"]) {
		assert.throws(() => createOmpStatsClient(value), /loopback HTTP origin/);
	}
});

test("entry access encodes each identifier, forwards cancellation, and rejects redirects", async () => {
	const id = "entry & /?";
	const signal = new AbortController().signal;
	const api = createOmpStatsClient(origin, { fetch: async (url, init) => {
		const parsed = new URL(url);
		assert.equal(parsed.searchParams.get("file"), file);
		assert.equal(parsed.searchParams.get("id"), id);
		assert.equal(init?.signal, signal);
		assert.equal(init?.redirect, "error");
		return Response.json({ entry: { id } });
	} });
	const result = await api.getEntry(file, id, signal);
	assert.equal(result.status, "available");
	assert.equal(requireRead(result).entry.id, id);
});

test("empty successful list and failed list are not conflated", async () => {
	const empty = await client([]).listSessions(20);
	assert.notEqual(empty.status, "unavailable");
	assert.deepEqual(requireRead(empty), []);
	const failed = await createOmpStatsClient(origin, { fetch: async () => new Response("private payload", { status: 403 }) }).listSessions(20);
	assert.equal(failed.status, "unavailable");
	assert.equal("data" in failed, false);
	assert.throws(() => requireRead(failed), OmpReadError);
});

test("bounded session lists explicitly mark a reached limit", async () => {
	const result = await client([summary]).listSessions(1);
	assert.equal(result.status, "partial");
	assert.ok(result.limitations.includes("list-limit-reached"));
	await assert.rejects(() => client([]).listSessions(0), /positive safe integer/);
});

test("HTTP errors expose status but never private paths or server bodies", async () => {
	const result = await createOmpStatsClient(origin, { fetch: async () => new Response("secret-token /private/path", { status: 500 }) }).getTrace(file);
	assert.equal(result.status, "unavailable");
	if (result.status !== "unavailable") throw new Error("expected unavailable");
	assert.deepEqual(result.problem, { operation: "persisted-active-branches", code: "http", httpStatus: 500 });
	assert.doesNotMatch(JSON.stringify(result), /secret-token|private.path|root.jsonl/);
	assert.doesNotMatch(String(new OmpReadError(result.problem)), /secret-token|private.path|root.jsonl/);
});

test("network and cancellation errors cannot become empty evidence", async () => {
	const result = await createOmpStatsClient(origin, { fetch: async () => { throw new Error("private request URL"); } }).getTrace(file);
	assert.equal(result.status, "unavailable");
	assert.equal("data" in result, false);
	assert.doesNotMatch(JSON.stringify(result), /private request/);
});

test("invalid JSON and invalid API shapes are unavailable", async () => {
	const invalidJson = await createOmpStatsClient(origin, { fetch: async () => new Response("not JSON") }).getEntry(file, "a");
	assert.equal(invalidJson.status, "unavailable");
	for (const value of [{}, [null], [{ ...summary, toolCalls: "many" }]]) {
		assert.equal((await client(value).listSessions(10)).status, "unavailable");
	}
	assert.equal((await client({ ...trace, tracks: null }).getTrace(file)).status, "unavailable");
	const malformedSpan = structuredClone(trace);
	(malformedSpan.tracks[0].spans[0] as Record<string, unknown>).unterminated = "false";
	assert.equal((await client(malformedSpan).getTrace(file)).status, "unavailable");
});

test("missing or mismatched entry identities are unavailable", async () => {
	for (const value of [{}, { entry: null }, { entry: {} }, { entry: { id: "another-entry" } }]) {
		assert.equal((await client(value).getEntry(file, "a")).status, "unavailable");
	}
	assert.equal((await client({ ...trace, file: "/other.jsonl" }).getTrace(file)).status, "unavailable");
});

test("trace reads preserve evidence and disclose active-branch and child-coverage limits", async () => {
	const result = await client(trace).getTrace(file);
	assert.equal(result.status, "partial");
	assert.equal(result.scope, "persisted-active-branches");
	assert.ok(result.limitations.includes("active-branches-only"));
	assert.ok(result.limitations.includes("child-completeness-unknown"));
	assert.ok(result.limitations.includes("not-an-atomic-snapshot"));
	assert.deepEqual(requireRead(result), trace);
	assert.equal(result.startedAt, 10);
	assert.equal(result.finishedAt, 10);
});

test("returned tool calls and unfinished background work stay distinct raw observations", async () => {
	const data = requireRead(await client(trace).getTrace(file));
	assert.equal(data.tracks[0].spans[1].unterminated, true);
	assert.equal(data.tracks[0].spans[0].isError, undefined);
	assert.equal("succeeded" in data.tracks[0].spans[0], false);
	assert.equal("verified" in data.tracks[0].spans[0], false);
});

test("entry retrieval retains async details without interpreting tool return as job completion", async () => {
	const payload = { entry: { id: "result", message: { details: { async: { state: "running", jobId: "job" } } } } };
	assert.deepEqual(requireRead(await client(payload).getEntry(file, "result")), payload);
});

test("preview text is private and is not promoted to a command or sanitized claim", async () => {
	const preview = structuredClone(trace);
	(preview.tracks[0].spans[0] as Record<string, unknown>).detail = "echo private-preview...";
	const result = await client(preview).getTrace(file);
	assert.ok(result.limitations.includes("details-are-previews"));
	assert.equal(requireRead(result).tracks[0].spans[0].detail, "echo private-preview...");
	assert.equal("claims" in requireRead(result), false);
});

test("one failed child read does not turn into an empty successful child", async () => {
	const api = createOmpStatsClient(origin, { fetch: async url => new URL(url).searchParams.get("file") === file
		? Response.json(trace) : new Response("missing child", { status: 404 }) });
	const [root, child] = await Promise.all([api.getTrace(file), api.getTrace("/sessions/child.jsonl")]);
	assert.equal(root.status, "partial");
	assert.equal(child.status, "unavailable");
	assert.equal("data" in child, false);
});

test("same entry id in two tracks keeps its caller-selected file scope", async () => {
	const files: string[] = [];
	const api = createOmpStatsClient(origin, { fetch: async url => {
		files.push(new URL(url).searchParams.get("file")!);
		return Response.json({ entry: { id: "same" } });
	} });
	await api.getEntry(file, "same");
	await api.getEntry("/sessions/child.jsonl", "same");
	assert.deepEqual(files, [file, "/sessions/child.jsonl"]);
});

test("owned server always stops, on success and caller failure", async () => {
	for (const fail of [false, true]) {
		let stops = 0;
		const options = { startServer: async (port: number, host: string) => {
			assert.equal(port, 0);
			assert.equal(host, "127.0.0.1");
			return { hostname: host, port: 1234, stop: () => { stops++; } };
		}, fetch: returning([]) };
		const operation = withOmpStats(async api => {
			if (fail) throw new Error("caller failed");
			return requireRead(await api.listSessions(10));
		}, options);
		if (fail) await assert.rejects(() => operation, /caller failed/);
		else assert.deepEqual(await operation, []);
		assert.equal(stops, 1);
	}
});

test("sync failure is propagated and closes the owned server", async () => {
	let stops = 0;
	await assert.rejects(() => withOmpStats(async api => api.sync(), {
		startServer: async () => ({ hostname: "127.0.0.1", port: 1234, stop: () => { stops++; } }),
		fetch: async () => new Response("private diagnostics", { status: 500 }),
	}), /OMP sync: http/);
	assert.equal(stops, 1);
});

test("current retained entries preserve actions discarded from the active branch", () => {
	const active = readCurrentSession(source(), "current-branch", () => 10);
	const retained = readCurrentSession(source(), "retained-entries", () => 10);
	assert.deepEqual(requireRead(active).entries.map(item => item.id), ["before", "after"]);
	assert.deepEqual(requireRead(retained).entries.map(item => item.id), ["before", "discarded-action", "after"]);
	assert.ok(active.limitations.includes("active-branches-only"));
	assert.ok(retained.limitations.includes("single-session-only"));
	assert.ok(retained.limitations.includes("retained-entries-only"));
	assert.equal(requireRead(retained).leafId, "after");
});

test("empty in-memory session is a successful bounded read, without a persisted file", () => {
	const empty = { ...source(), getSessionFile: () => undefined, getLeafId: () => null, getEntries: () => [] };
	const result = readCurrentSession(empty, "retained-entries");
	assert.notEqual(result.status, "unavailable");
	assert.deepEqual(requireRead(result).entries, []);
	assert.equal(requireRead(result).sessionFile, undefined);
});

test("snapshots do not expose mutable runtime references", () => {
	const reader = source();
	const result = requireRead(readCurrentSession(reader, "retained-entries"));
	result.entries[1].id = "changed-in-caller";
	assert.equal(reader.getEntries()[1].id, "discarded-action");
});

test("repeated unchanged current reads retain identities without inserting events", () => {
	const reader = source();
	assert.deepEqual(readCurrentSession(reader, "retained-entries", () => 10), readCurrentSession(reader, "retained-entries", () => 10));
});

test("current-session errors and a moving leaf are unavailable, not empty", () => {
	const failed = readCurrentSession({ ...source(), getEntries: () => { throw new Error("secret from runtime"); } }, "retained-entries");
	assert.equal(failed.status, "unavailable");
	assert.equal("data" in failed, false);
	assert.doesNotMatch(JSON.stringify(failed), /secret from runtime/);
	let reads = 0;
	const moved = readCurrentSession({ ...source(), getLeafId: () => reads++ ? "new-leaf" : "after" }, "retained-entries");
	assert.equal(moved.status, "unavailable");
	if (moved.status === "unavailable") assert.equal(moved.problem.code, "changed-during-read");
});

test("shared reads leave legacy quantitative derivation and schema unchanged", async () => {
	const { buildSessionEvidence } = await import("../../scripts/session_evidence");
	const direct = await buildSessionEvidence(summary, trace as Parameters<typeof buildSessionEvidence>[1], []);
	const viaAccess = await buildSessionEvidence(
		requireRead(await client([summary]).listSessions(10))[0],
		requireRead(await client(trace).getTrace(file)),
		[],
	);
	assert.deepEqual({ ...viaAccess, collectedAt: direct.collectedAt }, direct);
	assert.equal(viaAccess.schemaVersion, "omp-kit.session-evidence/v1");
	assert.equal("limitations" in viaAccess, false);
});


test("empty current branch does not pass a null leaf to OMP getBranch", () => {
	const empty = {
		...source(),
		getLeafId: () => null,
		getBranch: () => { throw new Error("getBranch must not be called without a leaf"); },
	};
	const result = readCurrentSession(empty, "current-branch");
	assert.notEqual(result.status, "unavailable");
	assert.deepEqual(requireRead(result).entries, []);
	assert.equal(requireRead(result).leafId, null);
});
