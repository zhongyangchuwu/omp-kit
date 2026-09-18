import { test } from "bun:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { SessionTrace, TraceSpan } from "@oh-my-pi/omp-stats/shared-types";
import { buildAssuranceReport } from "../../src/assurance/engine";
import type { AssuranceRule } from "../../src/assurance/model";
import { DEFAULT_ASSURANCE_PROFILE, resolveAssuranceProfile } from "../../src/assurance/profiles";
import { BUILTIN_ASSURANCE_RULES } from "../../src/assurance/registry";
import { renderAssuranceReport } from "../../src/assurance/render";
import { missingTerminalRule } from "../../src/assurance/rules/terminal-missing";
import { toolErrorRule } from "../../src/assurance/rules/tool-error";
import { normalizeTraceReads, type TraceInput } from "../../src/assurance/trace-observations";
import { parseAssuranceArgs, runAssuranceCli, readAssuranceReport } from "../../scripts/session_assurance";

const file = "/private/root.jsonl";
const DEFAULT_RULES = resolveAssuranceProfile(BUILTIN_ASSURANCE_RULES, DEFAULT_ASSURANCE_PROFILE);
function span(overrides: Partial<TraceSpan> = {}): TraceSpan {
	return { id: "main:request:call", kind: "tool", start: 1, end: 2, label: "bash", entryId: "result", toolCallId: "call", ...overrides };
}
function trace(spans: TraceSpan[] = [], sessionFile = file): SessionTrace {
	return { file: sessionFile, cwd: "/PRIVATE_CWD", title: "PRIVATE_TITLE", startedAt: 1, endedAt: 2, mtimeMs: 3, etag: "test-etag", etag: "test-etag",
		tracks: [{ id: "main", parentId: null, label: "Main", agent: null, model: null, file: sessionFile, spans, markers: [] }],
		summary: { wallMs: 1, modelMs: 0, toolMs: 1, idleMs: 0, turns: 1, requests: 0, toolCalls: spans.length,
			subagents: 0, totalTokens: 0, costTotal: 0, unpricedRequests: 0, toolStats: [] } };
}
function input(spans: TraceSpan[] = [], sourceId = "a", sessionFile = file): TraceInput {
	return { sourceId, sessionFile, read: { scope: { source: "omp-stats", view: "active-branch-trace" },
		startedAt: 10, finishedAt: 11, limitations: [], consistency: "not-checked", status: "available", data: trace(spans, sessionFile) } };
}
function failed(sourceId = "a"): TraceInput {
	return { sourceId, sessionFile: file, read: { scope: { source: "omp-stats", view: "active-branch-trace" },
		startedAt: 10, finishedAt: 11, limitations: [], consistency: "not-checked", status: "unavailable", reason: "http", httpStatus: 403 } };
}
const report = (...reads: TraceInput[]) => buildAssuranceReport(normalizeTraceReads(reads), DEFAULT_RULES);
const render = (value: ReturnType<typeof report>, rules: readonly AssuranceRule[] = BUILTIN_ASSURANCE_RULES) => renderAssuranceReport(value, rules);
const kinds = (value: ReturnType<typeof report>, kind: string) => value.findings.filter(item => item.kind === kind);

function testRule(id: string, evaluate: AssuranceRule["evaluate"]): AssuranceRule {
	return {
		meta: {
			id,
			version: 1,
			title: id,
			description: "Test-only assurance rule.",
			messages: { "test-finding": "Test finding." },
			presentation: { section: "attention", summaryLabel: id },
		},
		evaluate,
	};
}

