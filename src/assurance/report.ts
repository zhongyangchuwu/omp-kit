import { ASSURANCE_SCHEMA, compareIds, type AssuranceInput, type AssuranceReport, type AssuranceRule, type RuleResult } from "./model";
import { DEFAULT_ASSURANCE_RULES, finding } from "./rules";

function freezeDeep<T>(value: T): T {
	if (value && typeof value === "object" && !Object.isFrozen(value)) {
		for (const child of Object.values(value)) freezeDeep(child);
		Object.freeze(value);
	}
	return value;
}

/** Explicit composition, not a plugin engine. No IO, wall clock or implicit enrichment. */
export function buildAssuranceReport(input: AssuranceInput,
	rules: readonly AssuranceRule[] = DEFAULT_ASSURANCE_RULES): AssuranceReport {
	const ids = new Set<string>();
	for (const rule of rules) {
		if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/.test(rule.id) || ids.has(rule.id) ||
			!Number.isSafeInteger(rule.version) || rule.version < 1) throw new Error("Invalid or duplicate assurance rule identity");
		ids.add(rule.id);
	}
	const observations = freezeDeep(structuredClone(input));
	const results: RuleResult[] = rules.map((rule): RuleResult => {
		try {
			const result = rule.evaluate(observations);
			if (!["evaluated", "partial", "skipped"].includes(result.status) ||
				(result.status === "skipped" && result.findings.length > 0) ||
				result.findings.some(item => item.ruleId !== rule.id || item.ruleVersion !== rule.version ||
					!["tool-error", "terminal-missing", "coverage-gap"].includes(item.kind))) throw new Error("Invalid rule output");
			return { ruleId: rule.id, ruleVersion: rule.version, status: result.status,
				findings: structuredClone([...result.findings]).sort(compareIds) };
		} catch {
			// Do not leak a rule exception (it may contain private runtime content).
			return { ruleId: rule.id, ruleVersion: rule.version, status: "failed",
				findings: [finding(rule, "coverage-gap", rule.id, "rule-failed")] };
		}
	}).sort((a, b) => compareIds({ id: a.ruleId }, { id: b.ruleId }));
	return { schemaVersion: ASSURANCE_SCHEMA, ...observations, rules: results,
		findings: [...new Map(results.flatMap(result => result.findings).map(item => [item.id, item])).values()].sort(compareIds) };
}

/** Escape terminal controls/bidi and bound identifiers. This is display safety, not redaction. */
function atom(text: string): string {
	return text.replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, "?").slice(0, 120);
}

const COVERAGE_LABELS: Record<string, string> = {
	"active-branches-only": "active-branches-only: rewound actions may be absent; rewind is not rollback.",
	"child-completeness-unknown": "Completeness of child-session evidence is unknown.",
	"details-are-previews": "Trace previews are not full commands; no command classification was performed.",
	"not-an-atomic-snapshot": "Reads are not an atomic cross-track snapshot.",
	"process-network-unobserved": "Process and network effects are not exhaustively observed.",
	"tool-and-background-only": "Rules cover tool errors and missing tool/background terminals, not task quality.",
	"conflicting-observations": "Conflicting source observations were retained, not resolved as recovery.",
	"no-trace-input": "No trace input was supplied.",
	"rule-failed": "A selected rule failed; its missing result is a coverage gap.",
};

export function renderAssuranceReport(report: AssuranceReport): string {
	const errors = report.findings.filter(item => item.kind === "tool-error");
	const missing = report.findings.filter(item => item.kind === "terminal-missing");
	const gaps = report.findings.filter(item => item.kind === "coverage-gap");
	const lines = ["Session review (evidence snapshot)", "", "Attention"];
	for (const [id, label, count] of [
		["omp-kit.tool-error", "Tool errors reported", new Set(errors.map(item => item.subjectId)).size],
		["omp-kit.terminal-missing", "Missing terminal evidence", new Set(missing.map(item => item.subjectId)).size],
	] as const) {
		const status = report.rules.find(rule => rule.ruleId === id)?.status;
		lines.push(`  ${label}: ${status === "evaluated" || status === "partial" ? count : "NOT ASSESSED"}`);
	}
	const conflicts = gaps.filter(item => item.code === "conflicting-observations").length;
	if (conflicts) lines.push(`  Evidence conflicts: ${conflicts} (not resolved)`);
	for (const item of [...errors, ...missing].slice(0, 8)) {
		lines.push(`  [${item.id.slice(0, 12)}] ${atom(item.code)}`);
		for (const ref of item.evidence.slice(0, 2)) lines.push(
			`    ${atom(ref.sourceId)} / ${atom(ref.trackId)} / span ${atom(ref.spanId)}${ref.entryId ? ` / entry ${atom(ref.entryId)}` : ""}`);
	}
	if (errors.length + missing.length > 8) lines.push("  More findings and all evidence references are in JSON output.");
	lines.push("", "Coverage");
	for (const source of report.coverage) lines.push(
		`  ${atom(source.sourceId)}: ${source.assessed ? "assessed bounded view" : "NOT ASSESSED"} (${atom(source.scope.view)}; ${atom(source.consistency)})`);
	for (const code of [...new Set([...gaps.map(item => item.code), ...report.coverage.flatMap(source => source.limitations)])].sort()) lines.push(`  ${COVERAGE_LABELS[code] ?? atom(code)}`);
	lines.push("", "Rules");
	for (const rule of report.rules) lines.push(`  ${atom(rule.ruleId)}@${rule.ruleVersion}: ${rule.status}`);
	lines.push("", "No task-quality or safety verdict. Tool return is not process success; a missing terminal is not proof of a running process.",
		"Private local metadata, not approved for publication. Native trace/entry references are for local drill-down.");
	return lines.join("\n");
}
