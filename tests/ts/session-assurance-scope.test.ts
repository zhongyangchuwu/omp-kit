import { test } from "bun:test";
import assert from "node:assert/strict";
import type { SessionTrace, TraceSpan, TraceTrack } from "@oh-my-pi/omp-stats/shared-types";
import { buildAssuranceReport } from "../../src/assurance/engine";
import { renderAssuranceReport } from "../../src/assurance/render";
import { scopeExpansionRule } from "../../src/assurance/rules/scope-expansion";
import { deriveTraceScopeEvidence } from "../../src/assurance/scope/derive";
import { BUILTIN_SCOPE_CLASSIFIERS } from "../../src/assurance/scope/registry";
import { normalizeTraceReads, type TraceInput } from "../../src/assurance/trace-observations";
import type { SessionEntryReader } from "../../src/session/omp-stats";

const file = "/home/test/project/session.jsonl";

function toolSpan(id: string, toolCallId: string, entryId: string, label: string, start: number): TraceSpan {
	return { id, kind: "tool", start, end: start + 1, label, toolCallId, entryId };
}

function track(id: string, spans: TraceSpan[], trackFile = file, parentId: string | null = null): TraceTrack {
	return { id, parentId, label: id, agent: null, model: null, file: trackFile, spans, markers: [] };
}

function trace(tracks: TraceTrack[], cwd = "/home/test/project"): SessionTrace {
	return {
		file,
		cwd,
		title: "PRIVATE_TITLE",
		startedAt: 1,
		endedAt: 20,
		mtimeMs: 21, etag: "test-etag", etag: "test-etag",
		tracks,
		summary: { wallMs: 19, modelMs: 0, toolMs: 1, idleMs: 18, turns: 1, requests: 1,
			toolCalls: tracks.flatMap(value => value.spans).filter(span => span.kind === "tool").length,
			subagents: Math.max(0, tracks.length - 1), totalTokens: 0, costTotal: 0, unpricedRequests: 0, toolStats: [] },
	};
}

function input(value: SessionTrace): TraceInput {
	return { sourceId: "session", sessionFile: file, read: { scope: { source: "omp-stats", view: "active-branch-trace" },
		startedAt: 1, finishedAt: 2, limitations: [], consistency: "not-checked", status: "available", data: value } };
}

function unavailableInput(): TraceInput {
	return { sourceId: "session", sessionFile: file, read: { scope: { source: "omp-stats", view: "active-branch-trace" },
		startedAt: 1, finishedAt: 2, limitations: [], consistency: "not-checked", status: "unavailable", reason: "http", httpStatus: 500 } };
}

function entryReader(entries: Record<string, unknown>): SessionEntryReader {
	return {
		async getEntry(_file, id) {
			const entry = entries[id];
			return entry === undefined
				? { scope: { source: "omp-stats", view: "selected-entry" }, startedAt: 1, finishedAt: 2, limitations: [], consistency: "not-checked", status: "unavailable", reason: "http", httpStatus: 404 }
				: { scope: { source: "omp-stats", view: "selected-entry" }, startedAt: 1, finishedAt: 2, limitations: [], consistency: "not-checked", status: "available", data: { entry } };
		},
	};
}

function chain(callId: string, toolName: string, args: Record<string, unknown>, suffix: string): Record<string, unknown> {
	return {
		[`result-${suffix}`]: { id: `result-${suffix}`, parentId: `start-${suffix}`, type: "message", message: { role: "toolResult", toolCallId: callId, toolName } },
		[`start-${suffix}`]: { id: `start-${suffix}`, parentId: `assistant-${suffix}`, type: "custom", customType: "tool_execution_start", data: { toolCallId: callId } },
		[`assistant-${suffix}`]: { id: `assistant-${suffix}`, parentId: null, type: "message", message: { role: "assistant",
			content: [{ type: "toolCall", id: callId, name: toolName, arguments: args }] } },
	};
}

async function scopeFor(value: SessionTrace, entries: Record<string, unknown>, reader: SessionEntryReader | null = entryReader(entries)) {
	const source = input(value);
	const normalized = normalizeTraceReads([source]);
	return deriveTraceScopeEvidence([source], normalized, reader ?? undefined, BUILTIN_SCOPE_CLASSIFIERS, { homeDir: "/home/test" });
}

