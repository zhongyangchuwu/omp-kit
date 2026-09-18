import { test } from "bun:test";
import assert from "node:assert/strict";
import type { SessionSummary, SessionTrace, TraceSpan } from "@oh-my-pi/omp-stats/shared-types";
import type { OmpStatsClient } from "../../src/session/omp-stats";
import { sessionKey } from "../../src/evidence/session-evidence";
import { parseAssuranceArgs, runAssuranceCli, scanAssuranceReports } from "../../scripts/session_assurance";

const LIMITS = ["active-branches-only", "child-completeness-unknown", "details-are-previews", "not-an-atomic-snapshot"] as const;

function summary(file: string, endedAt: number, folder = "/work/omp-kit"): SessionSummary {
	return {
		file,
		folder,
		title: null,
		models: [],
		startedAt: endedAt - 100,
		endedAt,
		requests: 1,
		toolCalls: 1,
		subagents: 0,
		totalTokens: 0,
		costTotal: 0,
		unpricedRequests: 0,
	};
}

function span(overrides: Partial<TraceSpan> = {}): TraceSpan {
	return { id: "main:tool:call", kind: "tool", start: 1, end: 2, label: "bash", entryId: "result", toolCallId: "call", ...overrides };
}

function trace(file: string, spans: TraceSpan[], cwd = "/work/omp-kit"): SessionTrace {
	return {
		file,
		cwd,
		title: null,
		startedAt: 1,
		endedAt: 2,
		mtimeMs: 3, etag: "test-etag", etag: "test-etag",
		tracks: [{ id: "main", parentId: null, label: "Main", agent: null, model: null, file, spans, markers: [] }],
		summary: {
			wallMs: 1,
			modelMs: 0,
			toolMs: 1,
			idleMs: 0,
			turns: 1,
			requests: 0,
			toolCalls: spans.length,
			subagents: 0,
			totalTokens: 0,
			costTotal: 0,
			unpricedRequests: 0,
			toolStats: [],
		},
	};
}

function availableTrace(value: SessionTrace) {
	return {
		scope: { source: "omp-stats" as const, view: "active-branch-trace" as const },
		startedAt: 10,
		finishedAt: 11,
		limitations: [...LIMITS],
		consistency: "not-checked" as const,
		status: "available" as const,
		data: value,
	};
}

function catalogReader(summaries: SessionSummary[], traces: Map<string, SessionTrace>, entryCall?: () => void, traceCall?: (file: string) => void): OmpStatsClient {
	return {
		async sync() {
			return { scope: { source: "omp-stats", view: "sync" }, startedAt: 1, finishedAt: 2, limitations: [], consistency: "not-checked", status: "available", data: {} };
		},
		async listSessions(limit) {
			return {
				scope: { source: "omp-stats", view: "session-list" },
				startedAt: 1,
				finishedAt: 2,
				limitations: summaries.length >= limit ? ["bounded-session-list", "list-limit-reached"] : ["bounded-session-list"],
				consistency: "not-checked",
				status: "available",
				data: summaries.slice(0, limit),
			};
		},
		async getTrace(file) {
			traceCall?.(file);
			const value = traces.get(file);
			if (!value) return { scope: { source: "omp-stats", view: "active-branch-trace" }, startedAt: 1, finishedAt: 2, limitations: [...LIMITS], consistency: "not-checked", status: "unavailable", reason: "http", httpStatus: 404 };
			return availableTrace(value);
		},
		async getEntry() {
			entryCall?.();
			throw new Error("selected entry should not be read by the trace-only scan");
		},
	};
}

test("scan parsing keeps historical scan separate from explicit-session reports", () => {
	assert.deepEqual(parseAssuranceArgs(["scan", "--limit", "250", "--folder", "omp-kit", "--since", "2026-09-01T00:00:00Z", "--json"]), {
		command: "scan",
		json: true,
		limit: 250,
		folder: "omp-kit",
		since: Date.parse("2026-09-01T00:00:00Z"),
		full: false,
	});
	assert.throws(() => parseAssuranceArgs(["scan", "--session", "/private/a.jsonl"]));
	assert.throws(() => parseAssuranceArgs(["--key", "not-a-key"]));
});

