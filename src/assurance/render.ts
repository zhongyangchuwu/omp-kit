import type { AssuranceReport, AssuranceRule, AssuranceRuleMeta, Finding, RuleResult } from "./model";

/** Escape terminal controls/bidi and bound identifiers. This is display safety, not redaction. */
function atom(text: string): string {
	return text.replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, "?").slice(0, 160);
}

function fallbackMeta(result: RuleResult): AssuranceRuleMeta {
	return {
		id: result.ruleId,
		version: result.ruleVersion,
		title: result.ruleId,
		description: "Rule metadata was not supplied to this renderer.",
		messages: {},
		presentation: { section: "attention", summaryLabel: result.ruleId },
	};
}

function message(meta: AssuranceRuleMeta, finding: Finding): string {
	return meta.messages[finding.code] ?? finding.code;
}

/** Generic renderer: layout is shared, concrete labels/messages come from rule metadata. */
export function renderAssuranceReport(report: AssuranceReport, registry: readonly AssuranceRule[]): string {
	const metaById = new Map(registry.map(rule => [rule.meta.id, rule.meta]));
	const metaFor = (result: RuleResult) => metaById.get(result.ruleId) ?? fallbackMeta(result);
	const lines = ["Session review (evidence snapshot)", "", "Attention"];
	const attentionRules = report.rules.filter(result => metaFor(result).presentation.section === "attention");
	for (const result of attentionRules) {
		const meta = metaFor(result);
		const label = meta.presentation.summaryLabel ?? meta.title;
		const count = result.status === "evaluated" || result.status === "partial" ? result.findings.length : "NOT ASSESSED";
		lines.push(`  ${atom(label)}: ${count}`);
	}
	if (attentionRules.length === 0) lines.push("  No attention rules selected.");
	const attentionFindings = attentionRules.flatMap(result => result.findings.map(finding => ({ result, finding })));
	for (const { result, finding } of attentionFindings.slice(0, 8)) {
		const meta = metaFor(result);
		lines.push(`  [${finding.id.slice(0, 12)}] ${atom(message(meta, finding))}`);
		for (const ref of finding.evidence.slice(0, 2)) lines.push(
			`    ${atom(ref.sourceId)} / ${atom(ref.trackId)} / span ${atom(ref.spanId)}${ref.entryId ? ` / entry ${atom(ref.entryId)}` : ""}`);
	}
	if (attentionFindings.length > 8) lines.push("  More findings and all evidence references are in JSON output.");

	lines.push("", "Coverage");
	for (const source of report.coverage) lines.push(
		`  ${atom(source.sourceId)}: ${source.assessed ? "assessed bounded view" : "NOT ASSESSED"} (${atom(source.scope.view)}; ${atom(source.consistency)})`);
	const coverageRules = report.rules.filter(result => metaFor(result).presentation.section === "coverage");
	const coverageFindings = coverageRules.flatMap(result => result.findings.map(finding => ({ result, finding })));
	const conflicts = coverageFindings.filter(({ finding }) => finding.code === "conflicting-observations").length;
	if (conflicts) lines.push(`  Evidence conflicts: ${conflicts} (not resolved)`);
	const seenCoverage = new Set<string>();
	for (const { result, finding } of coverageFindings) {
		const key = `${result.ruleId}:${finding.code}`;
		if (seenCoverage.has(key)) continue;
		seenCoverage.add(key);
		lines.push(`  ${atom(finding.code)}: ${atom(message(metaFor(result), finding))}`);
	}
	for (const result of report.rules.filter(item => item.status === "failed")) {
		lines.push(`  Rule ${atom(metaFor(result).title)} failed to evaluate (${atom(result.failure ?? "unknown")}).`);
	}

	lines.push("", "Rules");
	for (const result of report.rules) lines.push(`  ${atom(result.ruleId)}@${result.ruleVersion}: ${result.status}`);
	lines.push("", "No task-quality or safety verdict. Tool return is not process success; a missing terminal is not proof of a running process.",
		"Private local metadata, not approved for publication. Native trace/entry references are for local drill-down.");
	return lines.join("\n");
}
