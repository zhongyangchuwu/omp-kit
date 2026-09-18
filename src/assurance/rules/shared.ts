import type { AssuranceInput, RuleEvaluation, SourceCoverage } from "../model";

function coverageStatus(sources: readonly SourceCoverage[]): RuleEvaluation["status"] {
	const assessed = sources.filter(source => source.assessed).length;
	return assessed === 0 ? "skipped" : assessed < sources.length ? "partial" : "evaluated";
}

/** Rules that compose several public evidence surfaces use all supplied coverage. */
export function actionRuleStatus(input: AssuranceInput): RuleEvaluation["status"] {
	return coverageStatus(input.coverage);
}

/** Tool/terminal observations are trace-derived; unrelated runtime-read failure must not degrade them. */
export function traceActionRuleStatus(input: AssuranceInput): RuleEvaluation["status"] {
	const traces = input.coverage.filter(source =>
		source.scope.source === "omp-stats" && source.scope.view === "active-branch-trace");
	return coverageStatus(traces);
}
