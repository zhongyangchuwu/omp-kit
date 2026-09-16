import { assuranceId, type AssuranceRule, type RuleFinding } from "../model";
import type { ScopeBoundary, ScopeObservation } from "../scope/model";

const CODE: Record<Exclude<ScopeBoundary, "unknown">, string> = {
	workspace: "new-boundary-workspace",
	"host-user": "new-boundary-host-user",
	"host-system": "new-boundary-host-system",
	external: "new-boundary-external",
};

export const scopeExpansionRule: AssuranceRule = {
	meta: {
		id: "omp-kit.scope-expansion",
		version: 1,
		title: "Observed scope expansion",
		description: "Reports a scope boundary when it first appears after earlier classified activity on the same transcript.",
		messages: {
			"new-boundary-workspace": "Activity on this track later reached the workspace boundary for the first time.",
			"new-boundary-host-user": "Activity on this track later reached the host-user boundary for the first time.",
			"new-boundary-host-system": "Activity on this track later reached the host-system boundary for the first time.",
			"new-boundary-external": "Activity on this track later reached the external boundary for the first time.",
		},
		presentation: { section: "attention", summaryLabel: "New scope boundaries" },
	},
	evaluate(input) {
		const scope = input.scope;
		if (!scope || scope.traceCoverage === "unavailable") return { status: "skipped", findings: [] };
		const classified = scope.actionCoverage.filter(item => item.status === "classified");
		if (scope.actionCoverage.length > 0 && classified.length === 0) return { status: "skipped", findings: [] };
		const byTrack = new Map<string, ScopeObservation[]>();
		for (const observation of scope.observations) {
			if (observation.boundary === "unknown") continue;
			const list = byTrack.get(observation.trackKey) ?? [];
			list.push(observation);
			byTrack.set(observation.trackKey, list);
		}
		const findings: RuleFinding[] = [];
		for (const [trackKey, observations] of byTrack) {
			const byPosition = new Map<number, ScopeObservation[]>();
			for (const observation of observations) {
				const list = byPosition.get(observation.position) ?? [];
				list.push(observation);
				byPosition.set(observation.position, list);
			}
			const seen = new Set<Exclude<ScopeBoundary, "unknown">>();
			for (const position of [...byPosition.keys()].sort((a, b) => a - b)) {
				const group = byPosition.get(position) ?? [];
				const boundaries = [...new Set(group.map(item => item.boundary as Exclude<ScopeBoundary, "unknown">))].sort();
				if (seen.size > 0) {
					for (const boundary of boundaries) {
						if (seen.has(boundary)) continue;
						const evidence = group.filter(item => item.boundary === boundary).flatMap(item => item.evidence);
						findings.push({
							kind: "scope-expansion",
							subjectId: assuranceId("scope-expansion", trackKey, String(position), boundary),
							code: CODE[boundary],
							evidence,
						});
					}
				}
				for (const boundary of boundaries) seen.add(boundary);
			}
		}
		const partial = scope.traceCoverage === "partial" || scope.actionCoverage.some(item => item.status === "unclassified");
		return { status: partial ? "partial" : "evaluated", findings };
	},
};
