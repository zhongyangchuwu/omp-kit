import type { AssuranceRule } from "../model";
import { traceActionRuleStatus } from "./shared";

export const toolErrorRule: AssuranceRule = {
	meta: {
		id: "omp-kit.tool-error",
		version: 1,
		title: "Tool-reported errors",
		description: "Reports tool spans that explicitly carry an error flag as review context, not an automatic attention trigger.",
		messages: {
			"tool-reported-error": "The tool explicitly reported an error.",
		},
		presentation: { section: "evidence", summaryLabel: "Tool errors reported" },
	},
	evaluate(input) {
		return {
			status: traceActionRuleStatus(input),
			findings: input.actions
				.filter(action => action.kind === "tool" && action.samples.some(sample => sample.errorReported))
				.map(action => ({
					kind: "tool-error",
					subjectId: action.id,
					code: "tool-reported-error",
					evidence: action.samples.filter(sample => sample.errorReported).map(sample => sample.evidence),
				})),
		};
	},
};
