import type { AssuranceRule } from "../model";
import { actionRuleStatus } from "./shared";

export const missingTerminalRule: AssuranceRule = {
	meta: {
		id: "omp-kit.terminal-missing",
		version: 2,
		title: "Missing terminal observations",
		description: "Preserves actions for which every available sample lacks terminal evidence as supporting review evidence.",
		messages: {
			"tool-terminal-missing": "Tool terminal evidence is missing.",
			"background-terminal-missing": "Background-job async-result delivery is not observed.",
		},
		presentation: { section: "evidence", summaryLabel: "Missing terminal observations" },
	},
	evaluate(input) {
		return {
			status: actionRuleStatus(input),
			findings: input.actions
				.filter(action => action.samples.length > 0 && action.samples.every(sample => sample.terminal === "missing"))
				.map(action => ({
					kind: "terminal-missing",
					subjectId: action.id,
					code: action.kind === "background" ? "background-terminal-missing" : "tool-terminal-missing",
					evidence: action.samples.map(sample => sample.evidence),
				})),
		};
	},
};
