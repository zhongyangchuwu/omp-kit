import type { AssuranceRule } from "../model";
import { actionRuleStatus } from "./shared";

export const missingTerminalRule: AssuranceRule = {
	meta: {
		id: "omp-kit.terminal-missing",
		version: 1,
		title: "Missing terminal evidence",
		description: "Reports actions for which every available sample lacks terminal evidence.",
		messages: {
			"tool-terminal-missing": "Tool terminal evidence is missing.",
			"background-terminal-missing": "Background-task terminal evidence is missing.",
		},
		presentation: { section: "attention", summaryLabel: "Missing terminal evidence" },
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
