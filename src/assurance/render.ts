import type { AssuranceReport, AssuranceRule, AssuranceRuleMeta, Finding, RuleResult } from "./model";
import type { ScopeBoundary } from "./scope/model";

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
		presentation: result.presentation,
	};
}

function message(meta: AssuranceRuleMeta, finding: Finding): string {
	return meta.messages[finding.code] ?? finding.code;
}

const BOUNDARY_ORDER: readonly ScopeBoundary[] = ["workspace", "host-user", "host-system", "external", "unknown"];

/** Generic renderer: layout is shared, concrete labels/messages come from rule metadata. */
export function renderAssuranceReport(report: AssuranceReport, registry: readonly AssuranceRule[]): string {
	const metaById = new Map(registry.map(rule => [rule.meta.id, rule.meta]));
	const resultById = new Map(report.rules.map(result => [result.ruleId, result]));
	const metaFor = (result: RuleResult) => metaById.get(result.ruleId) ?? fallbackMeta(result);
	const lines = ["Session review (evidence snapshot)", "", "Attention"];
	const attentionMeta = registry.map(rule => rule.meta).filter(meta => meta.presentation.section === "attention");
	for (const meta of attentionMeta) {
		const result = resultById.get(meta.id);
		const label = meta.presentation.summaryLabel ?? meta.title;
		const count = result && (result.status === "evaluated" || result.status === "partial") ? result.findings.length : "NOT ASSESSED";
		lines.push(`  ${atom(label)}: ${count}`);
	}
	if (attentionMeta.length === 0) lines.push("  No attention rules registered.");
	const attentionFindings = report.rules
		.filter(result => result.presentation.section === "attention")
		.flatMap(result => result.findings.map(finding => ({ result, finding })));
	for (const { result, finding } of attentionFindings.slice(0, 8)) {
		const meta = metaFor(result);
		lines.push(`  [${finding.id.slice(0, 12)}] ${atom(message(meta, finding))}`);
		for (const ref of finding.evidence.slice(0, 2)) lines.push(
			`    ${atom(ref.sourceId)} / ${atom(ref.trackId)} / span ${atom(ref.spanId)}${ref.entryId ? ` / entry ${atom(ref.entryId)}` : ""}`);
	}
	if (attentionFindings.length > 8) lines.push("  More findings and all evidence references are in JSON output.");

	lines.push("", "Evidence");
	const evidenceMeta = registry.map(rule => rule.meta).filter(meta => meta.presentation.section === "evidence");
	for (const meta of evidenceMeta) {
		const result = resultById.get(meta.id);
		const label = meta.presentation.summaryLabel ?? meta.title;
		const count = result && (result.status === "evaluated" || result.status === "partial") ? result.findings.length : "NOT ASSESSED";
		lines.push(`  ${atom(label)}: ${count}`);
	}
	if (evidenceMeta.length === 0) lines.push("  No supporting-evidence rules registered.");
	else lines.push("  Supporting evidence is retained for review context and does not by itself trigger attention.");

	if (report.runtime) {
		lines.push("", "Runtime");
		const activeEntries = report.runtime.entries.filter(item => item.branch === "active").length;
		const offBranchEntries = report.runtime.entries.length - activeEntries;
		const parentIds = new Set(report.runtime.entries.flatMap(item => item.parentId ? [item.parentId] : []));
		const leaves = report.runtime.entries.filter(item => !parentIds.has(item.id)).length;
		lines.push(report.runtime.retainedTree
			? `  Retained Main tree: ${report.runtime.entries.length} entries | ${activeEntries} active | ${offBranchEntries} off-branch | ${leaves} leaves`
			: `  Active Main branch: ${activeEntries} entries`);
		const toolActions = report.runtime.toolActions;
		const activeTools = toolActions.filter(item => item.branch === "active").length;
		const offBranchTools = toolActions.length - activeTools;
		const observedTerminals = toolActions.filter(item => item.terminal === "observed").length;
		const missingTerminals = toolActions.length - observedTerminals;
		const errors = toolActions.filter(item => item.errorReported).length;
		lines.push(`  Retained Main tool actions: ${toolActions.length} | ${activeTools} active | ${offBranchTools} off-branch`);
		lines.push(`  Tool terminal evidence: ${observedTerminals} observed | ${missingTerminals} missing | ${errors} errors reported`);
		const scopeCounts = new Map<string, number>();
		for (const item of toolActions) scopeCounts.set(item.scopeStatus, (scopeCounts.get(item.scopeStatus) ?? 0) + 1);
		if (toolActions.length > 0) lines.push(`  Retained tool scope: ${[...scopeCounts.entries()].sort().map(([status, count]) => `${status} ${count}`).join(", ")}`);
		const offBranchScopes = new Map<string, number>();
		for (const item of toolActions.filter(item => item.branch === "off-branch")) {
			for (const scope of item.scopes) {
				const key = `${scope.boundary}/${scope.access}/${scope.resource}`;
				offBranchScopes.set(key, (offBranchScopes.get(key) ?? 0) + 1);
			}
		}
		if (offBranchScopes.size > 0) {
			lines.push(`  Off-branch classified scope: ${[...offBranchScopes.entries()].sort().slice(0, 6).map(([key, count]) => `${key} ${count}`).join(", ")}`);
		}
		if (report.runtime.jobResolutions.length === 0) {
			lines.push("  Observed job terminals: none");
		} else {
			const counts = new Map<string, number>();
			for (const item of report.runtime.jobResolutions) counts.set(item.status, (counts.get(item.status) ?? 0) + 1);
			lines.push(`  Observed job terminals: ${[...counts.entries()].sort().map(([status, count]) => `${status} ${count}`).join(", ")}`);
			for (const item of report.runtime.jobResolutions.slice(0, 6)) {
				lines.push(`    ${atom(item.jobId)}: ${item.status} (${item.branch})`);
			}
			if (report.runtime.jobResolutions.length > 6) lines.push("    More runtime job facts are retained in JSON output.");
		}
		for (const limitation of report.runtime.limitations) lines.push(`  runtime: ${atom(limitation)}`);
	}

	lines.push("", "Scope");
	if (!report.scope || report.scope.traceCoverage === "unavailable") {
		lines.push("  NOT ASSESSED");
	} else {
		lines.push(`  Trace coverage: ${report.scope.traceCoverage}`);
		const observed = new Set(report.scope.observations.map(item => item.boundary));
		const boundaries = BOUNDARY_ORDER.filter(boundary => observed.has(boundary));
		lines.push(`  Observed boundaries: ${boundaries.length ? boundaries.join(", ") : "none classified"}`);
		const classified = report.scope.actionCoverage.filter(item => item.status === "classified").length;
		const unclassified = report.scope.actionCoverage.length - classified;
		lines.push(`  Tool actions classified: ${classified}`);
		lines.push(`  Tool actions unclassified: ${unclassified}`);
	}

	lines.push("", "Coverage");
	for (const source of report.coverage) lines.push(
		`  ${atom(source.sourceId)}: ${source.assessed ? "assessed bounded view" : "NOT ASSESSED"} (${atom(source.scope.view)}; ${atom(source.consistency)})`);
	if (report.scope) {
		for (const limitation of report.scope.limitations) lines.push(`  scope: ${atom(limitation)}`);
	}
	const coverageFindings = report.rules
		.filter(result => result.presentation.section === "coverage")
		.flatMap(result => result.findings.map(finding => ({ result, finding })));
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
	lines.push("", "No task-quality, authorization or safety verdict. Observed scope is not requested or authorized scope.",
		"Tool return is not process success; a missing terminal is not proof of a running process.",
		"Private local metadata, not approved for publication. Native trace/entry references are for local drill-down.");
	return lines.join("\n");
}
