import type { ActionObservation, ActionSample, AssuranceInput, AssuranceRule, EvidenceRef } from "../model";
import { actionRuleStatus } from "./shared";

function allSamplesMissing(action: ActionObservation): boolean {
	return action.samples.length > 0 && action.samples.every(sample => sample.terminal === "missing");
}

/**
 * OMP 18.2.3 trace background span IDs are `${parentTrack}:bg:${jobId}`.
 * Async task job IDs are the child-agent IDs; nested child tracks are parent/job.
 * Return null unless the sample matches that exact structured trace shape.
 */
function taskChildTrack(sample: ActionSample): string | null {
	if (sample.toolName !== "task job") return null;
	const prefix = `${sample.evidence.trackId}:bg:`;
	if (!sample.evidence.spanId.startsWith(prefix)) return null;
	const jobId = sample.evidence.spanId.slice(prefix.length);
	if (!jobId) return null;
	return sample.evidence.trackId === "main" ? jobId : `${sample.evidence.trackId}/${jobId}`;
}

function yieldedEvidence(input: AssuranceInput, childTrackId: string): readonly EvidenceRef[] {
	const refs: EvidenceRef[] = [];
	for (const action of input.actions) {
		if (action.kind !== "tool") continue;
		for (const sample of action.samples) {
			if (sample.evidence.trackId !== childTrackId || sample.toolName !== "yield") continue;
			if (sample.terminal !== "observed" || sample.errorReported) continue;
			refs.push(sample.evidence);
		}
	}
	return refs;
}

function uniqueEvidence(refs: readonly EvidenceRef[]): readonly EvidenceRef[] {
	const byKey = new Map<string, EvidenceRef>();
	for (const ref of refs) byKey.set(JSON.stringify(ref), ref);
	return [...byKey.entries()]
		.sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
		.map(([, ref]) => ref);
}

export const resolutionGapRule: AssuranceRule = {
	meta: {
		id: "omp-kit.resolution-gap",
		version: 1,
		title: "Unobserved resolution",
		description: "Promotes missing terminal observations into bounded attention findings without claiming that work is still running or failed.",
		messages: {
			"tool-resolution-unobserved": "A tool action has no observed terminal result.",
			"background-resolution-unobserved": "A background job has no observed async-result delivery.",
			"task-result-undelivered": "A task child yielded, but no async-result delivery is observed in the parent trace.",
		},
		presentation: { section: "attention", summaryLabel: "Resolution gaps" },
	},
	evaluate(input) {
		const findings = input.actions
			.filter(allSamplesMissing)
			.map(action => {
				if (action.kind !== "background") {
					return {
						kind: "resolution-gap",
						subjectId: action.id,
						code: "tool-resolution-unobserved",
						evidence: action.samples.map(sample => sample.evidence),
					};
				}

				const yieldRefs: EvidenceRef[] = [];
				for (const sample of action.samples) {
					const childTrack = taskChildTrack(sample);
					if (!childTrack) continue;
					yieldRefs.push(...yieldedEvidence(input, childTrack));
				}
				const taskYielded = yieldRefs.length > 0;
				return {
					kind: "resolution-gap",
					subjectId: action.id,
					code: taskYielded ? "task-result-undelivered" : "background-resolution-unobserved",
					evidence: uniqueEvidence([
						...action.samples.map(sample => sample.evidence),
						...yieldRefs,
					]),
				};
			});
		return { status: actionRuleStatus(input), findings };
	},
};
