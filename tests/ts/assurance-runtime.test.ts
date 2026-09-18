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
const discarded: Entry = { id: "discarded", parentId: "root", type: "message", timestamp: "2026-09-18T10:01:00Z" };
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
	const retained = [root, discarded, current, cancelled];
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

test("renderer exposes retained-tree evidence without turning cancellation into a verdict", () => {
	const active = readRuntimeEntries(source(), "active-branch-entries", () => 10);
	const retained = readRuntimeEntries(source(), "all-retained-entries", () => 10);
	const runtime = deriveRuntimeEvidence(retained, active);
	assert.ok(runtime);
	const report = buildAssuranceReport({
		actions: [],
		coverage: [runtimeSourceCoverage(retained, "runtime-retained")],
		runtime,
	}, []);
	const rendered = renderAssuranceReport(report, BUILTIN_ASSURANCE_RULES);
	assert.match(rendered, /Retained Main tree: 4 entries \| 3 active \| 1 off-branch/);
	assert.match(rendered, /CodeBoundaryScout: cancelled \(active\)/);
	assert.doesNotMatch(rendered, /unauthorized|unsafe/i);
});
