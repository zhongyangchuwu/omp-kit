import { test } from "bun:test";
import assert from "node:assert/strict";
import type { SessionSummary, SessionTrace, TraceSpan } from "@oh-my-pi/omp-stats/shared-types";
import { buildAssuranceReport } from "../../src/assurance/engine";
import { DEFAULT_ASSURANCE_PROFILE, resolveAssuranceProfile } from "../../src/assurance/profiles";
import { BUILTIN_ASSURANCE_RULES } from "../../src/assurance/registry";
import { renderAssuranceReport } from "../../src/assurance/render";
import { resolutionGapRule } from "../../src/assurance/rules/resolution-gap";
import { missingTerminalRule } from "../../src/assurance/rules/terminal-missing";
import { toolErrorRule } from "../../src/assurance/rules/tool-error";
import { buildAssuranceScanReport } from "../../src/assurance/scan";
import { normalizeTraceReads, type TraceInput } from "../../src/assurance/trace-observations";

const RULES = resolveAssuranceProfile(BUILTIN_ASSURANCE_RULES, DEFAULT_ASSURANCE_PROFILE);

function span(overrides: Partial<TraceSpan> = {}): TraceSpan {
	return {
		id: "main:tool:call",
		kind: "tool",
		start: 1,
		end: 2,
		label: "bash",
		entryId: "result",
		toolCallId: "call",
		...overrides,
	};
}

function trace(file: string, spans: TraceSpan[]): SessionTrace {
	return {
		file,
		cwd: "/work/project",
		title: null,
		startedAt: 1,
		endedAt: 2,
		mtimeMs: 3, etag: "test-etag",
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

function report(file: string, spans: TraceSpan[]) {
	const input: TraceInput = {
		sourceId: "session",
		sessionFile: file,
		read: {
			scope: { source: "omp-stats", view: "active-branch-trace" },
			startedAt: 10,
			finishedAt: 11,
			limitations: [],
			consistency: "not-checked",
			status: "available",
			data: trace(file, spans),
		},
	};
	return buildAssuranceReport(normalizeTraceReads([input]), RULES);
}

function summary(file: string): SessionSummary {
	return {
		file,
		folder: "/work/project",
		title: null,
		models: [],
		startedAt: 1,
		endedAt: 2,
		requests: 1,
		toolCalls: 1,
		subagents: 0,
		totalTokens: 0,
		costTotal: 0,
		unpricedRequests: 0,
	};
}

function scan(file: string, spans: TraceSpan[]) {
	return buildAssuranceScanReport([{ summary: summary(file), report: report(file, spans) }], {
		mode: "trace-only",
		folderApplied: false,
		since: null,
		limit: 1000,
		syncAvailable: true,
		listAvailable: true,
		returned: 1,
	});
}

test("tool errors remain evidence but do not create a historical candidate alone", () => {
	const result = scan("/private/error-only.jsonl", [span({ isError: true })]);
	assert.equal(toolErrorRule.meta.presentation.section, "evidence");
	assert.equal(result.sessions.candidates, 0);
	assert.equal(result.totals.attentionFindings, 0);
	assert.equal(result.findingCounts["tool-error:tool-reported-error"], 1);
	assert.equal(result.candidates.length, 0);
});

test("attention findings select a candidate while tool errors stay visible as context", () => {
	const result = scan("/private/error-and-terminal.jsonl", [span({ isError: true, unterminated: true })]);
	assert.equal(result.sessions.candidates, 1);
	assert.equal(result.totals.attentionFindings, 1);
	assert.deepEqual(result.candidates[0].codes, [
		"resolution-gap:tool-resolution-unobserved",
		"terminal-missing:tool-terminal-missing",
		"tool-error:tool-reported-error",
	]);
});

test("single-session rendering separates attention from supporting error evidence", () => {
	const value = report("/private/render.jsonl", [span({ isError: true })]);
	const rendered = renderAssuranceReport(value, BUILTIN_ASSURANCE_RULES);
	assert.match(rendered, /Attention[\s\S]*Resolution gaps: 0/);
	assert.match(rendered, /Evidence[\s\S]*Missing terminal observations: 0[\s\S]*Tool errors reported: 1/);
	assert.match(rendered, /Supporting evidence is retained for review context/);
	assert.equal(value.rules.find(rule => rule.ruleId === toolErrorRule.meta.id)?.presentation.section, "evidence");
	assert.equal(value.rules.find(rule => rule.ruleId === missingTerminalRule.meta.id)?.presentation.section, "evidence");
	assert.equal(value.rules.find(rule => rule.ruleId === resolutionGapRule.meta.id)?.presentation.section, "attention");
});