test("scope enrichment follows result -> start -> assistant entry chain without retaining raw arguments", async () => {
	const value = trace([track("main", [toolSpan("s1", "c1", "result-one", "read", 1)])]);
	const scope = await scopeFor(value, chain("c1", "read", { path: "/home/test/project/PRIVATE_SECRET.ts" }, "one"));
	assert.equal(scope.traceCoverage, "available");
	assert.deepEqual(scope.observations.map(item => [item.boundary, item.access, item.resource]), [["workspace", "read", "filesystem"]]);
	assert.equal(scope.actionCoverage[0].status, "classified");
	assert.doesNotMatch(JSON.stringify(scope), /PRIVATE_SECRET/);
});

test("path classifier distinguishes workspace, host-user, host-system and external reads", async () => {
	const spans = [
		toolSpan("s1", "c1", "result-one", "read", 1),
		toolSpan("s2", "c2", "result-two", "read", 3),
		toolSpan("s3", "c3", "result-three", "read", 5),
		toolSpan("s4", "c4", "result-four", "read", 7),
	];
	const entries = {
		...chain("c1", "read", { path: "src/a.ts" }, "one"),
		...chain("c2", "read", { path: "/home/test/.config/tool" }, "two"),
		...chain("c3", "read", { path: "/etc/hosts" }, "three"),
		...chain("c4", "read", { path: "https://example.com/data" }, "four"),
	};
	const scope = await scopeFor(trace([track("main", spans)]), entries);
	assert.deepEqual(new Set(scope.observations.map(item => item.boundary)), new Set(["workspace", "host-user", "host-system", "external"]));
});

test("file write, hashline edit, GitHub and web search use tool contracts rather than preview text", async () => {
	const spans = [
		toolSpan("s1", "c1", "result-one", "write", 1),
		toolSpan("s2", "c2", "result-two", "edit", 3),
		toolSpan("s3", "c3", "result-three", "github", 5),
		toolSpan("s4", "c4", "result-four", "web_search", 7),
	];
	const entries = {
		...chain("c1", "write", { path: "src/new.ts", content: "PRIVATE_CONTENT" }, "one"),
		...chain("c2", "edit", { input: "[src/a.ts#1A2B]\nPUT 1.=1:\n+changed" }, "two"),
		...chain("c3", "github", { op: "pr_create", title: "PRIVATE_TITLE" }, "three"),
		...chain("c4", "web_search", { query: "PRIVATE_QUERY" }, "four"),
	};
	const scope = await scopeFor(trace([track("main", spans)]), entries);
	assert.ok(scope.observations.some(item => item.boundary === "workspace" && item.access === "write" && item.resource === "filesystem"));
	assert.ok(scope.observations.some(item => item.boundary === "external" && item.access === "write" && item.resource === "service"));
	assert.ok(scope.observations.some(item => item.boundary === "external" && item.access === "read" && item.resource === "service"));
	assert.doesNotMatch(JSON.stringify(scope), /PRIVATE_(CONTENT|TITLE|QUERY)/);
});

test("generic shell remains explicitly unclassified even when its command looks recognizable", async () => {
	const value = trace([track("main", [toolSpan("s1", "c1", "result-one", "bash", 1)])]);
	const scope = await scopeFor(value, chain("c1", "bash", { command: "git push origin main" }, "one"));
	assert.equal(scope.observations.length, 0);
	assert.equal(scope.actionCoverage[0].status, "unclassified");
	assert.equal(scope.actionCoverage[0].reason, "unsupported-tool");
});

test("missing entry reader is coverage loss rather than zero scope", async () => {
	const value = trace([track("main", [toolSpan("s1", "c1", "result-one", "read", 1)])]);
	const scope = await scopeFor(value, {}, null);
	assert.equal(scope.traceCoverage, "available");
	assert.equal(scope.observations.length, 0);
	assert.equal(scope.actionCoverage[0].reason, "entry-reader-unavailable");
});

test("throwing entry reads are bounded as unavailable tool input", async () => {
	const value = trace([track("main", [toolSpan("s1", "c1", "result-one", "read", 1)])]);
	const scope = await scopeFor(value, {}, { async getEntry() { throw new Error("PRIVATE_ENTRY_FAILURE"); } });
	assert.equal(scope.observations.length, 0);
	assert.equal(scope.actionCoverage[0].reason, "tool-input-unavailable");
	assert.doesNotMatch(JSON.stringify(scope), /PRIVATE_ENTRY_FAILURE/);
});

