import type { ActionObservation, ActionSample, AssuranceInput, AssuranceRule, EvidenceRef } from "../model";
import { actionRuleStatus } from "./shared";

function allSamplesMissing(action: ActionObservation): boolean {
	return action.samples.length > 0 && action.samples.every(sample => sample.terminal === "missing");
}

function backgroundJobId(sample: ActionSample): string | null {
	const prefix = `${sample.evidence.trackId}:bg:`;
	if (!sample.evidence.spanId.startsWith(prefix)) return null;
	const jobId = sample.evidence.spanId.slice(prefix.length);
	return jobId || null;
}

/**
 * OMP trace background span IDs are `${parentTrack}:bg:${jobId}`.
 * Async task job IDs are the child-agent IDs; nested child tracks are parent/job.
 * Return null unless the sample matches that exact structured trace shape.
 */
function taskChildTrack(sample: ActionSample): string | null {
	if (sample.toolName !== "task job") return null;
	const jobId = backgroundJobId(sample);
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

function hasObservedJobResolution(input: AssuranceInput, action: ActionObservation): boolean {
	if (!input.runtime?.jobResolutions.length) return false;
	const resolved = new Set(input.runtime.jobResolutions.map(item => item.jobId));
	return action.samples.some(sample => {
		const jobId = backgroundJobId(sample);
		return jobId !== null && resolved.has(jobId);
	});
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
		version: 2,
		title: "Unobserved resolution",
		description: "Promotes missing terminal observations into bounded attention findings unless another public runtime surface observes terminal job resolution.",
		messages: {
			"tool-resolution-unobserved": "A tool action has no observed terminal result.",
			"background-resolution-unobserved": "A background job has no observed async-result delivery or other terminal resolution.",
			"task-result-undelivered": "A task child yielded, but no async-result delivery or other terminal resolution is observed in the parent.",
		},
		presentation: { section: "attention", summaryLabel: "Resolution gaps" },
	},
	evaluate(input) {
		const findings = input.actions
			.filter(allSamplesMissing)
			.flatMap(action => {
				if (action.kind !== "background") {
					return [{
						kind: "resolution-gap",
						subjectId: action.id,
						code: "tool-resolution-unobserved",
						evidence: action.samples.map(sample => sample.evidence),
					}];
				}

				// A parent-observed terminal hub snapshot/cancel result closes the lifecycle
				// question even when the stats background span never received async-result.
				if (hasObservedJobResolution(input, action)) return [];

				const yieldRefs: EvidenceRef[] = [];
				for (const sample of action.samples) {
					const childTrack = taskChildTrack(sample);
					if (!childTrack) continue;
					yieldRefs.push(...yieldedEvidence(input, childTrack));
				}
				const taskYielded = yieldRefs.length > 0;
				return [{
					kind: "resolution-gap",
					subjectId: action.id,
					code: taskYielded ? "task-result-undelivered" : "background-resolution-unobserved",
					evidence: uniqueEvidence([
						...action.samples.map(sample => sample.evidence),
						...yieldRefs,
					]),
				}];
			});
		return { status: actionRuleStatus(input), findings };
	},
};
