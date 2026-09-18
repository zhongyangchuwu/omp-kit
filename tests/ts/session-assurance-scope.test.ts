import { test } from "bun:test";
import assert from "node:assert/strict";
import type { SessionTrace, TraceSpan, TraceTrack } from "@oh-my-pi/omp-stats/shared-types";
import { buildAssuranceReport } from "../../src/assurance/engine";
import { renderAssuranceReport } from "../../src/assurance/render";
import { crossBoundaryWriteRule, scopeExpansionRule } from "../../src/assurance/rules/scope-expansion";
import { deriveTraceActionFacts } from "../../src/assurance/scope/derive";
import { BUILTIN_ACTION_CLASSIFIERS } from "../../src/assurance/scope/registry";
import { normalizeTraceReads, type TraceInput } from "../../src/assurance/trace-observations";
import type {
	ActionFacts,
	BoundaryObservation,
	OperationObservation,
	OperationType,
	ResourceObservation,
	ScopeBoundary,
} from "../../src/assurance/scope/model";
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
		mtimeMs: 21,
		etag: "test-etag",
		tracks,
		summary: {
			wallMs: 19,
			modelMs: 0,
			toolMs: 1,
			idleMs: 18,
			turns: 1,
			requests: 1,
			toolCalls: tracks.flatMap(value => value.spans).filter(span => span.kind === "tool").length,
			subagents: Math.max(0, tracks.length - 1),
			totalTokens: 0,
			costTotal: 0,
			unpricedRequests: 0,
			toolStats: [],
		},
	};
}

function input(value: SessionTrace): TraceInput {
	return {
		sourceId: "session",
		sessionFile: file,
		read: {
			scope: { source: "omp-stats", view: "active-branch-trace" },
			startedAt: 1,
			finishedAt: 2,
			limitations: [],
			consistency: "not-checked",
			status: "available",
			data: value,
		},
	};
}

function unavailableInput(): TraceInput {
	return {
		sourceId: "session",
		sessionFile: file,
		read: {
			scope: { source: "omp-stats", view: "active-branch-trace" },
			startedAt: 1,
			finishedAt: 2,
			limitations: [],
			consistency: "not-checked",
			status: "unavailable",
			reason: "http",
			httpStatus: 500,
		},
	};
}

function entryReader(entries: Record<string, unknown>): SessionEntryReader {
	return {
		async getEntry(_file, id) {
			const entry = entries[id];
			return entry === undefined
				? {
					scope: { source: "omp-stats", view: "selected-entry" },
					startedAt: 1,
					finishedAt: 2,
					limitations: [],
					consistency: "not-checked",
					status: "unavailable",
					reason: "http",
					httpStatus: 404,
				}
				: {
					scope: { source: "omp-stats", view: "selected-entry" },
					startedAt: 1,
					finishedAt: 2,
					limitations: [],
					consistency: "not-checked",
					status: "available",
					data: { entry },
				};
		},
	};
}

function chain(callId: string, toolName: string, args: Record<string, unknown>, suffix: string): Record<string, unknown> {
	return {
		[`result-${suffix}`]: {
			id: `result-${suffix}`,
			parentId: `start-${suffix}`,
			type: "message",
			message: { role: "toolResult", toolCallId: callId, toolName },
		},
		[`start-${suffix}`]: {
			id: `start-${suffix}`,
			parentId: `assistant-${suffix}`,
			type: "custom",
			customType: "tool_execution_start",
			data: { toolCallId: callId },
		},
		[`assistant-${suffix}`]: {
			id: `assistant-${suffix}`,
			parentId: null,
			type: "message",
			message: {
				role: "assistant",
				content: [{ type: "toolCall", id: callId, name: toolName, arguments: args }],
			},
		},
	};
}

async function factsFor(
	value: SessionTrace,
	entries: Record<string, unknown>,
	reader: SessionEntryReader | null = entryReader(entries),
): Promise<ActionFacts> {
	const source = input(value);
	const normalized = normalizeTraceReads([source]);
	return deriveTraceActionFacts(
		[source],
		normalized,
		reader ?? undefined,
		BUILTIN_ACTION_CLASSIFIERS,
		{ homeDir: "/home/test" },
	);
}

