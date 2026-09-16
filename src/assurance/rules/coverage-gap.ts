import type { AssuranceRule, RuleFinding } from "../model";

export const coverageGapRule: AssuranceRule = {
	meta: {
		id: "omp-kit.coverage-gap",
		version: 1,
		title: "Evidence coverage gaps",
		description: "Reports unavailable, bounded, conflicting or inherently unobserved evidence surfaces.",
		messages: {
			"http": "The evidence source returned an HTTP failure.",
			"transport": "The evidence source could not be reached.",
			"invalid-json": "The evidence source returned invalid JSON.",
			"invalid-envelope": "The evidence source returned an invalid public payload.",
			"aborted": "The evidence read was aborted.",
			"runtime-unavailable": "The runtime evidence source was unavailable.",
			"runtime-read-failed": "The runtime evidence source could not be read.",
			"source-changed": "The evidence source changed during the read.",
			"unexpected-view": "The supplied evidence view was not the expected trace view.",
			"invalid-trace": "The trace fields used by assurance were invalid or mismatched.",
			"bounded-session-list": "Session discovery is bounded.",
			"list-limit-reached": "The session list reached its requested limit.",
			"active-branches-only": "Only active branches are represented; rewind is not effect rollback.",
			"child-completeness-unknown": "Completeness of child-session evidence is unknown.",
			"details-are-previews": "Trace details are previews, not full commands.",
			"single-session-only": "The observation covers one session only.",
			"retained-entries-only": "Retained entries do not imply erased or external history.",
			"not-an-atomic-snapshot": "Reads are not an atomic cross-track snapshot.",
			"conflicting-observations": "Conflicting source observations were retained rather than resolved.",
			"no-trace-input": "No trace input was supplied.",
			"process-network-unobserved": "Process and network effects are not exhaustively observed.",
			"tool-and-background-only": "Current action rules cover tool/background evidence, not task quality.",
		},
		presentation: { section: "coverage" },
	},
	evaluate(input) {
		const findings: RuleFinding[] = [];
		for (const source of input.coverage) {
			if (!source.assessed) findings.push({ kind: "coverage-gap", subjectId: source.sourceId,
				code: source.reason ?? "runtime-read-failed", evidence: [] });
			for (const limit of source.limitations) findings.push({ kind: "coverage-gap", subjectId: source.sourceId,
				code: limit, evidence: [] });
		}
		for (const action of input.actions) {
			if (new Set(action.samples.map(sample => sample.terminal)).size > 1 ||
				new Set(action.samples.map(sample => sample.toolName)).size > 1 ||
				new Set(action.samples.map(sample => sample.errorReported)).size > 1) {
				findings.push({ kind: "coverage-gap", subjectId: action.id, code: "conflicting-observations",
					evidence: action.samples.map(sample => sample.evidence) });
			}
		}
		if (input.coverage.length === 0) findings.push({ kind: "coverage-gap", subjectId: "report", code: "no-trace-input", evidence: [] });
		findings.push({ kind: "coverage-gap", subjectId: "report", code: "process-network-unobserved", evidence: [] });
		findings.push({ kind: "coverage-gap", subjectId: "report", code: "tool-and-background-only", evidence: [] });
		return { status: "evaluated", findings };
	},
};
