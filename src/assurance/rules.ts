import { assuranceId, type AssuranceInput, type AssuranceRule, type EvidenceRef, type Finding, type FindingKind, type RuleResult } from "./model";

export function finding(rule: Pick<AssuranceRule, "id" | "version">, kind: FindingKind,
	subjectId: string, code: string, evidence: readonly EvidenceRef[] = []): Finding {
	return { id: assuranceId(rule.id, String(rule.version), kind, subjectId, code), kind,
		ruleId: rule.id, ruleVersion: rule.version, subjectId, code, evidence };
}

function actionStatus(input: AssuranceInput): RuleResult["status"] {
	const assessed = input.coverage.filter(source => source.assessed).length;
	return assessed === 0 ? "skipped" : assessed < input.coverage.length ? "partial" : "evaluated";
}

export const toolErrorRule: AssuranceRule = {
	id: "omp-kit.tool-error", version: 1,
	evaluate(input) {
		return { status: actionStatus(input), findings: input.actions
			.filter(action => action.kind === "tool" && action.samples.some(sample => sample.errorReported))
			.map(action => finding(toolErrorRule, "tool-error", action.id, "tool-reported-error",
				action.samples.filter(sample => sample.errorReported).map(sample => sample.evidence))) };
	},
};

export const missingTerminalRule: AssuranceRule = {
	id: "omp-kit.terminal-missing", version: 1,
	evaluate(input) {
		return { status: actionStatus(input), findings: input.actions
			.filter(action => action.samples.length > 0 && action.samples.every(sample => sample.terminal === "missing"))
			.map(action => finding(missingTerminalRule, "terminal-missing", action.id,
				action.kind === "background" ? "background-terminal-missing" : "tool-terminal-missing",
				action.samples.map(sample => sample.evidence))) };
	},
};

export const coverageGapRule: AssuranceRule = {
	id: "omp-kit.coverage-gap", version: 1,
	evaluate(input) {
		const findings: Finding[] = [];
		for (const source of input.coverage) {
			if (!source.assessed) findings.push(finding(coverageGapRule, "coverage-gap", source.sourceId, source.reason ?? "not-assessed"));
			for (const limit of source.limitations) findings.push(finding(coverageGapRule, "coverage-gap", source.sourceId, limit));
		}
		for (const action of input.actions) {
			if (new Set(action.samples.map(sample => sample.terminal)).size > 1 ||
				new Set(action.samples.map(sample => sample.toolName)).size > 1 ||
				new Set(action.samples.map(sample => sample.errorReported)).size > 1) {
				findings.push(finding(coverageGapRule, "coverage-gap", action.id, "conflicting-observations",
					action.samples.map(sample => sample.evidence)));
			}
		}
		if (input.coverage.length === 0) findings.push(finding(coverageGapRule, "coverage-gap", "report", "no-trace-input"));
		findings.push(finding(coverageGapRule, "coverage-gap", "report", "process-network-unobserved"));
		findings.push(finding(coverageGapRule, "coverage-gap", "report", "tool-and-background-only"));
		return { status: "evaluated", findings };
	},
};

export const DEFAULT_ASSURANCE_RULES: readonly AssuranceRule[] = Object.freeze([
	toolErrorRule, missingTerminalRule, coverageGapRule,
]);
