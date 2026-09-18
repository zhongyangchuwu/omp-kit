import { test } from "bun:test";
import assert from "node:assert/strict";
import { buildAssuranceReport } from "../../src/assurance/engine";
import type { ActionObservation, AssuranceInput, EvidenceRef, RuntimeEvidence, SourceCoverage } from "../../src/assurance/model";
import { resolutionGapRule } from "../../src/assurance/rules/resolution-gap";
import { missingTerminalRule } from "../../src/assurance/rules/terminal-missing";

const coverage: SourceCoverage = {
	sourceId: "session",
	sessionKey: "session-key",
	scope: { source: "omp-stats", view: "active-branch-trace" },
	availability: "available",
	consistency: "not-checked",
	startedAt: 1,
	finishedAt: 2,
	assessed: true,
	limitations: [],
};

function ref(trackId: string, spanId: string, entryId = "entry"): EvidenceRef {
	return { sourceId: "session", sessionKey: "session-key", trackId, spanId, entryId };
}

function action(
	id: string,
	kind: ActionObservation["kind"],
	toolName: string,
	terminal: "observed" | "missing",
	evidence: EvidenceRef,
	errorReported = false,
): ActionObservation {
	return { id, kind, samples: [{ toolName, terminal, errorReported, evidence }] };
}

function report(actions: readonly ActionObservation[], runtime?: RuntimeEvidence) {
	const input: AssuranceInput = { actions, coverage: [coverage], ...(runtime ? { runtime } : {}) };
	return buildAssuranceReport(input, [missingTerminalRule, resolutionGapRule]);
}

test("missing terminal observations stay as evidence while resolution gaps trigger attention", () => {
	const value = report([action("tool", "tool", "bash", "missing", ref("main", "main:tool:call"))]);
	const terminal = value.rules.find(rule => rule.ruleId === missingTerminalRule.meta.id);
	const resolution = value.rules.find(rule => rule.ruleId === resolutionGapRule.meta.id);
	assert.equal(terminal?.presentation.section, "evidence");
	assert.equal(resolution?.presentation.section, "attention");
	assert.deepEqual(terminal?.findings.map(finding => finding.code), ["tool-terminal-missing"]);
	assert.deepEqual(resolution?.findings.map(finding => finding.code), ["tool-resolution-unobserved"]);
});

test("a yielded async task without parent delivery is called out as an undelivered result", () => {
	const background = action(
		"background",
		"background",
		"task job",
		"missing",
		ref("main", "main:bg:RuntimeFeedbackSmoke", "spawn-result"),
	);
	const yielded = action(
		"yield",
		"tool",
		"yield",
		"observed",
		ref("RuntimeFeedbackSmoke", "RuntimeFeedbackSmoke:yield:call", "yield-result"),
	);
	const value = report([background, yielded]);
	const finding = value.findings.find(item => item.kind === "resolution-gap");
	assert.equal(finding?.code, "task-result-undelivered");
	assert.deepEqual(finding?.evidence.map(item => item.entryId).sort(), ["spawn-result", "yield-result"]);
});

test("a nested task job maps its job id to the nested child track", () => {
	const background = action("background", "background", "task job", "missing", ref("Parent", "Parent:bg:Child"));
	const yielded = action("yield", "tool", "yield", "observed", ref("Parent/Child", "Parent/Child:yield:call"));
	const finding = report([background, yielded]).findings.find(item => item.kind === "resolution-gap");
	assert.equal(finding?.code, "task-result-undelivered");
});

test("missing non-task background closure remains unresolved without inventing completion", () => {
	const background = action("background", "background", "bash job", "missing", ref("main", "main:bg:bg_7"));
	const unrelatedYield = action("yield", "tool", "yield", "observed", ref("OtherAgent", "OtherAgent:yield:call"));
	const finding = report([background, unrelatedYield]).findings.find(item => item.kind === "resolution-gap");
	assert.equal(finding?.code, "background-resolution-unobserved");
});

test("an explicitly cancelled background task is terminal rather than unresolved", () => {
	const background = action(
		"background",
		"background",
		"task job",
		"missing",
		ref("main", "main:bg:CodeBoundaryScout", "spawn-result"),
	);
	const runtime: RuntimeEvidence = {
		sessionKey: "session-key",
		leafId: "cancel-result",
		retainedTree: true,
		entries: [],
		toolActions: [],
		jobResolutions: [{
			id: "cancelled-code-boundary-scout",
			jobId: "CodeBoundaryScout",
			status: "cancelled",
			branch: "active",
			entryId: "cancel-result",
		}],
		limitations: ["main-session-only", "child-retained-history-unavailable", "not-an-atomic-snapshot"],
	};
	const value = report([background], runtime);
	assert.equal(value.findings.some(item => item.kind === "resolution-gap"), false);
	assert.deepEqual(
		value.rules.find(rule => rule.ruleId === missingTerminalRule.meta.id)?.findings.map(item => item.code),
		["background-terminal-missing"],
	);
});

test("an observed terminal does not create either missing-terminal or resolution attention", () => {
	const value = report([action("tool", "tool", "bash", "observed", ref("main", "main:tool:call"))]);
	assert.equal(value.findings.length, 0);
});