test("successful empty trace is assessed while failed trace is not", async () => {
	const emptySource = input(trace([track("main", [])]));
	const emptyNormalized = normalizeTraceReads([emptySource]);
	const emptyScope = await deriveTraceScopeEvidence([emptySource], emptyNormalized, entryReader({}), BUILTIN_SCOPE_CLASSIFIERS, { homeDir: "/home/test" });
	const emptyReport = buildAssuranceReport({ ...emptyNormalized, scope: emptyScope }, [scopeExpansionRule]);
	assert.equal(emptyScope.traceCoverage, "available");
	assert.equal(emptyReport.rules[0].status, "evaluated");
	assert.match(renderAssuranceReport(emptyReport, [scopeExpansionRule]), /Observed boundaries: none classified/);

	const failedSource = unavailableInput();
	const failedNormalized = normalizeTraceReads([failedSource]);
	const failedScope = await deriveTraceScopeEvidence([failedSource], failedNormalized, entryReader({}), BUILTIN_SCOPE_CLASSIFIERS, { homeDir: "/home/test" });
	const failedReport = buildAssuranceReport({ ...failedNormalized, scope: failedScope }, [scopeExpansionRule]);
	assert.equal(failedScope.traceCoverage, "unavailable");
	assert.equal(failedReport.rules[0].status, "skipped");
	assert.match(renderAssuranceReport(failedReport, [scopeExpansionRule]), /Scope\n  NOT ASSESSED/);
});

test("child absolute paths are not compared with the root cwd", async () => {
	const childFile = "/home/test/project/child.jsonl";
	const child = track("child", [toolSpan("s1", "c1", "result-one", "read", 1)], childFile, "main");
	const scope = await scopeFor(trace([track("main", []), child]), chain("c1", "read", { path: "/home/test/project/src/a.ts" }, "one"));
	assert.equal(scope.observations[0].boundary, "host-user");
	assert.ok(scope.limitations.includes("child-workspace-root-unverified"));
});

test("scope expansion is per-track first appearance, not a risk ranking or cross-track order", async () => {
	const childFile = "/home/test/project/child.jsonl";
	const main = track("main", [
		toolSpan("m1", "c1", "result-one", "read", 1),
		toolSpan("m2", "c2", "result-two", "web_search", 5),
	]);
	const child = track("child", [toolSpan("c1", "c3", "result-three", "web_search", 2)], childFile, "main");
	const entries = {
		...chain("c1", "read", { path: "src/a.ts" }, "one"),
		...chain("c2", "web_search", { query: "x" }, "two"),
		...chain("c3", "web_search", { query: "y" }, "three"),
	};
	const source = input(trace([main, child]));
	const normalized = normalizeTraceReads([source]);
	const scope = await deriveTraceScopeEvidence([source], normalized, entryReader(entries), BUILTIN_SCOPE_CLASSIFIERS, { homeDir: "/home/test" });
	const report = buildAssuranceReport({ ...normalized, scope }, [scopeExpansionRule]);
	assert.deepEqual(report.findings.map(item => item.code), ["new-boundary-external"]);
	assert.equal(report.rules[0].status, "evaluated");
});

test("partial scope classification makes expansion partial and renderer exposes classification coverage", async () => {
	const spans = [
		toolSpan("s1", "c1", "result-one", "read", 1),
		toolSpan("s2", "c2", "result-two", "bash", 3),
		toolSpan("s3", "c3", "result-three", "web_search", 5),
	];
	const entries = {
		...chain("c1", "read", { path: "src/a.ts" }, "one"),
		...chain("c2", "bash", { command: "echo hi" }, "two"),
		...chain("c3", "web_search", { query: "x" }, "three"),
	};
	const source = input(trace([track("main", spans)]));
	const normalized = normalizeTraceReads([source]);
	const scope = await deriveTraceScopeEvidence([source], normalized, entryReader(entries), BUILTIN_SCOPE_CLASSIFIERS, { homeDir: "/home/test" });
	const report = buildAssuranceReport({ ...normalized, scope }, [scopeExpansionRule]);
	assert.equal(report.rules[0].status, "partial");
	const rendered = renderAssuranceReport(report, [scopeExpansionRule]);
	assert.match(rendered, /Trace coverage: available/);
	assert.match(rendered, /Observed boundaries: workspace, external/);
	assert.match(rendered, /Tool actions classified: 2/);
	assert.match(rendered, /Tool actions unclassified: 1/);
	assert.match(rendered, /Observed scope is not requested or authorized scope/);
});
