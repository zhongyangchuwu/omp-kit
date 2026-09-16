import type { AssuranceInput, RuleEvaluation } from "../model";

/** Action rules distinguish no usable source from partially assessed input. */
export function actionRuleStatus(input: AssuranceInput): RuleEvaluation["status"] {
	const assessed = input.coverage.filter(source => source.assessed).length;
	return assessed === 0 ? "skipped" : assessed < input.coverage.length ? "partial" : "evaluated";
}