test("structured tool classification projects independent boundary operation and resource facts", async () => {
	const value = trace([track("main", [toolSpan("s1", "c1", "result-one", "read", 1)])]);
	const facts = await factsFor(value, chain("c1", "read", { path: "/home/test/project/PRIVATE_SECRET.ts" }, "one"));
	assert.equal(facts.traceCoverage, "available");
	assert.deepEqual(facts.boundaries.map(item => item.boundary), ["workspace"]);
	assert.deepEqual(facts.operations.map(item => item.operation), ["read"]);
	assert.deepEqual(facts.resources.map(item => item.resource), ["filesystem"]);
	assert.equal(facts.boundaries[0].groupId, facts.operations[0].groupId);
	assert.equal(facts.operations[0].groupId, facts.resources[0].groupId);
	assert.equal(facts.actionCoverage[0].status, "classified");
	assert.doesNotMatch(JSON.stringify(facts), /PRIVATE_SECRET/);
});

test("path classifier distinguishes workspace host-user host-system and external boundaries", async () => {
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
	const facts = await factsFor(trace([track("main", spans)]), entries);
	assert.deepEqual(
		new Set(facts.boundaries.map(item => item.boundary)),
		new Set(["workspace", "host-user", "host-system", "external"]),
	);
	assert.deepEqual(new Set(facts.operations.map(item => item.operation)), new Set(["read"]));
});

test("file write GitHub and web search facts remain independent and private", async () => {
	const spans = [
		toolSpan("s1", "c1", "result-one", "write", 1),
		toolSpan("s2", "c2", "result-two", "github", 3),
		toolSpan("s3", "c3", "result-three", "web_search", 5),
	];
	const entries = {
		...chain("c1", "write", { path: "src/new.ts", content: "PRIVATE_CONTENT" }, "one"),
		...chain("c2", "github", { op: "pr_create", title: "PRIVATE_TITLE" }, "two"),
		...chain("c3", "web_search", { query: "PRIVATE_QUERY" }, "three"),
	};
	const facts = await factsFor(trace([track("main", spans)]), entries);
	assert.ok(facts.boundaries.some(item => item.boundary === "workspace"));
	assert.ok(facts.boundaries.some(item => item.boundary === "external"));
	assert.ok(facts.operations.some(item => item.operation === "write"));
	assert.ok(facts.operations.some(item => item.operation === "read"));
	assert.ok(facts.resources.some(item => item.resource === "filesystem"));
	assert.ok(facts.resources.some(item => item.resource === "service"));
	assert.doesNotMatch(JSON.stringify(facts), /PRIVATE_(CONTENT|TITLE|QUERY)/);
});

test("generic shell remains explicitly unclassified", async () => {
	const value = trace([track("main", [toolSpan("s1", "c1", "result-one", "bash", 1)])]);
	const facts = await factsFor(value, chain("c1", "bash", { command: "git push origin main" }, "one"));
	assert.equal(facts.boundaries.length, 0);
	assert.equal(facts.operations.length, 0);
	assert.equal(facts.resources.length, 0);
	assert.equal(facts.actionCoverage[0].status, "unclassified");
	assert.equal(facts.actionCoverage[0].reason, "unsupported-tool");
});

test("missing or failing entry access is coverage loss rather than empty classified facts", async () => {
	const value = trace([track("main", [toolSpan("s1", "c1", "result-one", "read", 1)])]);
	const missing = await factsFor(value, {}, null);
	assert.equal(missing.traceCoverage, "available");
	assert.equal(missing.boundaries.length, 0);
	assert.equal(missing.operations.length, 0);
	assert.equal(missing.actionCoverage[0].reason, "entry-reader-unavailable");

	const failed = await factsFor(value, {}, { async getEntry() { throw new Error("PRIVATE_ENTRY_FAILURE"); } });
	assert.equal(failed.boundaries.length, 0);
	assert.equal(failed.operations.length, 0);
	assert.equal(failed.actionCoverage[0].reason, "tool-input-unavailable");
	assert.doesNotMatch(JSON.stringify(failed), /PRIVATE_ENTRY_FAILURE/);
});

