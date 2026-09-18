import { test } from "bun:test";
import assert from "node:assert/strict";
import { buildAssuranceReport } from "../../src/assurance/engine";
import { deriveRuntimeEvidence, runtimeSourceCoverage } from "../../src/assurance/runtime-facts";
import { renderAssuranceReport } from "../../src/assurance/render";
import { BUILTIN_ASSURANCE_RULES } from "../../src/assurance/registry";
import { readRuntimeEntries, type RuntimeEntrySource } from "../../src/session/runtime-entries";

type Entry = {
	id: string;
	parentId: string | null;
	type: string;
	timestamp: string;
	message?: unknown;
};

const root: Entry = { id: "root", parentId: null, type: "message", timestamp: "2026-09-18T10:00:00Z" };
const discarded: Entry = {
	id: "discarded",
	parentId: "root",
	type: "message",
	timestamp: "2026-09-18T10:01:00Z",
	message: {
		role: "assistant",
		content: [{
			type: "toolCall",
			id: "web-call",
			name: "web_search",
			arguments: { query: "PRIVATE_RETAINED_QUERY" },
		}],
	},
};
const discardedResult: Entry = {
	id: "discarded-result",
	parentId: "discarded",
	type: "message",
	timestamp: "2026-09-18T10:01:30Z",
	message: {
		role: "toolResult",
		toolCallId: "web-call",
		toolName: "web_search",
		isError: false,
		content: [{ type: "text", text: "PRIVATE_RETAINED_RESULT" }],
	},
};
const current: Entry = { id: "current", parentId: "root", type: "message", timestamp: "2026-09-18T10:02:00Z" };
const cancelled: Entry = {
	id: "cancel-result",
	parentId: "current",
	type: "message",
	timestamp: "2026-09-18T10:03:00Z",
	message: {
		role: "toolResult",
		toolName: "hub",
		details: {
			op: "cancel",
			cancelled: [{ id: "CodeBoundaryScout", status: "cancelled" }],
			jobs: [{ id: "CodeBoundaryScout", type: "task", status: "cancelled", label: "CodeBoundaryScout", durationMs: 941000 }],
		},
	},
};

function source(): RuntimeEntrySource<Entry> {
	const retained = [root, discarded, discardedResult, current, cancelled];
	return {
		getSessionId: () => "session-1",
		getSessionFile: () => "/sessions/session-1.jsonl",
		getLeafId: () => "cancel-result",
		getBranch: () => [root, current, cancelled],
		getEntries: () => retained,
	};
}

test("retained runtime facts preserve active/off-branch identity and terminal cancellation", () => {
	const active = readRuntimeEntries(source(), "active-branch-entries", () => 10);
	const retained = readRuntimeEntries(source(), "all-retained-entries", () => 10);
	const runtime = deriveRuntimeEvidence(retained, active);
	assert.ok(runtime);
	assert.equal(runtime.retainedTree, true);
	assert.deepEqual(runtime.entries.map(item => [item.id, item.branch]), [
		["root", "active"],
		["discarded", "off-branch"],
		["discarded-result", "off-branch"],
		["current", "active"],
		["cancel-result", "active"],
	]);
	assert.deepEqual(runtime.jobResolutions.map(item => ({
		jobId: item.jobId,
		status: item.status,
		branch: item.branch,
	})), [{ jobId: "CodeBoundaryScout", status: "cancelled", branch: "active" }]);
	assert.ok(runtime.limitations.includes("child-retained-history-unavailable"));
});