test("tool errors retain native evidence rather than task failure claims", () => {
	const value = report(input([span({ isError: true })]));
	assert.equal(kinds(value, "tool-error").length, 1);
	assert.equal(kinds(value, "tool-error")[0].evidence[0].toolCallId, "call");
	assert.equal(value.schemaVersion, "omp-kit.session-assurance/v1");
	assert.equal("safe" in value, false);
});
test("absence of an error flag is not a verified consequence", () => {
	const value = report(input([span()]));
	assert.equal(kinds(value, "tool-error").length, 0);
	assert.equal("verified" in value.actions[0], false);
	assert.equal("succeeded" in value.actions[0], false);
	assert.match(render(value), /not process success/);
});
test("missing tool terminal and missing background terminal are separate observations", () => {
	const value = report(input([span({ unterminated: true }), span({ id: "bg:job", kind: "background", toolCallId: undefined, unterminated: true })]));
	assert.equal(kinds(value, "terminal-missing").length, 2);
	assert.match(render(value), /not proof of a running process/);
});
test("a tool return does not complete its background job", () => {
	const value = report(input([span(), span({ id: "bg:job", kind: "background", toolCallId: undefined, unterminated: true })]));
	assert.deepEqual(kinds(value, "terminal-missing").map(item => item.code), ["background-terminal-missing"]);
});
test("model errors are not mislabeled as tool errors", () => {
	const value = report(input([span({ kind: "model", isError: true })]));
	assert.equal(value.actions.length, 0);
	assert.ok(value.findings.some(item => item.code === "tool-and-background-only"));
});
test("unavailable sources skip action rules, not produce reassuring zeros", () => {
	const value = report(failed());
	assert.equal(value.actions.length, 0);
	assert.equal(value.rules.find(rule => rule.ruleId === toolErrorRule.meta.id)?.status, "skipped");
	assert.match(render(value), /Tool errors reported: NOT ASSESSED/);
	assert.ok(value.findings.some(item => item.code === "http"));
});
test("mixed reads retain findings from readable sources and the failed component", () => {
	const value = report(input([span({ isError: true })]), failed("child"));
	assert.equal(kinds(value, "tool-error").length, 1);
	assert.equal(value.rules.find(rule => rule.ruleId === toolErrorRule.meta.id)?.status, "partial");
	assert.equal(value.coverage.find(source => source.sourceId === "child")?.assessed, false);
});
test("source movement is not normalized into action claims", () => {
	const source = input([span({ isError: true })]);
	const value = report({ ...source, read: { ...source.read, consistency: "source-changed" } });
	assert.equal(value.actions.length, 0);
	assert.ok(value.findings.some(item => item.code === "source-changed"));
});
test("wrong view cannot masquerade as a trace", () => {
	const source = input([span()]);
	const value = report({ ...source, read: { ...source.read, scope: { source: "omp-runtime", view: "all-retained-entries" } } });
	assert.equal(value.coverage[0].reason, "unexpected-view");
});
test("malformed interpreted fields are a coverage gap", () => {
	const source = input([span()]);
	if (source.read.status !== "available") throw new Error("fixture");
	(source.read.data.tracks[0].spans[0] as unknown as Record<string, unknown>).isError = "false";
	assert.equal(report(source).coverage[0].reason, "invalid-trace");
});
test("a mismatched requested session is not interpreted", () => {
	const value = report({ ...input([span()]), sessionFile: "/different.jsonl" });
	assert.equal(value.coverage[0].reason, "invalid-trace");
});
test("raw previews, title, cwd and file paths do not enter the report", () => {
	const value = report(input([span({ isError: true, detail: "PRIVATE_COMMAND token=PRIVATE_SECRET" })]));
	assert.doesNotMatch(JSON.stringify(value), /PRIVATE_|\/private\/root/);
});
test("terminal rendering escapes control and bidi characters in native references", () => {
	const value = report(input([span({ isError: true, entryId: "\u001b[31m\n\u202eevil" })]));
	assert.doesNotMatch(render(value), /\u001b|\u202e/);
});
test("stable identities and report order are independent of source and span ordering", () => {
	const a = input([span({ isError: true }), span({ id: "second", toolCallId: "two", unterminated: true })]);
	const b = input([span({ isError: true })], "b", "/other.jsonl");
	const reversed = structuredClone(a);
	if (reversed.read.status === "available") reversed.read.data.tracks[0].spans.reverse();
	assert.deepEqual(report(a, b), report(b, reversed));
});
test("overlapping trace views deduplicate by transcript and native call ID", () => {
	const value = report(input([span({ isError: true })]), input([span({ isError: true })], "second"));
	assert.equal(value.actions.length, 1);
	assert.equal(kinds(value, "tool-error").length, 1);
	assert.equal(kinds(value, "tool-error")[0].evidence.length, 2);
});
test("identical call IDs in different transcripts are distinct actions", () => {
	assert.equal(report(input([span()]), input([span()], "second", "/child.jsonl")).actions.length, 2);
});
test("missing native call IDs do not trigger fuzzy cross-source merging", () => {
	const value = report(input([span({ toolCallId: undefined })]), input([span({ toolCallId: undefined })], "second"));
	assert.equal(value.actions.length, 2);
});
test("conflicting terminal samples preserve uncertainty, not an invented recovery", () => {
	const value = report(input([span({ unterminated: true })]), input([span()], "later"));
	assert.equal(kinds(value, "terminal-missing").length, 0);
	assert.ok(value.findings.some(item => item.code === "conflicting-observations"));
	assert.equal(value.actions[0].samples.length, 2);
});
test("a later non-error flag never erases earlier error evidence", () => {
	const value = report(input([span({ isError: true })]), input([span()], "later"));
	assert.equal(kinds(value, "tool-error").length, 1);
	assert.ok(value.findings.some(item => item.code === "conflicting-observations"));
});
test("no input is distinct from an empty inspected trace", () => {
	assert.equal(report().rules.find(rule => rule.ruleId === toolErrorRule.meta.id)?.status, "skipped");
	assert.ok(report().findings.some(item => item.code === "no-trace-input"));
	assert.equal(report(input()).rules.find(rule => rule.ruleId === toolErrorRule.meta.id)?.status, "evaluated");
});
test("scope limitations survive successful empty reads", () => {
	const value = report(input());
	assert.equal(value.coverage[0].availability, "available");
	assert.ok(value.coverage[0].limitations.includes("active-branches-only"));
	assert.ok(value.findings.some(item => item.code === "process-network-unobserved"));
});
test("omitted rules are not rendered as zero findings", () => {
	const value = buildAssuranceReport(normalizeTraceReads([input()]), [toolErrorRule]);
	assert.match(renderAssuranceReport(value, BUILTIN_ASSURANCE_RULES), /Missing terminal observations: NOT ASSESSED/);
});
test("rule composition is order-independent", () => {
	const observations = normalizeTraceReads([input([span({ isError: true })])]);
	assert.deepEqual(buildAssuranceReport(observations, DEFAULT_RULES), buildAssuranceReport(observations, [...DEFAULT_RULES].reverse()));
});
test("rule exceptions remain engine failures without becoming business findings", () => {
	const broken = testRule("test.broken", () => { throw new Error("PRIVATE_RULE_ERROR"); });
	const value = buildAssuranceReport(normalizeTraceReads([input()]), [broken]);
	assert.equal(value.rules[0].status, "failed");
	assert.equal(value.rules[0].failure, "exception");
	assert.equal(value.findings.length, 0);
	assert.match(renderAssuranceReport(value, [broken]), /failed to evaluate/);
	assert.doesNotMatch(JSON.stringify(value), /PRIVATE_RULE_ERROR/);
});
test("a mutating rule cannot change inputs seen by other rules", () => {
	const observations = normalizeTraceReads([input([span({ isError: true })])]);
	const before = JSON.stringify(observations);
	const mutator = testRule("test.mutator", value => {
		(value.actions[0].samples[0] as { errorReported: boolean }).errorReported = false;
		return { status: "evaluated", findings: [] };
	});
	const value = buildAssuranceReport(observations, [mutator, toolErrorRule]);
	assert.equal(kinds(value, "tool-error").length, 1);
	assert.equal(JSON.stringify(observations), before);
	assert.equal(value.rules.find(rule => rule.ruleId === mutator.meta.id)?.status, "failed");
});
test("duplicate source and rule identities are rejected", () => {
	assert.throws(() => normalizeTraceReads([input(), input()]));
	assert.throws(() => normalizeTraceReads([input([], "bad\nsource")]));
	assert.throws(() => buildAssuranceReport(normalizeTraceReads([input()]), [toolErrorRule, toolErrorRule]));
});
test("normalization leaves source objects unchanged and detached", () => {
	const source = input([span({ isError: true })]);
	const before = JSON.stringify(source);
	const value = normalizeTraceReads([source]);
	(value.actions[0].samples[0].evidence as { entryId: string }).entryId = "changed";
	assert.equal(JSON.stringify(source), before);
});
test("registry and default profile are separate and explicit", () => {
	assert.ok(BUILTIN_ASSURANCE_RULES.length >= DEFAULT_ASSURANCE_PROFILE.length);
	assert.deepEqual(DEFAULT_RULES.map(rule => rule.meta.id), DEFAULT_ASSURANCE_PROFILE);
	assert.throws(() => resolveAssuranceProfile(BUILTIN_ASSURANCE_RULES, ["test.unknown"]));
});
test("a fourth ordinary rule needs no engine schema or renderer changes", () => {
	const custom: AssuranceRule = {
		meta: {
			id: "test.custom-observation",
			version: 1,
			title: "Custom observation",
			description: "Test extension rule.",
			messages: { observed: "A custom observation was detected." },
			presentation: { section: "attention", summaryLabel: "Custom observations" },
		},
		evaluate(value) {
			return { status: "evaluated", findings: [{ kind: "custom-observation", subjectId: value.actions[0]?.id ?? "report",
				code: "observed", evidence: value.actions[0]?.samples.slice(0, 1).map(sample => sample.evidence) ?? [] }] };
		},
	};
	const value = buildAssuranceReport(normalizeTraceReads([input([span()])]), [custom]);
	assert.equal(value.schemaVersion, "omp-kit.session-assurance/v1");
	assert.equal(value.findings[0].ruleId, custom.meta.id);
	assert.equal(value.findings[0].kind, "custom-observation");
	assert.match(renderAssuranceReport(value, [custom]), /Custom observations: 1/);
	assert.match(renderAssuranceReport(value, [custom]), /A custom observation was detected/);
});
test("CLI parsing rejects missing, unknown and repeated options without echoing values", () => {
	for (const args of [[], ["--session"], ["--session", "--json"], ["PRIVATE_UNKNOWN"], ["--session", file, "--json", "--json"]]) {
		assert.throws(() => parseAssuranceArgs(args), error => !String(error).includes("PRIVATE_UNKNOWN"));
	}
	assert.deepEqual(parseAssuranceArgs(["--session", file, "--json"]), { sessionFile: file, json: true });
});
test("help never reads a profile or invokes the injected reader", async () => {
	const result = await runAssuranceCli(["--help"], { getTrace() { throw new Error("must not read"); } });
	assert.equal(result.exitCode, 0);
	assert.match(result.output, /Usage:/);
});
test("CLI performs exactly one trace read and forwards cancellation", async () => {
	let calls = 0;
	const value = await readAssuranceReport({ async getTrace(path, signal) {
		assert.equal(path, file); assert.equal(signal?.aborted, false); calls++;
		return input([span({ isError: true })]).read;
	} }, file, new AbortController().signal);
	assert.equal(calls, 1); assert.equal(kinds(value, "tool-error").length, 1);
});
test("CLI JSON remains a report on failed reads, with a nonzero exit", async () => {
	const result = await runAssuranceCli(["--session", file, "--json"], { async getTrace() { return failed().read; } });
	assert.equal(result.exitCode, 2);
	assert.equal(JSON.parse(result.output).coverage[0].assessed, false);
	assert.doesNotMatch(result.output, /\/private\/root/);
});
test("report production exit zero is not a no-error or safety verdict", async () => {
	const result = await runAssuranceCli(["--session", file], { async getTrace() { return input([span({ isError: true })]).read; } });
	assert.equal(result.exitCode, 0);
	assert.match(result.output, /Tool errors reported: 1/);
});
test("CLI help works in a fresh process without loading the OMP SDK runtime", () => {
	const result = spawnSync(process.execPath, [fileURLToPath(new URL("../../scripts/session_assurance.ts", import.meta.url)), "--help"], { encoding: "utf8", timeout: 10000 });
	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /Usage: omp-kit-assurance/);
});
test("skipped-with-findings is rejected rather than silently accepted", () => {
	const bad: AssuranceRule = { ...missingTerminalRule, evaluate() { return { status: "skipped", findings: [{} as never] }; } };
	const value = buildAssuranceReport(normalizeTraceReads([input()]), [bad]);
	assert.equal(value.rules[0].status, "failed");
	assert.equal(value.rules[0].failure, "invalid-output");
});