test("successful empty trace is assessed while failed trace is not", async () => {
	const emptySource = input(trace([track("main", [])]));
	const emptyNormalized = normalizeTraceReads([emptySource]);
	const emptyFacts = await deriveTraceActionFacts(
		[emptySource],
		emptyNormalized,
		entryReader({}),
		BUILTIN_ACTION_CLASSIFIERS,
		{ homeDir: "/home/test" },
	);
	const emptyReport = buildAssuranceReport({ ...emptyNormalized, actionFacts: emptyFacts }, [scopeExpansionRule]);
	assert.equal(emptyFacts.traceCoverage, "available");
	assert.equal(emptyReport.rules[0].status, "evaluated");
	assert.match(renderAssuranceReport(emptyReport, [scopeExpansionRule]), /Boundaries[\s\S]*none classified/);

	const failedSource = unavailableInput();
	const failedNormalized = normalizeTraceReads([failedSource]);
	const failedFacts = await deriveTraceActionFacts(
		[failedSource],
		failedNormalized,
		entryReader({}),
		BUILTIN_ACTION_CLASSIFIERS,
		{ homeDir: "/home/test" },
	);
	const failedReport = buildAssuranceReport({ ...failedNormalized, actionFacts: failedFacts }, [scopeExpansionRule]);
	assert.equal(failedFacts.traceCoverage, "unavailable");
	assert.equal(failedReport.rules[0].status, "skipped");
	assert.match(renderAssuranceReport(failedReport, [scopeExpansionRule]), /Assessment incomplete[\s\S]*HTTP failure/);
});

test("child absolute paths are not compared with the root cwd", async () => {
	const childFile = "/home/test/project/child.jsonl";
	const child = track("child", [toolSpan("s1", "c1", "result-one", "read", 1)], childFile, "main");
	const facts = await factsFor(
		trace([track("main", []), child]),
		chain("c1", "read", { path: "/home/test/project/src/a.ts" }, "one"),
	);
	assert.equal(facts.boundaries[0].boundary, "host-user");
	assert.ok(facts.limitations.includes("child-workspace-root-unverified"));
});

test("read-only boundary expansion stays supporting evidence", async () => {
	const main = track("main", [
		toolSpan("m1", "c1", "result-one", "read", 1),
		toolSpan("m2", "c2", "result-two", "web_search", 5),
	]);
	const entries = {
		...chain("c1", "read", { path: "src/a.ts" }, "one"),
		...chain("c2", "web_search", { query: "x" }, "two"),
	};
	const source = input(trace([main]));
	const normalized = normalizeTraceReads([source]);
	const actionFacts = await deriveTraceActionFacts(
		[source],
		normalized,
		entryReader(entries),
		BUILTIN_ACTION_CLASSIFIERS,
		{ homeDir: "/home/test" },
	);
	const report = buildAssuranceReport(
		{ ...normalized, actionFacts },
		[scopeExpansionRule, crossBoundaryWriteRule],
	);
	assert.deepEqual(report.findings.map(item => item.code), ["new-boundary-external"]);
	assert.equal(report.rules.find(item => item.ruleId === "omp-kit.scope-expansion")?.presentation.section, "evidence");
	assert.equal(report.rules.find(item => item.ruleId === "omp-kit.cross-boundary-write")?.findings.length, 0);
	const rendered = renderAssuranceReport(report, [scopeExpansionRule, crossBoundaryWriteRule]);
	assert.match(rendered, /✓ Nothing needs review/);
	assert.match(rendered, /Boundaries[\s\S]*workspace, external/);
	assert.match(rendered, /Operations[\s\S]*read/);
	assert.match(rendered, /Supporting observations[\s\S]*Scope boundary observations: 1/);
});