test("full retained-tree facts classify structured off-branch tools without persisting raw arguments or results", () => {
	const active = readRuntimeEntries(source(), "active-branch-entries", () => 10);
	const retained = readRuntimeEntries(source(), "all-retained-entries", () => 10);
	const runtime = deriveRuntimeEvidence(retained, active, {
		classifyTools: true,
		workspaceRoot: "/workspace/project",
		homeDir: "/home/user",
	});
	assert.ok(runtime);
	assert.deepEqual(runtime.toolActions.map(action => ({
		toolName: action.toolName,
		branch: action.branch,
		terminal: action.terminal,
		errorReported: action.errorReported,
		scopeStatus: action.scopeStatus,
		scopes: action.scopes,
	})), [{
		toolName: "web_search",
		branch: "off-branch",
		terminal: "observed",
		errorReported: false,
		scopeStatus: "classified",
		scopes: [{ boundary: "external", access: "read", resource: "service" }],
	}]);
	const serialized = JSON.stringify(runtime);
	assert.doesNotMatch(serialized, /PRIVATE_RETAINED_QUERY|PRIVATE_RETAINED_RESULT/);
	assert.ok(runtime.limitations.includes("retained-tool-scope-declared-targets-only"));
	assert.ok(runtime.limitations.includes("retained-workspace-root-unverified"));
	assert.ok(runtime.limitations.includes("retained-generic-shell-unclassified"));
});

test("simple runtime projection does not pretend retained tool scope was assessed", () => {
	const active = readRuntimeEntries(source(), "active-branch-entries", () => 10);
	const runtime = deriveRuntimeEvidence(active);
	assert.ok(runtime);
	assert.deepEqual(runtime.toolActions, []);
	assert.equal(runtime.retainedTree, false);
});

test("runtime coverage retains the public runtime view and bounded limitations", () => {
	const retained = readRuntimeEntries(source(), "all-retained-entries", () => 10);
	const coverage = runtimeSourceCoverage(retained, "runtime-retained");
	assert.equal(coverage.assessed, true);
	assert.deepEqual(coverage.scope, { source: "omp-runtime", view: "all-retained-entries" });
	assert.ok(coverage.limitations.includes("retained-entries-only"));
	assert.equal(coverage.sessionKey.length, 64);
});

test("runtime evidence is not invented when active and retained snapshots disagree", () => {
	const activeSource = source();
	const retainedSource = source();
	retainedSource.getLeafId = () => "different-leaf";
	const active = readRuntimeEntries(activeSource, "active-branch-entries", () => 10);
	const retained = readRuntimeEntries(retainedSource, "all-retained-entries", () => 10);
	assert.equal(deriveRuntimeEvidence(retained, active), undefined);
});

test("invalid retained entry shapes become an explicit limitation instead of a crash", () => {
	const malformed = {
		...source(),
		getEntries: () => [root, { id: "bad", parentId: 4, type: "message", timestamp: "2026-09-18T10:04:00Z" } as unknown as Entry],
	};
	const active = readRuntimeEntries(malformed, "active-branch-entries", () => 10);
	const retained = readRuntimeEntries(malformed, "all-retained-entries", () => 10);
	const runtime = deriveRuntimeEvidence(retained, active);
	assert.ok(runtime);
	assert.ok(runtime.limitations.includes("invalid-retained-entry-shape"));
});

test("renderer exposes retained-tree/tool evidence without turning cancellation or off-branch scope into a verdict", () => {
	const active = readRuntimeEntries(source(), "active-branch-entries", () => 10);
	const retained = readRuntimeEntries(source(), "all-retained-entries", () => 10);
	const runtime = deriveRuntimeEvidence(retained, active, { classifyTools: true });
	assert.ok(runtime);
	const report = buildAssuranceReport({
		actions: [],
		coverage: [runtimeSourceCoverage(retained, "runtime-retained")],
		runtime,
	}, []);
	const rendered = renderAssuranceReport(report, BUILTIN_ASSURANCE_RULES);
	assert.match(rendered, /Needs review[\s\S]*✓ Nothing needs review/);
	assert.match(rendered, /Main session[\s\S]*Current path: 3 retained entries[\s\S]*Other branches: 2 retained entries/);
	assert.match(rendered, /1 Main tool action · 1 terminal result/);
	assert.match(rendered, /Background jobs[\s\S]*✓ CodeBoundaryScout · cancelled/);
	assert.match(rendered, /Classification[\s\S]*Retained Main tools: 1 classified · 0 unclassified/);
	assert.match(rendered, /Visibility[\s\S]*Retained child\/subagent branches are not fully available/);
	assert.doesNotMatch(rendered, /Rules\n|omp-kit\.|unauthorized|unsafe/i);
});