test("default history scan preserves tool-error evidence without selected-entry enrichment", async () => {
	const a = "/private/a.jsonl";
	const b = "/private/b.jsonl";
	let entryCalls = 0;
	const reader = catalogReader(
		[summary(a, 200), summary(b, 100)],
		new Map([[a, trace(a, [span({ isError: true })])], [b, trace(b, [span()])]]),
		() => { entryCalls += 1; },
	);
	const result = await scanAssuranceReports(reader, {
		command: "scan",
		json: true,
		limit: 1000,
		folder: null,
		since: null,
		full: false,
	});
	assert.equal(entryCalls, 0);
	assert.equal(result.incomplete, false);
	assert.equal(result.report.mode, "trace-only");
	assert.equal(result.report.sessions.scanned, 2);
	assert.equal(result.report.sessions.candidates, 0);
	assert.equal(result.report.totals.attentionFindings, 0);
	assert.equal(result.report.findingCounts["tool-error:tool-reported-error"], 1);
	assert.doesNotMatch(JSON.stringify(result.report), /\/private\//);
});

test("scan applies since and summary-folder filters before trace reads", async () => {
	const a = "/private/a.jsonl";
	const b = "/private/b.jsonl";
	let traceCalls = 0;
	const reader = catalogReader(
		[summary(a, 200, "/work/target"), summary(b, 200, "/work/other")],
		new Map([[a, trace(a, [span()], "/stale/trace-cwd")], [b, trace(b, [span()], "/work/other")]]),
		undefined,
		() => { traceCalls += 1; },
	);
	const result = await scanAssuranceReports(reader, {
		command: "scan",
		json: false,
		limit: 2,
		folder: "/work/target",
		since: 150,
		full: false,
	});
	assert.equal(traceCalls, 1);
	assert.equal(result.report.sessions.scanned, 1);
	assert.deepEqual(result.report.discovery.limitations, ["bounded-session-list", "list-limit-reached"]);
	assert.equal(result.report.filters.folderApplied, true);
	assert.equal(result.report.filters.since, 150);
});

test("full scan prefilters unsupported tool names before selected-entry reads", async () => {
	const file = "/private/bash-only.jsonl";
	let entryCalls = 0;
	const reader = catalogReader(
		[summary(file, 200)],
		new Map([[file, trace(file, [span({ label: "bash" })])]]),
		() => { entryCalls += 1; },
	);
	const result = await scanAssuranceReports(reader, {
		command: "scan",
		json: true,
		limit: 1000,
		folder: null,
		since: null,
		full: true,
	});
	assert.equal(entryCalls, 0);
	assert.equal(result.report.performance?.scope.candidates, 1);
	assert.equal(result.report.performance?.scope.prefilteredUnsupported, 1);
	assert.equal(result.report.performance?.scope.recoveryAttempts, 0);
	assert.equal(result.report.performance?.scope.entryReadRequests, 0);
});

test("scan keys can be resolved for a later full single-session drill-down without exposing paths", async () => {
	const file = "/private/history/session.jsonl";
	const reader = catalogReader([summary(file, 200)], new Map([[file, trace(file, [])]]));
	const scan = await runAssuranceCli(["scan", "--json"], reader);
	assert.equal(scan.exitCode, 0);
	const key = JSON.parse(scan.output).candidates.length > 0 ? JSON.parse(scan.output).candidates[0].key : sessionKey(file);
	const deep = await runAssuranceCli(["--key", key, "--json"], reader);
	assert.equal(deep.exitCode, 0);
	assert.equal(JSON.parse(deep.output).schemaVersion, "omp-kit.session-assurance/v1");
	assert.doesNotMatch(deep.output, /\/private\/history/);
});