function syntheticFacts(
	operation: OperationType,
	boundary: Exclude<ScopeBoundary, "unknown"> = "external",
): ActionFacts {
	const base = {
		actionId: "action-baseline",
		groupId: "group-baseline",
		trackKey: "track-main",
		position: 0,
		classifier: { id: "test.action", version: 1 },
		evidence: [{ sourceId: "test", sessionKey: "session", trackId: "main", spanId: "baseline" }],
	};
	const expansion = {
		actionId: "action-expansion",
		groupId: "group-expansion",
		trackKey: "track-main",
		position: 1,
		classifier: { id: "test.action", version: 1 },
		evidence: [{ sourceId: "test", sessionKey: "session", trackId: "main", spanId: "expansion" }],
	};
	const boundaries: BoundaryObservation[] = [
		{ ...base, id: "boundary-baseline", boundary: boundary === "workspace" ? "external" : "workspace" },
		{ ...expansion, id: "boundary-expansion", boundary },
	];
	const operations: OperationObservation[] = [
		{ ...base, id: "operation-baseline", operation: "read" },
		{ ...expansion, id: "operation-expansion", operation },
	];
	const resources: ResourceObservation[] = [
		{ ...base, id: "resource-baseline", resource: "filesystem" },
		{ ...expansion, id: "resource-expansion", resource: boundary === "external" ? "service" : "filesystem" },
	];
	return {
		traceCoverage: "available",
		boundaries,
		operations,
		resources,
		actionCoverage: [
			{ actionId: "action-baseline", trackKey: "track-main", position: 0, status: "classified", evidence: [] },
			{ actionId: "action-expansion", trackKey: "track-main", position: 1, status: "classified", evidence: [] },
		],
		limitations: [],
	};
}

test("cross-boundary writes are Attention while read execute unknown and workspace writes are not", () => {
	for (const boundary of ["host-user", "host-system", "external"] as const) {
		const actionFacts = syntheticFacts("write", boundary);
		const inputValue = { actions: [], coverage: [], actionFacts };
		assert.equal(crossBoundaryWriteRule.evaluate(inputValue).findings.length, 1);
		assert.equal(scopeExpansionRule.evaluate(inputValue).findings.length, 1);
	}

	for (const operation of ["read", "execute", "unknown"] as const) {
		const actionFacts = syntheticFacts(operation, "external");
		const inputValue = { actions: [], coverage: [], actionFacts };
		assert.equal(crossBoundaryWriteRule.evaluate(inputValue).findings.length, 0);
		assert.equal(scopeExpansionRule.evaluate(inputValue).findings.length, 1);
	}

	const workspaceWrite = { actions: [], coverage: [], actionFacts: syntheticFacts("write", "workspace") };
	assert.equal(crossBoundaryWriteRule.evaluate(workspaceWrite).findings.length, 0);
	assert.equal(scopeExpansionRule.evaluate(workspaceWrite).findings.length, 1);
});

test("multi-effect action keeps boundary-operation pairing through group correlation", async () => {
	const spans = [
		toolSpan("s1", "c1", "result-one", "read", 1),
		toolSpan("s2", "c2", "result-two", "github", 3),
	];
	const entries = {
		...chain("c1", "read", { path: "src/a.ts" }, "one"),
		...chain("c2", "github", { op: "pr_checkout" }, "two"),
	};
	const source = input(trace([track("main", spans)]));
	const normalized = normalizeTraceReads([source]);
	const actionFacts = await deriveTraceActionFacts(
		[source],
		normalized,
		entryReader(entries),
		BUILTIN_ACTION_CLASSIFIERS,
		{ homeDir: "/home/test" },
	);
	const report = buildAssuranceReport(
		{ ...normalized, actionFacts },
		[scopeExpansionRule, crossBoundaryWriteRule],
	);
	const attention = report.findings.filter(item => item.ruleId === "omp-kit.cross-boundary-write");
	assert.deepEqual(attention.map(item => item.code), ["new-boundary-host-user-write"]);
	assert.ok(report.findings.some(item => item.code === "new-boundary-external"));
	assert.ok(report.findings.some(item => item.code === "new-boundary-host-user"));
	assert.doesNotMatch(JSON.stringify(attention), /new-boundary-external-write/);
});

test("partial action classification remains visible without guessing missing facts", async () => {
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
	const actionFacts = await deriveTraceActionFacts(
		[source],
		normalized,
		entryReader(entries),
		BUILTIN_ACTION_CLASSIFIERS,
		{ homeDir: "/home/test" },
	);
	const report = buildAssuranceReport({ ...normalized, actionFacts }, [scopeExpansionRule]);
	assert.equal(report.rules[0].status, "partial");
	const rendered = renderAssuranceReport(report, [scopeExpansionRule]);
	assert.match(rendered, /Visibility/);
	assert.match(rendered, /Boundaries[\s\S]*workspace, external/);
	assert.match(rendered, /Operations[\s\S]*read/);
	assert.match(rendered, /Trace tools: 2 classified · 1 unclassified/);
	assert.match(rendered, /not a task-quality, authorization, or safety verdict/);
});
